import os
import logging
from pathlib import Path
from typing import Dict, Any, Optional
import numpy as np
import rasterio
import cv2

logger = logging.getLogger("geointelligence.evaluation")

def evaluate_against_ground_truth(
    predicted_mask: np.ndarray,
    ground_truth_path: str,
    pixel_area_m2: float = 100.0 # 10m x 10m default for Sentinel-2
) -> Optional[Dict[str, Any]]:
    """
    Evaluates AI-predicted binary change mask against authentic ground-truth raster mask.
    Computes rigorous remote sensing metrics: Precision, Recall, Specificity, F1-Score,
    Intersection over Union (IoU), Overall Accuracy, and Cohen's Kappa.
    """
    if not ground_truth_path or not Path(ground_truth_path).exists():
        return None

    try:
        with rasterio.open(ground_truth_path) as src:
            gt_arr = src.read(1)

        # Ensure spatial dimension match
        pred_h, pred_w = predicted_mask.shape
        gt_h, gt_w = gt_arr.shape

        if (gt_h, gt_w) != (pred_h, pred_w):
            gt_arr = cv2.resize(gt_arr, (pred_w, pred_h), interpolation=cv2.INTER_NEAREST)

        y_true = (gt_arr > 0).astype(bool).flatten()
        y_pred = (predicted_mask > 0).astype(bool).flatten()

        tp = int(np.sum(y_true & y_pred))
        fp = int(np.sum(~y_true & y_pred))
        fn = int(np.sum(y_true & ~y_pred))
        tn = int(np.sum(~y_true & ~y_pred))
        total = tp + fp + fn + tn

        if total == 0:
            return None

        precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        specificity = tn / (tn + fp) if (tn + fp) > 0 else 0.0
        f1 = (2.0 * precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0
        iou = tp / (tp + fp + fn) if (tp + fp + fn) > 0 else 0.0
        accuracy = (tp + tn) / total

        # Cohen's Kappa Calculation
        p_o = accuracy
        p_e = (((tp + fp) * (tp + fn)) + ((tn + fp) * (tn + fn))) / (total * total)
        kappa = (p_o - p_e) / (1.0 - p_e) if (1.0 - p_e) > 0 else 0.0

        # Ground truth vs predicted area
        gt_pixels = int(np.sum(y_true))
        pred_pixels = int(np.sum(y_pred))
        gt_area_ha = round((gt_pixels * pixel_area_m2) / 10000.0, 3)
        pred_area_ha = round((pred_pixels * pixel_area_m2) / 10000.0, 3)
        area_diff_pct = round(abs(pred_area_ha - gt_area_ha) / max(gt_area_ha, 0.001) * 100.0, 2)

        return {
            "has_ground_truth": True,
            "confusion_matrix": {
                "true_positives": tp,
                "false_positives": fp,
                "false_negatives": fn,
                "true_negatives": tn
            },
            "metrics": {
                "precision": round(float(precision), 4),
                "recall": round(float(recall), 4),
                "specificity": round(float(specificity), 4),
                "f1_score": round(float(f1), 4),
                "iou": round(float(iou), 4),
                "overall_accuracy": round(float(accuracy), 4),
                "cohen_kappa": round(float(kappa), 4)
            },
            "area_comparison": {
                "ground_truth_pixels": gt_pixels,
                "predicted_pixels": pred_pixels,
                "ground_truth_area_ha": gt_area_ha,
                "predicted_area_ha": pred_area_ha,
                "area_error_percentage": area_diff_pct
            }
        }
    except Exception as e:
        logger.error(f"Error computing ground truth evaluation: {e}")
        return None
