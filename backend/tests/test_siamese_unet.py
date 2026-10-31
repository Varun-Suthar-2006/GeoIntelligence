import torch
import pytest
from backend.app.ml.siamese_unet import SiameseUNet
from backend.app.ml.loss import CombinedBCEDiceLoss

def test_siamese_unet_forward_shape():
    model = SiameseUNet(in_channels=3, base_filters=8)
    t1 = torch.rand(2, 3, 64, 64)
    t2 = torch.rand(2, 3, 64, 64)
    out = model(t1, t2)
    assert out.shape == (2, 1, 64, 64)
    assert out.min() >= 0.0
    assert out.max() <= 1.0

def test_siamese_unet_backward():
    model = SiameseUNet(in_channels=3, base_filters=8)
    criterion = CombinedBCEDiceLoss()
    t1 = torch.rand(1, 3, 32, 32)
    t2 = torch.rand(1, 3, 32, 32)
    target = torch.randint(0, 2, (1, 1, 32, 32)).float()
    
    out = model(t1, t2)
    loss = criterion(out, target)
    loss.backward()
    
    # Verify gradients computed
    assert model.outc[0].weight.grad is not None
