import os
import logging
from typing import Dict, Any, Tuple
import numpy as np
import rasterio
from rasterio.warp import reproject, Resampling, calculate_default_transform
from rasterio.transform import from_bounds
import cv2

logger = logging.getLogger("geointelligence.preprocessing")

def check_spatial_compatibility(meta1: Dict[str, Any], meta2: Dict[str, Any]) -> Dict[str, Any]:
    """
    Evaluates whether two multi-temporal scenes have matching CRS, overlapping bounds,
    and compatible pixel resolutions.
    """
    crs_match = meta1.get("crs") == meta2.get("crs")
    res_diff = abs(meta1.get("resolution", 10.0) - meta2.get("resolution", 10.0))
    res_compatible = res_diff < 5.0 # within 5 meters tolerance
    
    b1 = meta1.get("bounds", {})
    b2 = meta2.get("bounds", {})
    
    # Check overlap in lat/lon
    overlap_x = max(0, min(b1.get("max_lon", 0), b2.get("max_lon", 0)) - max(b1.get("min_lon", 0), b2.get("min_lon", 0)))
    overlap_y = max(0, min(b1.get("max_lat", 0), b2.get("max_lat", 0)) - max(b1.get("min_lat", 0), b2.get("min_lat", 0)))
    has_overlap = (overlap_x > 0) and (overlap_y > 0)
    
    status = "COMPATIBLE" if (has_overlap and res_compatible) else "REQUIRES_ALIGNMENT"
    if not has_overlap:
        status = "INCOMPATIBLE_EXTENTS"
        
    return {
        "status": status,
        "crs_match": crs_match,
        "crs1": meta1.get("crs"),
        "crs2": meta2.get("crs"),
        "resolution_1": meta1.get("resolution"),
        "resolution_2": meta2.get("resolution"),
        "has_spatial_overlap": has_overlap,
        "overlap_dimensions": {"overlap_lon_deg": round(overlap_x, 5), "overlap_lat_deg": round(overlap_y, 5)}
    }

