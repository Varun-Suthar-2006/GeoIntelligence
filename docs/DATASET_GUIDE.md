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
- **Source**: ONERA (The French Aerospace Lab) & IEEE GRSS (Daudt et al., 2018)
- **Sensor**: Sentinel-2 Level-2A Multi-Spectral Instrument (MSI)
- **Included Ingested Benchmark Pairs in Catalog**:
  1. **Montpellier, France** (`sentinel2_montpellier_t1.tif`, `sentinel2_montpellier_t2.tif`): 390x408 px, UTM 31N. Urban development and vineyard conversion. Includes official ground truth mask `data/masks/montpellier_ground_truth.tif`.
  2. **Beirut, Lebanon** (`sentinel2_beirut_t1.tif`, `sentinel2_beirut_t2.tif`): 476x458 px, UTM 36N. Port redevelopment and coastal construction. Includes ground truth mask `data/masks/beirut_ground_truth.tif`.
  3. **Las Vegas, Nevada, USA** (`sentinel2_lasvegas_t1.tif`, `sentinel2_lasvegas_t2.tif`): 525x471 px, UTM 11N. Desert residential expansion and highway construction. Includes ground truth mask `data/masks/lasvegas_ground_truth.tif`.
  4. **Dubai, UAE** (`sentinel2_dubai_t1.tif`, `sentinel2_dubai_t2.tif`): 788x1015 px, UTM 40N. Coastline reclamation and skyscraper developments. Includes ground truth mask `data/masks/dubai_ground_truth.tif`.
  5. **Rio de Janeiro, Brazil** (`sentinel2_rio_t1.tif`, `sentinel2_rio_t2.tif`): 688x639 px, UTM 23S. Transport corridors and coastal growth. Includes ground truth mask `data/masks/rio_ground_truth.tif`.

### 2.2 Live Global Orbital STAC Acquisition (AWS Earth Search)
- **API Endpoint**: `https://earth-search.aws.element84.com/v1/search`
- **Collection**: `sentinel-2-l2a`
- **Capabilities**: Real-time querying by coordinates or bounding box, dynamic cloud cover filtering, preview thumbnail extraction, and direct Cloud-Optimized GeoTIFF (COG) access.
- **Integrated Research Hotspots**: Montpellier (France), Valencia Flash Floods (Spain), Rondônia Deforestation (Brazil), Dubai Coastline (UAE), Lake Mead Reservoir (USA), and San Francisco Bay Wetlands (USA).

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
