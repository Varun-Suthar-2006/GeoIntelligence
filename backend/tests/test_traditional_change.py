import numpy as np
import pytest
from backend.app.services.change_detection import change_detection_service

def test_traditional_change_detection_flat():
    # Identical images should yield near-zero change
    img1 = np.ones((3, 64, 64), dtype=np.float32) * 0.5
    img2 = np.ones((3, 64, 64), dtype=np.float32) * 0.5
    prob, mask, ms = change_detection_service.run_traditional_difference(img1, img2, threshold=0.5)
    assert mask.shape == (64, 64)
    assert np.sum(mask) == 0

def test_traditional_change_detection_with_change():
    img1 = np.zeros((3, 64, 64), dtype=np.float32)
    img2 = np.zeros((3, 64, 64), dtype=np.float32)
    # Inject 20x20 change block
    img2[:, 20:40, 20:40] = 1.0
    prob, mask, ms = change_detection_service.run_traditional_difference(img1, img2, threshold=0.3)
    assert np.sum(mask) > 0
    assert prob.max() > 0.8
