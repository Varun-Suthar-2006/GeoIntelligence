import numpy as np
from rasterio.transform import from_bounds
from backend.app.services.geospatial import polygonize_and_calculate_geometries

def test_polygonize_and_area_calculation():
    # 100x100 mask with 20x20 change block
    mask = np.zeros((100, 100), dtype=np.uint8)
    mask[30:50, 30:50] = 1
    
    class_map = np.zeros((100, 100), dtype=np.uint8)
    class_map[30:50, 30:50] = 1 # Deforestation
    
    prob_map = np.ones((100, 100), dtype=np.float32) * 0.9
    
    geo_profile = {
        "crs": "EPSG:4326",
        "transform": from_bounds(1.440, 43.600, 1.450, 43.610, 100, 100),
        "bounds": [1.440, 43.600, 1.450, 43.610],
        "width": 100,
        "height": 100,
        "resolution": 10.0
    }
    
    geojson, stats = polygonize_and_calculate_geometries(
        binary_mask=mask,
        class_map=class_map,
        prob_map=prob_map,
        geo_profile=geo_profile,
        min_area_m2=10.0
    )
    
    assert geojson["type"] == "FeatureCollection"
    assert len(geojson["features"]) >= 1
    feature = geojson["features"][0]
    assert feature["properties"]["change_type"] == "Deforestation / Vegetation Loss"
    assert feature["properties"]["area_ha"] > 0
    assert feature["properties"]["area_sq_m"] > 0
    assert stats["total_changed_ha"] > 0
    assert stats["polygon_count"] >= 1
    assert "EPSG:6933" in stats["area_calculation_crs"]
