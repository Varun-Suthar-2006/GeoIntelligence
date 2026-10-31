import logging
from typing import Dict, Any, List, Tuple
import numpy as np
import rasterio.features
from shapely.geometry import shape, mapping, Polygon, MultiPolygon
from shapely.ops import transform
import pyproj

logger = logging.getLogger("geointelligence.geospatial")

CLASS_NAMES = {
    1: "Deforestation / Vegetation Loss",
    2: "Flood / Water Inundation",
    3: "Urban Expansion",
    4: "Agricultural Change",
    5: "Unclassified Change"
}

def get_equal_area_transformer(source_crs_str: str) -> pyproj.Transformer:
    """
    Returns a PyProj coordinate transformer from source CRS to an equal-area projection
    (World Cylindrical Equal Area EPSG:6933) to ensure scientifically accurate metric area calculation.
    """
    try:
        source_crs = pyproj.CRS(source_crs_str)
        # EPSG:6933: World Cylindrical Equal Area (WGS 84 based equal-area metric projection)
        target_crs = pyproj.CRS("EPSG:6933")
        return pyproj.Transformer.from_crs(source_crs, target_crs, always_xy=True)
    except Exception as e:
        logger.warning(f"Error creating transformer from {source_crs_str} to EPSG:6933 ({e}). Using Web Mercator.")
        return pyproj.Transformer.from_crs("EPSG:4326", "EPSG:3857", always_xy=True)

def polygonize_and_calculate_geometries(
    binary_mask: np.ndarray,
    class_map: np.ndarray,
    prob_map: np.ndarray,
    geo_profile: Dict[str, Any],
    min_area_m2: float = 200.0
) -> Tuple[Dict[str, Any], Dict[str, Any]]:
    """
    1. Converts binary change raster mask into vector polygons using rasterio.features.shapes.
    2. Calculates true metric area in projected coordinate system (EPSG:6933 equal-area).
    3. Suppresses insignificant pixel noise below min_area_m2.
    4. Generates RFC 7946 GeoJSON FeatureCollection.
    5. Calculates total scene area, total changed area, and class-wise breakdown.
    """
    affine_transform = geo_profile.get("transform")
    crs_str = geo_profile.get("crs", "EPSG:4326")
    
    # Transformer for accurate equal-area metric measurements
    metric_transformer = get_equal_area_transformer(crs_str)
    
    # Transformer to convert geometry to WGS84 for GeoJSON/Leaflet if not already in 4326
    to_wgs84 = None
    if crs_str != "EPSG:4326" and "4326" not in crs_str:
        try:
            to_wgs84 = pyproj.Transformer.from_crs(crs_str, "EPSG:4326", always_xy=True)
        except Exception as e:
            logger.warning(f"Could not build to_wgs84 transformer: {e}")

    features = []
    total_changed_m2 = 0.0
    class_areas_m2 = {name: 0.0 for name in CLASS_NAMES.values()}
    confidences = []

    # Extract shapes where binary_mask == 1
    shapes_generator = rasterio.features.shapes(
        binary_mask.astype(np.int16),
        mask=(binary_mask > 0),
        transform=affine_transform
    )

    for geom_dict, val in shapes_generator:
        if val == 0:
            continue
            
        geom = shape(geom_dict)
        if geom.is_empty or not geom.is_valid:
            geom = geom.buffer(0) # heal invalid self-intersections
            if geom.is_empty:
                continue

        # Project to Equal-Area CRS to compute real ground area in square meters
        try:
            geom_metric = transform(metric_transformer.transform, geom)
            area_m2 = float(geom_metric.area)
        except Exception:
            # Fallback planar estimation using resolution
            res = geo_profile.get("resolution", 10.0)
            area_m2 = float(geom.area) * (res ** 2)

        # Filter out noise polygons smaller than the minimum mapping unit
        if area_m2 < min_area_m2:
            continue

        # Determine dominant land-cover transition class within this polygon
        # Sample raster mask within polygon bounds
        try:
            poly_mask = rasterio.features.geometry_mask(
                [geom],
                out_shape=binary_mask.shape,
                transform=affine_transform,
                invert=True
            )
            sampled_classes = class_map[poly_mask]
            sampled_probs = prob_map[poly_mask]
            
            if len(sampled_classes) > 0:
                # Most frequent non-zero class
                non_zero = sampled_classes[sampled_classes > 0]
                dom_class_id = int(np.bincount(non_zero).argmax()) if len(non_zero) > 0 else 5
                mean_conf = float(np.mean(sampled_probs)) if len(sampled_probs) > 0 else 0.5
            else:
                dom_class_id = 5
                mean_conf = 0.5
        except Exception:
            dom_class_id = 5
            mean_conf = 0.5

        class_name = CLASS_NAMES.get(dom_class_id, "Unclassified Change")
        total_changed_m2 += area_m2
        class_areas_m2[class_name] += area_m2
        confidences.append(mean_conf)

        # Convert geometry to standard WGS84 for Leaflet GeoJSON
        if to_wgs84:
            geom_wgs84 = transform(to_wgs84.transform, geom)
        else:
            geom_wgs84 = geom

        feature = {
            "type": "Feature",
            "properties": {
                "change_type": class_name,
                "area_sq_m": round(area_m2, 1),
                "area_ha": round(area_m2 / 10000.0, 3),
                "area_sq_km": round(area_m2 / 1000000.0, 4),
                "confidence": round(mean_conf, 3),
                "crs_used_for_area": "EPSG:6933 (World Equal Area)"
            },
            "geometry": mapping(geom_wgs84)
        }
        features.append(feature)

    geojson_collection = {
        "type": "FeatureCollection",
        "features": features
    }

    # Total scene area in square meters
    total_pixels = binary_mask.size
    changed_pixels = np.sum(binary_mask > 0)
    change_pct = float((changed_pixels / total_pixels) * 100.0) if total_pixels > 0 else 0.0

    # Calculate overall scene area
    scene_bounds = geo_profile.get("bounds", [0, 0, 1, 1])
    try:
        scene_geom = Polygon([
            (scene_bounds[0], scene_bounds[1]),
            (scene_bounds[2], scene_bounds[1]),
            (scene_bounds[2], scene_bounds[3]),
            (scene_bounds[0], scene_bounds[3]),
            (scene_bounds[0], scene_bounds[1])
        ])
        scene_metric = transform(metric_transformer.transform, scene_geom)
        total_scene_m2 = float(scene_metric.area)
    except Exception:
        total_scene_m2 = total_changed_m2 / (change_pct / 100.0) if change_pct > 0 else 100000.0

    summary_stats = {
        "total_changed_sq_m": round(total_changed_m2, 1),
        "total_changed_ha": round(total_changed_m2 / 10000.0, 3),
        "total_changed_sq_km": round(total_changed_m2 / 1000000.0, 4),
        "total_scene_ha": round(total_scene_m2 / 10000.0, 2),
        "change_percentage": round(change_pct, 2),
        "polygon_count": len(features),
        "area_calculation_crs": "EPSG:6933 (Equal-Area Metric Projection)",
        "class_breakdown_ha": {k: round(v / 10000.0, 3) for k, v in class_areas_m2.items()},
        "confidence_summary": {
            "mean": round(float(np.mean(confidences)), 3) if confidences else 0.0,
            "std": round(float(np.std(confidences)), 3) if confidences else 0.0,
            "min": round(float(np.min(confidences)), 3) if confidences else 0.0,
            "max": round(float(np.max(confidences)), 3) if confidences else 0.0
        }
    }

    return geojson_collection, summary_stats
