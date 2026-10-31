import os
import pytest
import numpy as np
from pathlib import Path
from backend.app.services.acquisition import normalize_band_to_uint8, extract_raster_metadata
from backend.app.services.sample_data import create_synthetic_geotiff
from backend.app.config import settings

def test_normalize_band_to_uint8():
    band = np.array([[100, 200], [300, 400]], dtype=np.float32)
    norm = normalize_band_to_uint8(band)
    assert norm.shape == (2, 2)
    assert norm.dtype == np.uint8
    assert norm.max() <= 255
    assert norm.min() >= 0

def test_synthetic_geotiff_creation_and_metadata():
    test_path = str(settings.DATA_PATH / "test_scene.tif")
    try:
        create_synthetic_geotiff(test_path, size=128, change_type="deforestation")
        assert Path(test_path).exists()
        
        meta = extract_raster_metadata(test_path)
        assert meta["width"] == 128
        assert meta["height"] == 128
        assert meta["channels"] == 4
        assert "4326" in meta["crs"]
        assert "bounds" in meta
        assert meta["bounds"]["min_lat"] < meta["bounds"]["max_lat"]
    finally:
        if Path(test_path).exists():
            Path(test_path).unlink()
