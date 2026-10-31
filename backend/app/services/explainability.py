import os
import cv2
import numpy as np
from PIL import Image as PILImage
from typing import Dict, Any, Tuple

def generate_probability_heatmap(
    prob_map: np.ndarray,
    output_path: str,
    colormap: int = cv2.COLORMAP_TURBO
) -> str:
    """
    Renders continuous change probability [0.0, 1.0] as a scientific thermal colormap image.
    """
    # Scale float [0, 1] to uint8 [0, 255]
    scaled = (np.clip(prob_map, 0.0, 1.0) * 255.0).astype(np.uint8)
    colored = cv2.applyColorMap(scaled, colormap)
    
    # Save as PNG
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    cv2.imwrite(output_path, colored)
    return output_path

def generate_change_overlay(
    base_img_path: str,
    binary_mask: np.ndarray,
    output_path: str,
    alpha: float = 0.45
) -> str:
    """
    Overlays detected changes as a semi-transparent vibrant electric-amber mask on the satellite base image.
    """
    base = cv2.imread(base_img_path)
    if base is None:
        # Generate neutral background if path invalid
        H, W = binary_mask.shape
        base = np.zeros((H, W, 3), dtype=np.uint8)
    else:
        base = cv2.resize(base, (binary_mask.shape[1], binary_mask.shape[0]))

    overlay = base.copy()
    # Electric Amber color in BGR: [30, 160, 255]
    overlay[binary_mask > 0] = [30, 160, 255]
    
    blended = cv2.addWeighted(overlay, alpha, base, 1.0 - alpha, 0)
    
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    cv2.imwrite(output_path, blended)
    return output_path

def compute_explainability_summary(prob_map: np.ndarray, threshold: float = 0.5) -> Dict[str, Any]:
    """
    Computes explainability confidence distribution:
    - High confidence detections (prob >= 0.85)
    - Moderate confidence detections (0.65 <= prob < 0.85)
    - Low confidence / ambiguous boundary detections (threshold <= prob < 0.65)
    """
    changed_probs = prob_map[prob_map >= threshold]
    total_changed = len(changed_probs)
    
    if total_changed == 0:
        return {
            "high_confidence_pct": 0.0,
            "moderate_confidence_pct": 0.0,
            "low_confidence_pct": 0.0,
            "mean_confidence": 0.0,
            "uncertainty_index": 0.0,
            "confidence_distribution": [0, 0, 0, 0, 0]
        }

    high_conf = np.sum(changed_probs >= 0.85)
    mod_conf = np.sum((changed_probs >= 0.65) & (changed_probs < 0.85))
    low_conf = np.sum(changed_probs < 0.65)
    
    # 5-bin histogram of changed probabilities
    hist, _ = np.histogram(changed_probs, bins=5, range=(threshold, 1.0))

    return {
        "high_confidence_pct": round(float(high_conf / total_changed * 100.0), 2),
        "moderate_confidence_pct": round(float(mod_conf / total_changed * 100.0), 2),
        "low_confidence_pct": round(float(low_conf / total_changed * 100.0), 2),
        "mean_confidence": round(float(np.mean(changed_probs)), 3),
        "uncertainty_index": round(float(np.std(changed_probs)), 3),
        "confidence_distribution": [int(x) for x in hist],
        "distinction_note": "Model confidence measures output layer activation certainty; geospatial measurement accuracy depends on sensor GSD and pixel alignment."
    }
