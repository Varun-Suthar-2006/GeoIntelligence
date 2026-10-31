import torch
import torch.nn as nn
import torch.nn.functional as F

class DoubleConv(nn.Module):
    """(Convolution => BatchNorm => ReLU) * 2"""
    def __init__(self, in_channels: int, out_channels: int):
        super().__init__()
        self.conv = nn.Sequential(
            nn.Conv2d(in_channels, out_channels, kernel_size=3, padding=1, bias=False),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True),
            nn.Conv2d(out_channels, out_channels, kernel_size=3, padding=1, bias=False),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True)
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.conv(x)

class SiameseEncoder(nn.Module):
    """Hierarchical 4-stage convolutional feature extraction tower"""
    def __init__(self, in_channels: int = 3, base_filters: int = 32):
        super().__init__()
        self.inc = DoubleConv(in_channels, base_filters)
        self.down1 = nn.Sequential(nn.MaxPool2d(2), DoubleConv(base_filters, base_filters * 2))
        self.down2 = nn.Sequential(nn.MaxPool2d(2), DoubleConv(base_filters * 2, base_filters * 4))
        self.down3 = nn.Sequential(nn.MaxPool2d(2), DoubleConv(base_filters * 4, base_filters * 8))
        self.down4 = nn.Sequential(nn.MaxPool2d(2), DoubleConv(base_filters * 8, base_filters * 8))

    def forward(self, x: torch.Tensor):
        x1 = self.inc(x)
        x2 = self.down1(x1)
        x3 = self.down2(x2)
        x4 = self.down3(x3)
        x5 = self.down4(x4)
        return x1, x2, x3, x4, x5

class UpBlock(nn.Module):
    """Upscaling then double conv with skip connection concatenation"""
    def __init__(self, in_channels_up: int, in_channels_skip: int, out_channels: int):
        super().__init__()
        self.up = nn.ConvTranspose2d(in_channels_up, in_channels_up // 2, kernel_size=2, stride=2)
        total_in = (in_channels_up // 2) + in_channels_skip
        self.conv = DoubleConv(total_in, out_channels)

    def forward(self, x1: torch.Tensor, x2: torch.Tensor) -> torch.Tensor:
        x1 = self.up(x1)
        diff_y = x2.size()[2] - x1.size()[2]
        diff_x = x2.size()[3] - x1.size()[3]
        x1 = F.pad(x1, [diff_x // 2, diff_x - diff_x // 2, diff_y // 2, diff_y - diff_y // 2])
        x = torch.cat([x2, x1], dim=1)
        return self.conv(x)

class SiameseUNet(nn.Module):
    """
    Research-grade Siamese U-Net for multi-temporal satellite change detection.
    Encoders share weights for t1 and t2 to extract canonical representations.
    Decoder synthesizes difference features and spatial context to yield calibrated change probabilities.
    """
    def __init__(self, in_channels: int = 3, out_channels: int = 1, base_filters: int = 32):
        super().__init__()
        self.encoder = SiameseEncoder(in_channels=in_channels, base_filters=base_filters)
        
        # Level 4 bottleneck difference fusion: [f1, f2, |f1 - f2|]
        bottleneck_in = (base_filters * 8) * 3
        self.bottleneck_fuse = nn.Sequential(
            nn.Conv2d(bottleneck_in, base_filters * 8, kernel_size=1),
            nn.BatchNorm2d(base_filters * 8),
            nn.ReLU(inplace=True)
        )
        
        # Skip connection fusion layers
        self.fuse3 = nn.Conv2d((base_filters * 8) * 3, base_filters * 4, kernel_size=1)
        self.fuse2 = nn.Conv2d((base_filters * 4) * 3, base_filters * 2, kernel_size=1)
        self.fuse1 = nn.Conv2d((base_filters * 2) * 3, base_filters, kernel_size=1)
        self.fuse0 = nn.Conv2d(base_filters * 3, base_filters, kernel_size=1)
        
        # Decoder stages:
        # up1: up from bottleneck (8*B -> 4*B) + skip3 (4*B) => 8*B total -> 4*B out
        self.up1 = UpBlock(base_filters * 8, base_filters * 4, base_filters * 4)
        # up2: up from d1 (4*B -> 2*B) + skip2 (2*B) => 4*B total -> 2*B out
        self.up2 = UpBlock(base_filters * 4, base_filters * 2, base_filters * 2)
        # up3: up from d2 (2*B -> 1*B) + skip1 (1*B) => 2*B total -> 1*B out
        self.up3 = UpBlock(base_filters * 2, base_filters, base_filters)
        # up4: up from d3 (1*B -> 1*B) + skip0 (1*B) => 2*B total -> 1*B out
        self.up4 = UpBlock(base_filters, base_filters, base_filters)
        
        # Output classification head
        self.outc = nn.Sequential(
            nn.Conv2d(base_filters, out_channels, kernel_size=1),
            nn.Sigmoid()
        )

    def forward(self, x1: torch.Tensor, x2: torch.Tensor) -> torch.Tensor:
        # Extract Siamese representations
        f1_0, f1_1, f1_2, f1_3, f1_4 = self.encoder(x1)
        f2_0, f2_1, f2_2, f2_3, f2_4 = self.encoder(x2)
        
        # Fuse bottleneck with difference feature
        diff_4 = torch.abs(f1_4 - f2_4)
        bottleneck = self.bottleneck_fuse(torch.cat([f1_4, f2_4, diff_4], dim=1))
        
        # Fuse multi-scale skips
        diff_3 = torch.abs(f1_3 - f2_3)
        skip_3 = self.fuse3(torch.cat([f1_3, f2_3, diff_3], dim=1))
        
        diff_2 = torch.abs(f1_2 - f2_2)
        skip_2 = self.fuse2(torch.cat([f1_2, f2_2, diff_2], dim=1))
        
        diff_1 = torch.abs(f1_1 - f2_1)
        skip_1 = self.fuse1(torch.cat([f1_1, f2_1, diff_1], dim=1))
        
        diff_0 = torch.abs(f1_0 - f2_0)
        skip_0 = self.fuse0(torch.cat([f1_0, f2_0, diff_0], dim=1))
        
        # Decode
        d1 = self.up1(bottleneck, skip_3)
        d2 = self.up2(d1, skip_2)
        d3 = self.up3(d2, skip_1)
        d4 = self.up4(d3, skip_0)
        
        prob_map = self.outc(d4)
        return prob_map
