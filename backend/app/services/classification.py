import numpy as np
from typing import Dict, Any, Tuple

def compute_spectral_index(band_a: np.ndarray, band_b: np.ndarray, eps: float = 1e-6) -> np.ndarray:
    """Normalized Difference index: (A - B) / (A + B + eps)"""
    denom = band_a + band_b + eps
    return (band_a - band_b) / denom

def classify_changed_regions(
    img1: np.ndarray,
    img2: np.ndarray,
    change_mask: np.ndarray
) -> Tuple[np.ndarray, Dict[str, float]]:
    """
    Classifies changed pixels into scientific land-cover transition categories:
    1: Deforestation / Vegetation Loss
    2: Flood / Water Inundation
    3: Urban Expansion / Construction
    4: Agricultural Land Change
    0: Unchanged / Unclassified Change

    Returns:
    - class_map: 2D array of integer class labels for every pixel
    - class_percentages: Dict mapping class names to their percentage share of the change
    """
    H, W = change_mask.shape
    class_map = np.zeros((H, W), dtype=np.uint8)
    
    changed_indices = (change_mask > 0)
    total_changed_pixels = np.sum(changed_indices)
    
    if total_changed_pixels == 0:
        return class_map, {
            "Deforestation / Vegetation Loss": 0.0,
            "Flood / Water Inundation": 0.0,
            "Urban Expansion": 0.0,
            "Agricultural Change": 0.0,
            "Unclassified Change": 0.0
        }

    channels = img1.shape[0]
    
    if channels >= 4:
        # Multi-spectral Sentinel-2: B1=Red, B2=Green, B3=Blue, B4=NIR (or standard band map)
        red1, green1, nir1 = img1[0], img1[1], img1[3]
        red2, green2, nir2 = img2[0], img2[1], img2[3]
        
        ndvi1 = compute_spectral_index(nir1, red1)
        ndvi2 = compute_spectral_index(nir2, red2)
        delta_ndvi = ndvi2 - ndvi1
        
        ndwi1 = compute_spectral_index(green1, nir1)
        ndwi2 = compute_spectral_index(green2, nir2)
        delta_ndwi = ndwi2 - ndwi1
        
        # Class 1: Deforestation / Vegetation Loss (large drop in NDVI)
        deforest_mask = changed_indices & (delta_ndvi < -0.20)
        class_map[deforest_mask] = 1
        
        # Class 2: Flood / Inundation (large rise in NDWI, water body expansion)
        flood_mask = changed_indices & (delta_ndwi > 0.20) & (class_map == 0)
        class_map[flood_mask] = 2
        
        # Class 3: Urban / Built-up (drop in vegetation with rise in red/soil reflectance)
        urban_mask = changed_indices & (delta_ndvi < -0.10) & ((red2 - red1) > 0.15) & (class_map == 0)
        class_map[urban_mask] = 3
        
        # Class 4: Agricultural change (moderate seasonal NDVI fluctuation)
        agri_mask = changed_indices & (np.abs(delta_ndvi) >= 0.10) & (class_map == 0)
        class_map[agri_mask] = 4
        
    else:
        # 3-band RGB imagery: derive Visible Atmospherically Resistant Index (VARI)
        # VARI = (Green - Red) / (Green + Red - Blue + eps)
        r1, g1, b1 = img1[0], img1[1], img1[2]
        r2, g2, b2 = img2[0], img2[1], img2[2]
        
        vari1 = (g1 - r1) / (g1 + r1 - b1 + 1e-5)
        vari2 = (g2 - r2) / (g2 + r2 - b2 + 1e-5)
        delta_vari = vari2 - vari1
        
        mean_brightness1 = np.mean(img1, axis=0)
        mean_brightness2 = np.mean(img2, axis=0)
        delta_brightness = mean_brightness2 - mean_brightness1
        
        # Deforestation: significant drop in greenness
        deforest_mask = changed_indices & (delta_vari < -0.15)
        class_map[deforest_mask] = 1
        
        # Flood: dark absorption drop in all visible bands
        flood_mask = changed_indices & (delta_brightness < -0.20) & (class_map == 0)
        class_map[flood_mask] = 2
        
        # Urban expansion: increase in bright concrete/roof surface reflectance
        urban_mask = changed_indices & (delta_brightness > 0.20) & (class_map == 0)
        class_map[urban_mask] = 3
        
        # Agricultural change
        agri_mask = changed_indices & (np.abs(delta_vari) >= 0.08) & (class_map == 0)
        class_map[agri_mask] = 4

    # Class 5: Unclassified (any remaining changed pixels with ambiguous spectral response)
    unclass_mask = changed_indices & (class_map == 0)
    class_map[unclass_mask] = 5

    # Compute breakdown percentages
    breakdown = {
        "Deforestation / Vegetation Loss": round(float(np.sum(class_map == 1) / total_changed_pixels * 100.0), 2),
        "Flood / Water Inundation": round(float(np.sum(class_map == 2) / total_changed_pixels * 100.0), 2),
        "Urban Expansion": round(float(np.sum(class_map == 3) / total_changed_pixels * 100.0), 2),
        "Agricultural Change": round(float(np.sum(class_map == 4) / total_changed_pixels * 100.0), 2),
        "Unclassified Change": round(float(np.sum(class_map == 5) / total_changed_pixels * 100.0), 2),
    }

    return class_map, breakdown
