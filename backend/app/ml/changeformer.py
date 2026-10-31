import torch
import torch.nn as nn
import torch.nn.functional as F

class SpatialSelfAttention(nn.Module):
    """Multi-head spatial self-attention block with key-value reduction"""
    def __init__(self, dim: int, num_heads: int = 4, sr_ratio: int = 2):
        super().__init__()
        self.num_heads = num_heads
        self.head_dim = dim // num_heads
        self.scale = self.head_dim ** -0.5
        
        self.q = nn.Linear(dim, dim, bias=False)
        self.kv = nn.Linear(dim, dim * 2, bias=False)
        self.proj = nn.Linear(dim, dim)
        
        self.sr_ratio = sr_ratio
        if sr_ratio > 1:
            self.sr = nn.Conv2d(dim, dim, kernel_size=sr_ratio, stride=sr_ratio)
            self.norm = nn.LayerNorm(dim)

    def forward(self, x: torch.Tensor, H: int, W: int) -> torch.Tensor:
        B, N, C = x.shape
        q = self.q(x).reshape(B, N, self.num_heads, self.head_dim).permute(0, 2, 1, 3)
        
        if self.sr_ratio > 1:
            x_spatial = x.permute(0, 2, 1).reshape(B, C, H, W)
            x_sr = self.sr(x_spatial).reshape(B, C, -1).permute(0, 2, 1)
            x_sr = self.norm(x_sr)
            kv = self.kv(x_sr).reshape(B, -1, 2, self.num_heads, self.head_dim).permute(2, 0, 3, 1, 4)
        else:
            kv = self.kv(x).reshape(B, -1, 2, self.num_heads, self.head_dim).permute(2, 0, 3, 1, 4)
            
        k, v = kv[0], kv[1]
        
        attn = (q @ k.transpose(-2, -1)) * self.scale
        attn = attn.softmax(dim=-1)
        
        out = (attn @ v).transpose(1, 2).reshape(B, N, C)
        out = self.proj(out)
        return out

class TransformerBlock(nn.Module):
    def __init__(self, dim: int, num_heads: int = 4, sr_ratio: int = 2):
        super().__init__()
        self.norm1 = nn.LayerNorm(dim)
        self.attn = SpatialSelfAttention(dim, num_heads=num_heads, sr_ratio=sr_ratio)
        self.norm2 = nn.LayerNorm(dim)
        self.mlp = nn.Sequential(
            nn.Linear(dim, dim * 4),
            nn.GELU(),
            nn.Linear(dim * 4, dim)
        )

    def forward(self, x: torch.Tensor, H: int, W: int) -> torch.Tensor:
        x = x + self.attn(self.norm1(x), H, W)
        x = x + self.mlp(self.norm2(x))
        return x

class ChangeFormer(nn.Module):
    """
    Experimental Transformer-based Change Detection Architecture (ChangeFormer).
    Extracts multi-scale spatial tokens from both temporal acquisitions using
    shared spatial reduction self-attention blocks, and fuses cross-temporal tokens.
    """
    def __init__(self, in_channels: int = 3, out_channels: int = 1, embed_dim: int = 64):
        super().__init__()
        # Initial stem patch embedding
        self.patch_embed = nn.Sequential(
            nn.Conv2d(in_channels, embed_dim, kernel_size=7, stride=2, padding=3),
            nn.BatchNorm2d(embed_dim),
            nn.ReLU(inplace=True)
        )
        
        # Transformer stages
        self.stage1 = TransformerBlock(dim=embed_dim, num_heads=4, sr_ratio=4)
        self.down = nn.Sequential(
            nn.Conv2d(embed_dim, embed_dim * 2, kernel_size=3, stride=2, padding=1),
            nn.BatchNorm2d(embed_dim * 2),
            nn.ReLU(inplace=True)
        )
        self.stage2 = TransformerBlock(dim=embed_dim * 2, num_heads=8, sr_ratio=2)
        
        # Cross-temporal difference fusion head
        self.decoder_up1 = nn.ConvTranspose2d(embed_dim * 2 * 3, embed_dim, kernel_size=2, stride=2)
        self.decoder_up2 = nn.ConvTranspose2d(embed_dim * 4, embed_dim, kernel_size=2, stride=2)
        self.final_head = nn.Sequential(
            nn.Conv2d(embed_dim, 32, kernel_size=3, padding=1),
            nn.ReLU(inplace=True),
            nn.Conv2d(32, out_channels, kernel_size=1),
            nn.Sigmoid()
        )

    def extract_features(self, x: torch.Tensor):
        B = x.shape[0]
        p = self.patch_embed(x) # (B, C1, H/2, W/2)
        _, C1, H1, W1 = p.shape
        p_seq = p.flatten(2).transpose(1, 2)
        t1_seq = self.stage1(p_seq, H1, W1)
        t1_feat = t1_seq.transpose(1, 2).reshape(B, C1, H1, W1)
        
        d = self.down(t1_feat) # (B, C2, H/4, W/4)
        _, C2, H2, W2 = d.shape
        d_seq = d.flatten(2).transpose(1, 2)
        t2_seq = self.stage2(d_seq, H2, W2)
        t2_feat = t2_seq.transpose(1, 2).reshape(B, C2, H2, W2)
        
        return t1_feat, t2_feat

    def forward(self, x1: torch.Tensor, x2: torch.Tensor) -> torch.Tensor:
        orig_H, orig_W = x1.shape[2], x1.shape[3]
        f1_stage1, f1_stage2 = self.extract_features(x1)
        f2_stage1, f2_stage2 = self.extract_features(x2)
        
        diff2 = torch.abs(f1_stage2 - f2_stage2)
        diff1 = torch.abs(f1_stage1 - f2_stage1)
        
        # Fuse deep stage 2
        fused2 = torch.cat([f1_stage2, f2_stage2, diff2], dim=1)
        up2 = self.decoder_up1(fused2)
        
        # Match dimensions with stage 1 if needed
        if up2.shape[2:] != f1_stage1.shape[2:]:
            up2 = F.interpolate(up2, size=f1_stage1.shape[2:], mode="bilinear", align_corners=False)
            
        fused1 = torch.cat([f1_stage1, f2_stage1, diff1, up2], dim=1)
        up1 = self.decoder_up2(fused1)
        
        if up1.shape[2:] != (orig_H, orig_W):
            up1 = F.interpolate(up1, size=(orig_H, orig_W), mode="bilinear", align_corners=False)
            
        prob = self.final_head(up1)
        return prob
