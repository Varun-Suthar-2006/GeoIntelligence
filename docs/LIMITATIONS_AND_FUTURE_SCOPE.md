# GeoIntelligence AI — Limitations & Future Scope

## 1. Scientific & Operational Limitations

1. **Optical Cloud & Shadow Obstruction**:
   Optical sensors (Sentinel-2, Landsat) cannot penetrate cloud cover or heavy cloud shadows. While our preprocessing engine scores and warns about cloud contamination, thick clouds obscure underlying surface dynamics.
   
2. **Spatial Resolution Constraints (10m - 30m GSD)**:
   Sentinel-2's 10m Ground Sample Distance limits detection of small-scale alterations (e.g. individual felled trees or narrow residential structures). Delineated polygons represent aggregated pixel clusters rather than cadastral boundaries.

3. **Phenological & Seasonal False Alarms**:
   Natural deciduous vegetation shed leaves in autumn and bloom in spring. Although the Siamese U-Net learns robust temporal representations, severe seasonal disparities between mismatched acquisition months (e.g., January vs July) can induce pseudo-changes without ground alteration.

4. **In-situ Ground Validation**:
   Satellite predictions are probabilistic indicators of spectral change. They must be cross-referenced with local field surveys or high-resolution drone/aerial surveys for formal regulatory or legal enforcement.

---

## 2. Future Research & Engineering Scope

1. **Synthetic Aperture Radar (SAR) Multimodal Fusion**:
   Incorporate Sentinel-1 C-band SAR (VV/VH polarizations) to achieve all-weather, day-and-night change monitoring impervious to cloud cover.
   
2. **Geospatial Foundation Models**:
   Integrate pre-trained foundation models (e.g., NASA-IBM Prithvi, Clay Foundation Model) as alternative encoder backbones for self-supervised representation learning.

3. **STAC (SpatioTemporal Asset Catalog) Integration**:
   Implement dynamic STAC API search to automatically query and stream live Sentinel-2 tiles directly from Planetary Computer or AWS Earth Search based on user-drawn bounding boxes.

4. **Continuous Automated Monitoring & Webhooks**:
   Enable scheduled recurrent monitoring over defined Areas of Interest (AOIs) with automated webhook alerting when deforestation or flooding exceeds a specified hectare threshold.
