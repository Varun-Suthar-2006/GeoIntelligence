import time
import logging
from pathlib import Path
from typing import Dict, Any, Tuple, Optional

import numpy as np
import torch
import cv2

from backend.app.config import settings
from backend.app.ml.siamese_unet import SiameseUNet
from backend.app.ml.changeformer import ChangeFormer

logger = logging.getLogger("geointelligence.change_detection")

class ChangeDetectionService:
    def __init__(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self._siamese_model: Optional[SiameseUNet] = None
        self._changeformer_model: Optional[ChangeFormer] = None
        self._loaded_weights_path: Optional[str] = None

    def run_traditional_difference(
        self,
        img1: np.ndarray,
        img2: np.ndarray,
        threshold: float = 0.5,
        kernel_size: int = 3
    ) -> Tuple[np.ndarray, np.ndarray, float]:
        """
        Baseline Traditional Image Difference Algorithm:
        1. Multi-band normalized Euclidean difference.
        2. Adaptive thresholding with configurable sensitivity.
        3. Morphological opening and closing for speckle noise suppression.
        Returns: (probability_map, binary_mask, elapsed_time_ms)
        """
        start = time.perf_counter()
        
        # Ensure shape is (C, H, W)
        if img1.ndim == 2:
            img1 = img1[np.newaxis, ...]
            img2 = img2[np.newaxis, ...]
            
        # Euclidean spectral distance across channels
        diff = np.sqrt(np.sum((img1 - img2) ** 2, axis=0))
        
        # Normalize difference to [0, 1]
        max_val = np.max(diff)
        min_val = np.min(diff)
        if max_val > min_val:
            prob_map = (diff - min_val) / (max_val - min_val)
        else:
            prob_map = np.zeros_like(diff, dtype=np.float32)
            
        # Binary thresholding
        raw_mask = (prob_map >= threshold).astype(np.uint8)
        
        # Morphological operations (opening removes isolated pixels, closing bridges gaps)
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (kernel_size, kernel_size))
        opened = cv2.morphologyEx(raw_mask, cv2.MORPH_OPEN, kernel)
        cleaned_mask = cv2.morphologyEx(opened, cv2.MORPH_CLOSE, kernel)
        
        elapsed_ms = (time.perf_counter() - start) * 1000.0
        return prob_map.astype(np.float32), cleaned_mask.astype(np.uint8), round(elapsed_ms, 2)

    def load_siamese_unet(self, weights_path: Optional[str] = None) -> SiameseUNet:
        """Loads and caches Siamese U-Net weights."""
        if weights_path is None:
            weights_path = str(settings.WEIGHTS_DIR / "siamese_unet_sentinel2.pt")
            
        if self._siamese_model is not None and self._loaded_weights_path == weights_path:
            return self._siamese_model
            
        model = SiameseUNet(in_channels=3, base_filters=16).to(self.device)
        
        if Path(weights_path).exists():
            try:
                checkpoint = torch.load(weights_path, map_location=self.device)
                if "model_state_dict" in checkpoint:
                    model.load_state_dict(checkpoint["model_state_dict"])
                else:
                    model.load_state_dict(checkpoint)
                logger.info(f"Loaded Siamese U-Net weights from {weights_path}")
            except Exception as e:
                logger.warning(f"Could not load checkpoint weights ({e}); using freshly initialized model.")
        else:
            logger.info("No checkpoint found; running Siamese U-Net with initialized weights.")
            
        model.eval()
        self._siamese_model = model
        self._loaded_weights_path = weights_path
        return self._siamese_model

    def run_siamese_unet_inference(
        self,
        img1: np.ndarray,
        img2: np.ndarray,
        threshold: float = 0.5,
        weights_path: Optional[str] = None
    ) -> Tuple[np.ndarray, np.ndarray, float]:
        """
        Runs Siamese U-Net inference on two normalized multi-spectral rasters.
        Returns: (probability_map, binary_mask, elapsed_time_ms)
        """
        start = time.perf_counter()
        model = self.load_siamese_unet(weights_path)
        
        # Take first 3 channels for RGB/CIR Siamese model
        x1 = img1[:3]
        x2 = img2[:3]
        
        t1 = torch.from_numpy(x1).unsqueeze(0).to(self.device).float()
        t2 = torch.from_numpy(x2).unsqueeze(0).to(self.device).float()
        
        with torch.no_grad():
            prob_tensor = model(t1, t2)
            prob_map = prob_tensor.squeeze().cpu().numpy()
            
        binary_mask = (prob_map >= threshold).astype(np.uint8)
        elapsed_ms = (time.perf_counter() - start) * 1000.0
        return prob_map.astype(np.float32), binary_mask, round(elapsed_ms, 2)

    def run_changeformer_inference(
        self,
        img1: np.ndarray,
        img2: np.ndarray,
        threshold: float = 0.5
    ) -> Tuple[np.ndarray, np.ndarray, float]:
        """
        Runs experimental ChangeFormer inference with multi-head self-attention.
        Returns: (probability_map, binary_mask, elapsed_time_ms)
        """
        start = time.perf_counter()
        if self._changeformer_model is None:
            self._changeformer_model = ChangeFormer(in_channels=3, embed_dim=32).to(self.device)
            self._changeformer_model.eval()
            
        x1 = img1[:3]
        x2 = img2[:3]
        t1 = torch.from_numpy(x1).unsqueeze(0).to(self.device).float()
        t2 = torch.from_numpy(x2).unsqueeze(0).to(self.device).float()
        
        with torch.no_grad():
            prob_tensor = self._changeformer_model(t1, t2)
            prob_map = prob_tensor.squeeze().cpu().numpy()
            
        binary_mask = (prob_map >= threshold).astype(np.uint8)
        elapsed_ms = (time.perf_counter() - start) * 1000.0
        return prob_map.astype(np.float32), binary_mask, round(elapsed_ms, 2)

change_detection_service = ChangeDetectionService()
