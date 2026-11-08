import pytest
import numpy as np
from backend.app.services.sar_service import sar_processor
from backend.app.services.cloud_masking import cloud_engine

def test_sar_processor_simulation():
    res = sar_processor.compute_sar_change(raster_shape=(128, 128))
    assert res["mode"] == "SYNTHETIC_APERTURE_RADAR_MICROWAVE"
    assert res["all_weather_penetration"] is True
    assert "flood_inundation_detection" in res
    assert res["flood_inundation_detection"]["inundated_area_hectares"] > 0
    assert res["cloud_attenuation_loss_db"] == 0.0

def test_sar_decibel_calibration():
    # Amplitude of 1.0 -> 0 dB
    arr = np.array([1.0, 0.1, 10.0], dtype=np.float32)
    db = sar_processor.calibrate_to_decibels(arr)
    assert np.isclose(db[0], 0.0, atol=0.1)
    assert np.isclose(db[1], -20.0, atol=0.1)
    assert np.isclose(db[2], 10.0, atol=0.1)

def test_cloud_screening_invalid_path():
    res = cloud_engine.detect_clouds_and_shadows("non_existent_file.tif")
    assert res["status"] == "ERROR"
    assert res["clear_pct"] == 100.0
