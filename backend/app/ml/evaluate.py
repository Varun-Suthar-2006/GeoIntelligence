import numpy as np
from typing import Dict, Any, Union

def calculate_change_metrics(
    y_true: Union[np.ndarray, list],
    y_pred: Union[np.ndarray, list],
    threshold: float = 0.5
) -> Dict[str, Any]:
    """
    Computes rigorous remote sensing change detection evaluation metrics:
    Precision, Recall, F1-Score, IoU, and False Positive Rate (FPR).
    Strictly calculates real numerical metrics; never fabricates results.
    """
    y_t = np.asarray(y_true).astype(bool).flatten()
    if np.issubdtype(np.asarray(y_pred).dtype, np.floating):
        y_p = (np.asarray(y_pred) >= threshold).flatten()
    else:
        y_p = np.asarray(y_pred).astype(bool).flatten()

    tp = int(np.sum(y_t & y_p))
    fp = int(np.sum(~y_t & y_p))
    fn = int(np.sum(y_t & ~y_p))
    tn = int(np.sum(~y_t & ~y_p))

    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    f1 = (2.0 * precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0
    iou = tp / (tp + fp + fn) if (tp + fp + fn) > 0 else 0.0
    fpr = fp / (fp + tn) if (fp + tn) > 0 else 0.0
    accuracy = (tp + tn) / (tp + tn + fp + fn) if (tp + tn + fp + fn) > 0 else 0.0

    return {
        "true_positives": tp,
        "false_positives": fp,
        "false_negatives": fn,
        "true_negatives": tn,
        "precision": round(float(precision), 4),
        "recall": round(float(recall), 4),
        "f1_score": round(float(f1), 4),
        "iou": round(float(iou), 4),
        "false_positive_rate": round(float(fpr), 4),
        "overall_accuracy": round(float(accuracy), 4)
    }
