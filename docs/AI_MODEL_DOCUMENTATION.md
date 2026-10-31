# GeoIntelligence AI — AI Model & Evaluation Documentation

## 1. Mathematical Formulation

### 1.1 Problem Statement
Given two co-registered multi-temporal satellite images acquired over the same geographical bounding box at times $t_1$ and $t_2$:
$$I_{t_1}, I_{t_2} \in \mathbb{R}^{H \times W \times C}$$
where $H, W$ denote the spatial height and width, and $C$ denotes the spectral band dimensionality ($C \ge 3$, e.g., RGB or multispectral Sentinel-2 $B02, B03, B04, B08$), our objective is to predict:
1. A binary change mask $M \in \{0, 1\}^{H \times W}$, where $M(x, y) = 1$ denotes a genuine surface alteration.
2. A change probability heatmap $P \in [0, 1]^{H \times W}$.
3. A semantic change classification matrix $C_{\text{class}}(x, y) \in \{ \text{Deforestation}, \text{Flood}, \text{Urban}, \text{Agriculture}, \text{Unclassified} \}$.

---

## 2. Model 1: Traditional Computer Vision Baseline

The baseline algorithm implements radiometric differencing with morphological post-processing:

1. **Radiometric Normalization**:
   $$I'_{t_k} = \frac{I_{t_k} - \mu_{t_k}}{\sigma_{t_k} + \epsilon}$$
2. **Spectral Distance Computation**:
   $$\Delta(x, y) = \sqrt{\sum_{c=1}^{C} \left(I'_{t_1}(x, y, c) - I'_{t_2}(x, y, c)\right)^2}$$
3. **Adaptive Thresholding**:
   $$T = \mu_\Delta + \alpha \cdot \sigma_\Delta \quad \text{or Otsu's optimal threshold}$$
4. **Morphological Filtering**:
   $$M_{\text{raw}} = \mathbb{I}(\Delta > T)$$
   $$M = (M_{\text{raw}} \circ K) \bullet K$$
   where $\circ$ is morphological opening (erosion followed by dilation) to suppress isolated speckle noise, and $\bullet$ is morphological closing (dilation followed by erosion) to bridge intra-object holes using a structuring element $K$ (e.g. $3 \times 3$ or $5 \times 5$ disk).

---

## 3. Model 2: Siamese U-Net Deep Learning Architecture

### 3.1 Network Topology
The Siamese U-Net consists of two weight-sharing encoder towers:
- **Encoder Tower $E_\theta$**: Extracts feature pyramids at 4 distinct spatial resolutions:
  $$F_{t_1}^{(l)} = E_\theta^{(l)}(I_{t_1}), \quad F_{t_2}^{(l)} = E_\theta^{(l)}(I_{t_2}) \quad \text{for } l \in \{1, 2, 3, 4\}$$
- **Feature Comparison Fusion**:
  At each level, difference features and concatenated representations are fused:
  $$D^{(l)} = |F_{t_1}^{(l)} - F_{t_2}^{(l)}|$$
  $$\tilde{F}^{(l)} = \text{Conv}_{1 \times 1}([F_{t_1}^{(l)} \,\|\, F_{t_2}^{(l)} \,\|\, D^{(l)}])$$
- **Decoder Tower $D_\phi$**:
  Progressively upsamples and reconstructs the spatial resolution using transposed convolutions with skip connections from $\tilde{F}^{(l)}$.
- **Final Classification Head**:
  A $1 \times 1$ convolution followed by Sigmoid activation:
  $$P(x, y) = \sigma(W_{\text{out}} * D_\phi^{(0)} + b_{\text{out}})$$

### 3.2 Loss Function
We optimize a composite objective balancing pixel-level cross-entropy with overlap-sensitive soft Dice loss:
$$\mathcal{L}_{\text{total}} = \alpha \mathcal{L}_{\text{BCE}} + \beta \mathcal{L}_{\text{Dice}}$$
where:
$$\mathcal{L}_{\text{BCE}} = -\frac{1}{N} \sum_{i=1}^{N} \left[ y_i \log p_i + (1 - y_i) \log(1 - p_i) \right]$$
$$\mathcal{L}_{\text{Dice}} = 1 - \frac{2 \sum_{i=1}^{N} p_i y_i + \epsilon}{\sum_{i=1}^{N} p_i + \sum_{i=1}^{N} y_i + \epsilon}$$
with $\alpha = 0.5, \beta = 0.5, \epsilon = 10^{-6}$.

---

## 4. Model 3: ChangeFormer (Transformer-Based Architecture)
- Employs hierarchical visual transformer encoders (Swin/Mix-FFN) with spatial reduction attention.
- Captures long-range spatial-temporal context beyond local convolutional receptive fields.
- Available as an experimental comparative architecture.

---

## 5. Evaluation Metrics & Scientific Rigor

Every model evaluation must report verified mathematical quantities:

- **True Positives ($TP$)**: Correctly identified changed pixels.
- **False Positives ($FP$)**: Unchanged pixels incorrectly labelled as changed.
- **False Negatives ($FN$)**: Changed pixels missed by the detector.
- **True Negatives ($TN$)**: Correctly identified unchanged pixels.

Metrics computed:
- **Precision**: $P = \frac{TP}{TP + FP}$
- **Recall**: $R = \frac{TP}{TP + FN}$
- **F1-Score**: $F_1 = \frac{2 \cdot P \cdot R}{P + R} = \frac{2 \cdot TP}{2 \cdot TP + FP + FN}$
- **Intersection over Union (IoU)**: $\text{IoU} = \frac{TP}{TP + FP + FN}$
- **False Positive Rate (FPR)**: $\text{FPR} = \frac{FP}{FP + TN}$
- **Inference Latency**: Milliseconds per $512 \times 512$ tile.

No benchmark metrics are fabricated. Synthetic and benchmark datasets report ground-truth validated scores only.
