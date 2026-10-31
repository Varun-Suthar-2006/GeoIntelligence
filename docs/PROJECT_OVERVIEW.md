# GeoIntelligence AI — Project Overview & Research Framework

## Abstract
**GeoIntelligence AI** is an advanced Earth Observation (EO) research and operational software system engineered for multi-temporal satellite surface change detection, semantic land-cover transition classification, and rigorous metric area quantification. By synthesizing physical remote sensing principles with deep convolutional Siamese U-Nets and visual transformer architectures (ChangeFormer), the platform enables researchers and geospatial analysts to detect, quantify, and explain terrestrial changes—ranging from deforestation and flood inundation to urban expansion and agricultural shifts.

---

## 1. Introduction & Problem Statement
With the rapid cadence of multispectral Earth observation satellites such as the European Space Agency's (ESA) Sentinel-2 constellation and NASA/USGS Landsat-8/9, vast streams of high-resolution surface reflectance imagery are continuously generated. However, automated surface change detection in remote sensing faces profound scientific challenges:
- **Atmospheric & Illumination Variations**: Sun angle, atmospheric scattering, and cloud shadows generate severe spectral pseudo-changes unrelated to genuine ground alteration.
- **Sensor Alignment & Spatial Resampling**: Misregistration of sub-pixel spatial grids produces false positive boundary ringing along linear features (roads, shorelines).
- **Class Imbalance & Geometric Accuracy**: Genuine change events typically encompass less than 1-5% of a regional satellite tile, leading traditional segmentation losses to collapse. Moreover, many platforms incorrectly compute surface areas using planar Euclidean math on geographic latitude/longitude degrees, yielding distorted area figures.

---

## 2. Research Objectives
1. **Automated Multi-Spectral Preprocessing**: Establish an automated co-registration, reprojection, and radiometric normalization pipeline preserving GeoTIFF affine transform matrices.
2. **Dual-Model Paradigm**: Develop an analytical Computer Vision baseline (adaptive radiometric differencing) and a deep learning Siamese U-Net with multi-scale skip feature subtraction.
3. **Spectral Transition Classification**: Formulate spectral transition rules utilizing verified remote sensing indices (NDVI, NDWI, NDBI, VARI) to categorize changes into deforestation, flooding, urban construction, and agriculture.
4. **Equal-Area Metric Area Quantification**: Delineate vector change contours into RFC 7946 GeoJSON and compute true metric ground area in hectares ($1 \text{ ha} = 10,000 \text{ m}^2$) and square kilometers using equal-area projections (EPSG:6933).
5. **Explainable AI (XAI)**: Render continuous change probability heatmaps, difference overlays, and confidence distributions.
6. **Scientific Reporting**: Programmatically compile publication-grade PDF intelligence dossiers with embedded maps, statistics, and methodological disclaimers.

---

## 3. Literature Review & Grounding
- **Siamese Networks in Remote Sensing**: Pioneered by Daudt et al. (2018) in *"Fully Convolutional Siamese Networks for Change Detection"*, demonstrating that dual weight-sharing encoders extract canonical temporal features resilient to illumination drift.
- **Spectral Indices**: Grounded in Rouse et al. (1974) for NDVI, McFeeters (1996) / Gao (1996) for NDWI, and Zha et al. (2003) for NDBI.
- **Benchmark Datasets**: Grounded in the ONERA Satellite Change Detection (OSCD) dataset and ESA Sentinel-2 Level-2A bottom-of-atmosphere surface reflectance standards.
