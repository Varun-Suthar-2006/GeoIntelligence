# GeoIntelligence AI — Satellite Dataset & Ingestion Guide

## 1. Supported Sensors & Satellite Constellations

### 1.1 Sentinel-2 MSI (Multi-Spectral Instrument)
Sentinel-2 provides 13 spectral bands in the visible, near infrared, and short-wave infrared regions:

| Band | Central Wavelength (nm) | Spatial Resolution (m) | Spectral Description | Key Analysis Application |
|---|---|---|---|---|
| **B02** | 490 | 10 | Blue | Atmospheric scattering, water penetration |
| **B03** | 560 | 10 | Green | Vegetation vigor, NDWI calculation |
| **B04** | 665 | 10 | Red | Chlorophyll absorption, NDVI calculation |
| **B08** | 842 | 10 | Near Infrared (NIR) | Leaf cellular structure, biomass estimation |
| **B11** | 1610 | 20 | Short-Wave Infrared (SWIR) | Moisture content, built-up index (NDBI) |
| **B12** | 2190 | 20 | Short-Wave Infrared (SWIR) | Mineral classification, burn severity |

GeoIntelligence AI natively reads multi-band GeoTIFFs, resampling 20m SWIR bands to match 10m visible/NIR bands when required.

---

## 2. Benchmark Datasets

### 2.1 OSCD (Onera Satellite Change Detection)
- **Source**: ONERA (The French Aerospace Lab) & IEEE GRSS
- **Sensor**: Sentinel-2 Level-1C / Level-2A
- **Scenes**: 24 global pairs (e.g., Rio, Montpellier, Las Vegas, Paris, Beirut)
- **Focus**: Urban change, construction, vegetation disturbance
- **License**: Academic and research open-access

### 2.2 Landsat-8/9 OLI
- **Bands**: Band 2 (Blue), Band 3 (Green), Band 4 (Red), Band 5 (NIR)
- **Resolution**: 30 meters / pixel
- **Coordinate Systems**: UTM Projections with WGS84 datum

---

## 3. Ingestion & Upload Specifications
When uploading custom satellite imagery via `POST /api/v1/images/upload` or the UI:
1. **File Format**: Standard BigTIFF / GeoTIFF (`.tif`, `.tiff`), PNG, or JPEG.
2. **Georeferencing**: GeoTIFFs must include valid GDAL GeoTransform and CRS tags. Non-georeferenced images are loaded into a calibrated local spatial coordinate system.
3. **Radiometric Depth**: Supports 8-bit unsigned integer, 16-bit unsigned integer (Sentinel-2 L2A DNs), and 32-bit floating point reflectances.
4. **NoData Values**: Pixels matching the raster's `nodata` tag (or NaN/Inf) are automatically masked during preprocessing.
