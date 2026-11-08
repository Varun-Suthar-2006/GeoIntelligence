import pytest
import numpy as np
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.services.evaluation import evaluate_against_ground_truth
from backend.app.services.stac_service import get_preset_hotspots

def test_stac_hotspots_endpoint():
    with TestClient(app) as client:
        resp = client.get("/api/v1/stac/hotspots")
        assert resp.status_code == 200
        hotspots = resp.json()
        assert len(hotspots) >= 5
        keys = [h["id"] for h in hotspots]
        assert "montpellier" in keys
        assert "valencia_flood" in keys
        assert "amazon_deforestation" in keys

def test_ground_truth_evaluation_metrics(tmp_path):
    import rasterio
    from rasterio.transform import from_bounds

    # Create dummy ground truth raster
    gt_file = tmp_path / "test_gt.tif"
    gt_arr = np.zeros((100, 100), dtype=np.uint8)
    gt_arr[20:40, 20:40] = 1 # 400 positive pixels

    transform = from_bounds(0, 0, 1, 1, 100, 100)
    with rasterio.open(
        str(gt_file), "w", driver="GTiff", height=100, width=100, count=1,
        dtype=np.uint8, crs="EPSG:4326", transform=transform
    ) as dst:
        dst.write(gt_arr, 1)

    # Perfect prediction
    pred_perfect = gt_arr.copy()
    res_perfect = evaluate_against_ground_truth(pred_perfect, str(gt_file))
    assert res_perfect is not None
    assert res_perfect["metrics"]["precision"] == 1.0
    assert res_perfect["metrics"]["recall"] == 1.0
    assert res_perfect["metrics"]["f1_score"] == 1.0
    assert res_perfect["metrics"]["cohen_kappa"] == 1.0
    assert res_perfect["confusion_matrix"]["true_positives"] == 400

    # Prediction with some FP and FN
    pred_imperfect = np.zeros((100, 100), dtype=np.uint8)
    pred_imperfect[20:35, 20:40] = 1 # 300 TP (100 FN)
    pred_imperfect[50:60, 50:60] = 1 # 100 FP

    res_imperfect = evaluate_against_ground_truth(pred_imperfect, str(gt_file))
    assert res_imperfect is not None
    assert res_imperfect["confusion_matrix"]["true_positives"] == 300
    assert res_imperfect["confusion_matrix"]["false_positives"] == 100
    assert res_imperfect["confusion_matrix"]["false_negatives"] == 100
    assert round(res_imperfect["metrics"]["precision"], 2) == 0.75
    assert round(res_imperfect["metrics"]["recall"], 2) == 0.75
    assert round(res_imperfect["metrics"]["f1_score"], 2) == 0.75

def test_oscd_images_in_database():
    with TestClient(app) as client:
        resp = client.get("/api/v1/images")
        assert resp.status_code == 200
        images = resp.json()
        assert len(images) >= 6
        filenames = [img["filename"] for img in images]
        assert any("montpellier" in fn for fn in filenames)
        assert any("beirut" in fn for fn in filenames)
        assert any("lasvegas" in fn for fn in filenames)
