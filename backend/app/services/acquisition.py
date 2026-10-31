import os
import uuid
import logging
from pathlib import Path
from datetime import datetime, timezone
from typing import Dict, Any, Tuple, Optional

import numpy as np
import rasterio
from rasterio.warp import transform_bounds
from PIL import Image as PILImage

from backend.app.config import settings

logger = logging.getLogger("geointelligence.acquisition")

def normalize_band_to_uint8(band: np.ndarray, lower_pct: float = 2.0, upper_pct: float = 98.0) -> np.ndarray:
    """
    Applies percentile radiometric stretch to a raw satellite band and scales to uint8 [0, 255].
    """
    valid_mask = np.isfinite(band) & (band > 0)
    if not np.any(valid_mask):
        return np.zeros_like(band, dtype=np.uint8)
    
    p_low = np.percentile(band[valid_mask], lower_pct)
    p_high = np.percentile(band[valid_mask], upper_pct)
    
    if p_high <= p_low:
        p_high = p_low + 1.0
        
    clipped = np.clip(band, p_low, p_high)
    stretched = ((clipped - p_low) / (p_high - p_low) * 255.0).astype(np.uint8)
    return stretched

def extract_raster_metadata(file_path: str) -> Dict[str, Any]:
    """
    Reads GeoTIFF or standard image file and extracts geospatial bounds, CRS, and radiometric metadata.
    """
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"Raster file not found: {file_path}")

    try:
        with rasterio.open(file_path) as src:
            crs_str = str(src.crs) if src.crs else "EPSG:4326"
            bounds = src.bounds
            
            # Reproject bounding box to WGS84 (EPSG:4326) for Leaflet map display
            if src.crs and str(src.crs) != "EPSG:4326":
                try:
                    wgs84_bounds = transform_bounds(src.crs, "EPSG:4326", *bounds)
                    min_lon, min_lat, max_lon, max_lat = wgs84_bounds
                except Exception as e:
                    logger.warning(f"Could not reproject bounds to EPSG:4326: {e}")
                    min_lon, min_lat, max_lon, max_lat = bounds.left, bounds.bottom, bounds.right, bounds.top
            else:
                min_lon, min_lat, max_lon, max_lat = bounds.left, bounds.bottom, bounds.right, bounds.top

            # Approximate resolution in meters
            res = abs(src.res[0])
            if "4326" in crs_str:
                # 1 degree is roughly 111,320 meters at the equator
                res = res * 111320.0

            band_info = []
            for i in range(1, src.count + 1):
                band_info.append({
                    "band_index": i,
                    "dtype": str(src.dtypes[i - 1]),
                    "nodata": src.nodatavals[i - 1]
                })

            return {
                "width": src.width,
                "height": src.height,
                "channels": src.count,
                "crs": crs_str,
                "resolution": round(res, 2),
                "bounds": {
                    "min_lat": float(min_lat),
                    "min_lon": float(min_lon),
                    "max_lat": float(max_lat),
                    "max_lon": float(max_lon)
                },
                "affine_transform": [float(x) for x in list(src.transform)[:6]],
                "band_metadata": {
                    "bands": band_info,
                    "driver": src.driver,
                    "nodata": src.nodata
                }
            }
    except Exception as e:
        logger.warning(f"Failed to open with rasterio ({e}), falling back to PIL image extraction.")
        with PILImage.open(file_path) as img:
            w, h = img.size
            channels = len(img.getbands())
            # Default bounds for demonstration if not georeferenced
            return {
                "width": w,
                "height": h,
                "channels": channels,
                "crs": "Local-Grid (Non-Georeferenced)",
                "resolution": 10.0,
                "bounds": {
                    "min_lat": 43.6045,
                    "min_lon": 1.4442,
                    "max_lat": 43.6145,
                    "max_lon": 1.4542
                },
                "affine_transform": [10.0, 0.0, 1.4442, 0.0, -10.0, 43.6145],
                "band_metadata": {
                    "bands": [{"band_index": i+1, "dtype": "uint8"} for i in range(channels)],
                    "driver": "PIL",
                    "nodata": None
                }
            }

def generate_preview_image(file_path: str, output_preview_path: str, composite_type: str = "RGB") -> str:
    """
    Generates a web-optimized PNG preview from a multi-band satellite raster.
    composite_type: "RGB" (B4, B3, B2) or "CIR" / "FALSE_COLOR" (B8, B4, B3).
    """
    try:
        with rasterio.open(file_path) as src:
            count = src.count
            if count >= 3:
                if composite_type.upper() in ["CIR", "FALSE_COLOR"] and count >= 4:
                    # B8 (NIR), B4 (Red), B3 (Green) -> index 4, 3, 2 in 4-band rasters
                    r = normalize_band_to_uint8(src.read(4))
                    g = normalize_band_to_uint8(src.read(3))
                    b = normalize_band_to_uint8(src.read(2))
                else:
                    r = normalize_band_to_uint8(src.read(1))
                    g = normalize_band_to_uint8(src.read(2))
                    b = normalize_band_to_uint8(src.read(3))
                rgb_arr = np.dstack((r, g, b))
            else:
                gray = normalize_band_to_uint8(src.read(1))
                rgb_arr = np.dstack((gray, gray, gray))
            
            img = PILImage.fromarray(rgb_arr)
            # Resize if excessively large for snappy UI thumbnail
            if max(img.size) > 1024:
                img.thumbnail((1024, 1024), PILImage.Resampling.LANCZOS)
            
            os.makedirs(os.path.dirname(output_preview_path), exist_ok=True)
            img.save(output_preview_path, format="PNG")
            return output_preview_path
    except Exception as e:
        logger.warning(f"Preview generation via rasterio failed ({e}), attempting standard image conversion.")
        with PILImage.open(file_path) as img:
            rgb = img.convert("RGB")
            if max(rgb.size) > 1024:
                rgb.thumbnail((1024, 1024), PILImage.Resampling.LANCZOS)
            os.makedirs(os.path.dirname(output_preview_path), exist_ok=True)
            rgb.save(output_preview_path, format="PNG")
            return output_preview_path
