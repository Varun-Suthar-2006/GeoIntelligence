import torch
import torch.nn as nn

class DiceLoss(nn.Module):
    """
    Continuous soft Dice Loss for extreme class imbalance in satellite change detection.
    Dice = (2 * |X n Y| + eps) / (|X| + |Y| + eps)
    Loss = 1 - Dice
    """
    def __init__(self, eps: float = 1e-6):
        super().__init__()
        self.eps = eps

    def forward(self, pred: torch.Tensor, target: torch.Tensor) -> torch.Tensor:
        # pred has already undergone sigmoid or is probabilities in [0, 1]
        pred_flat = pred.contiguous().view(-1)
        target_flat = target.contiguous().view(-1).float()
        
        intersection = (pred_flat * target_flat).sum()
        cardinality = pred_flat.sum() + target_flat.sum()
        
        dice = (2.0 * intersection + self.eps) / (cardinality + self.eps)
        return 1.0 - dice

class CombinedBCEDiceLoss(nn.Module):
    """
    Weighted combination of Binary Cross-Entropy (BCE) and Soft Dice Loss.
    """
    def __init__(self, bce_weight: float = 0.5, dice_weight: float = 0.5):
        super().__init__()
        self.bce_weight = bce_weight
        self.dice_weight = dice_weight
        self.bce = nn.BCELoss()
        self.dice = DiceLoss()

    def forward(self, pred: torch.Tensor, target: torch.Tensor) -> torch.Tensor:
        bce_loss = self.bce(pred, target.float())
        dice_loss = self.dice(pred, target.float())
        return self.bce_weight * bce_loss + self.dice_weight * dice_loss
