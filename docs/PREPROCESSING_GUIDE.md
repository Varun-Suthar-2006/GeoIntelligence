# GeoIntelligence AI — Satellite Preprocessing Pipeline Guide

## 1. Automated Preprocessing Workflow

```mermaid
flowchart TD
    A[Raw Satellite GeoTIFFs T1 & T2] --> B[Rasterio Metadata Extraction]
    B --> C{Check Spatial Compatibility}
    C -->|CRS / Resolution Mismatch| D[Reproject to Target Grid]
    C -->|Aligned| E[Resample to Matching Resolution]
    D --> E
    E --> F[Crop to Spatial Intersection Bounding Box]
    F --> G[Radiometric Percentile Normalization (2% - 98%)]
    G --> H[Cloud & Invalid NoData Evaluation]
    H --> I[Generate Quality Control Report]
    I --> J[Normalized Tensors [0, 1] Ready for AI Inference]
```

---

## 2. Spatial Alignment & Grid Co-Registration

Satellite acquisitions captured at differing dates often possess different spatial bounds, coordinate reference systems (e.g. UTM Zone 31N vs WGS84 Geographic), or slight pixel misalignments. 

GeoIntelligence AI enforces **automated spatial co-registration**:
1. **Target Grid Definition**:
   $$\text{Bounds}_{\text{target}} = \text{Bounds}(I_{t_1}) \cap \text{Bounds}(I_{t_2})$$
2. **Reprojection via Affine Geotransform**:
   Uses `rasterio.warp.reproject` with bilinear interpolation for continuous reflectance bands and nearest-neighbor interpolation for discrete land-cover masks.

---

## 3. Radiometric Normalization
To prevent false change alarms caused by sensor gain differences and seasonal illumination drift, raw 16-bit digital numbers (DN) are stretched using robust cumulative histogram trimming:
$$p_2 = \text{Percentile}(I, 2.0), \quad p_{98} = \text{Percentile}(I, 98.0)$$
$$I_{\text{norm}}(x, y) = \text{clip}\left(\frac{I(x, y) - p_2}{p_{98} - p_2 + \epsilon}, 0.0, 1.0\right)$$

---

## 4. Quality Control & Contamination Scoring
Before running AI change detection, the preprocessing module calculates:
- **Cloud/Over-Saturation Score**: Percentage of pixels with reflectance exceeding 0.95.
- **NoData Contamination**: Percentage of zero or missing pixel values.
- **Cross-Temporal Correlation**: Pearson correlation coefficient between green bands.
- **Quality Classification**: `EXCELLENT`, `CLOUD_CONTAMINATED`, `PARTIAL_NODATA`, or `SEVERE_ILLUMINATION_DIFFERENCE`.