def align_and_load_rasters(
    path_t1: str,
    path_t2: str,
    target_shape: Tuple[int, int] = (512, 512)
) -> Tuple[np.ndarray, np.ndarray, Dict[str, Any]]:
    """
    Loads two multi-temporal images, reprojects/resamples them onto a common spatial grid
    and normalizes them to float32 tensors in [0, 1].
    Returns (img_t1, img_t2, geospatial_profile).
    """
    try:
        with rasterio.open(path_t1) as src1, rasterio.open(path_t2) as src2:
            # Determine target bounds (intersection)
            b1 = src1.bounds
            b2 = src2.bounds
            inter_left = max(b1.left, b2.left)
            inter_bottom = max(b1.bottom, b2.bottom)
            inter_right = min(b1.right, b2.right)
            inter_top = min(b1.top, b2.top)
            
            # If intersection is non-positive or rasters are in local space, use src1 geometry
            if (inter_right <= inter_left) or (inter_top <= inter_bottom):
                target_bounds = b1
            else:
                target_bounds = rasterio.coords.BoundingBox(inter_left, inter_bottom, inter_right, inter_top)
            
            target_crs = src1.crs or "EPSG:4326"
            target_transform = from_bounds(
                target_bounds.left, target_bounds.bottom, target_bounds.right, target_bounds.top,
                target_shape[1], target_shape[0]
            )
            
            count = min(src1.count, src2.count, 4)
            if count < 1:
                count = 3
                
            arr1 = np.zeros((count, target_shape[0], target_shape[1]), dtype=np.float32)
            arr2 = np.zeros((count, target_shape[0], target_shape[1]), dtype=np.float32)
            
            # Reproject src1
            for i in range(1, count + 1):
                reproject(
                    source=rasterio.band(src1, min(i, src1.count)),
                    destination=arr1[i - 1],
                    src_transform=src1.transform,
                    src_crs=src1.crs or target_crs,
                    dst_transform=target_transform,
                    dst_crs=target_crs,
                    resampling=Resampling.bilinear
                )
                
            # Reproject src2
            for i in range(1, count + 1):
                reproject(
                    source=rasterio.band(src2, min(i, src2.count)),
                    destination=arr2[i - 1],
                    src_transform=src2.transform,
                    src_crs=src2.crs or target_crs,
                    dst_transform=target_transform,
                    dst_crs=target_crs,
                    resampling=Resampling.bilinear
                )
                
            # Normalize each band to [0, 1]
            def normalize_tensor(arr: np.ndarray) -> np.ndarray:
                out = np.zeros_like(arr, dtype=np.float32)
                for b in range(arr.shape[0]):
                    band = arr[b]
                    p2, p98 = np.percentile(band, (2.0, 98.0))
                    if p98 > p2:
                        out[b] = np.clip((band - p2) / (p98 - p2), 0.0, 1.0)
                    else:
                        out[b] = np.clip(band / 255.0, 0.0, 1.0)
                return out

            norm1 = normalize_tensor(arr1)
            norm2 = normalize_tensor(arr2)
            
            geo_profile = {
                "crs": str(target_crs),
                "transform": target_transform,
                "bounds": [target_bounds.left, target_bounds.bottom, target_bounds.right, target_bounds.top],
                "width": target_shape[1],
                "height": target_shape[0],
                "channels": count
            }
            
            return norm1, norm2, geo_profile

    except Exception as e:
        logger.warning(f"Rasterio reprojection fallback to OpenCV/PIL due to: {e}")
        # Robust fallback for mock / non-geotiff images
        img1 = cv2.imread(path_t1)
        img2 = cv2.imread(path_t2)
        if img1 is None or img2 is None:
            raise ValueError(f"Could not read input image files: {path_t1}, {path_t2}")
            
        img1 = cv2.resize(cv2.cvtColor(img1, cv2.COLOR_BGR2RGB), target_shape)
        img2 = cv2.resize(cv2.cvtColor(img2, cv2.COLOR_BGR2RGB), target_shape)
        
        # Convert to CHW float32 [0, 1]
        norm1 = np.transpose(img1.astype(np.float32) / 255.0, (2, 0, 1))
        norm2 = np.transpose(img2.astype(np.float32) / 255.0, (2, 0, 1))
        
        geo_profile = {
            "crs": "EPSG:4326",
            "transform": from_bounds(1.4442, 43.6045, 1.4542, 43.6145, target_shape[1], target_shape[0]),
            "bounds": [1.4442, 43.6045, 1.4542, 43.6145],
            "width": target_shape[1],
            "height": target_shape[0],
            "channels": 3
        }
        return norm1, norm2, geo_profile

def assess_preprocessing_quality(
    norm1: np.ndarray,
    norm2: np.ndarray,
    geo_profile: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Computes quality assurance metrics:
    - Cloud/over-saturation estimation
    - Radiometric correlation
    - Spatial grid validity
    """
    # Over-saturated bright pixels (often clouds)
    sat1 = float(np.mean(norm1 > 0.95)) * 100.0
    sat2 = float(np.mean(norm2 > 0.95)) * 100.0
    
    # Zero / missing pixels
    zeros1 = float(np.mean(norm1 == 0.0)) * 100.0
    zeros2 = float(np.mean(norm2 == 0.0)) * 100.0
    
    # Cross-correlation of green band
    g1 = norm1[1].flatten() if norm1.shape[0] > 1 else norm1[0].flatten()
    g2 = norm2[1].flatten() if norm2.shape[0] > 1 else norm2[0].flatten()
    corr = float(np.corrcoef(g1, g2)[0, 1]) if np.std(g1) > 0 and np.std(g2) > 0 else 0.0
    
    quality_grade = "EXCELLENT"
    if sat1 > 20.0 or sat2 > 20.0:
        quality_grade = "CLOUD_CONTAMINATED"
    elif zeros1 > 15.0 or zeros2 > 15.0:
        quality_grade = "PARTIAL_NODATA"
    elif corr < 0.2:
        quality_grade = "SEVERE_ILLUMINATION_DIFFERENCE"
        
    return {
        "quality_grade": quality_grade,
        "cloud_saturation_pct_t1": round(sat1, 2),
        "cloud_saturation_pct_t2": round(sat2, 2),
        "nodata_pct_t1": round(zeros1, 2),
        "nodata_pct_t2": round(zeros2, 2),
        "temporal_correlation": round(corr, 3),
        "target_crs": geo_profile.get("crs"),
        "target_resolution_px": f"{geo_profile.get('width')}x{geo_profile.get('height')}"
    }
