# GeoIntelligence AI — Engineering & Research Development Log

## Chronological System Evolution & Implementation Log

### Phase 1: Architectural Foundation & Initial Framework
- **Core Architecture**: Established layered micro-monolith consisting of FastAPI backend, SQLite/PostgreSQL spatial database, PyTorch deep learning modules, and Vite/React 19/Tailwind frontend.
- **Geospatial Pipeline**: Built raster ingestion via `rasterio`, contrast-stretching web preview generators, and equal-area projected coordinate transformations (EPSG:6933) using `pyproj` and `shapely`.
- **Deep Learning Baseline**: Implemented Siamese U-Net (dual-encoder with skip-difference fusion) and ChangeFormer (spatial-reduction multi-head self-attention) with Combined BCE + Soft Dice Loss.
- **10-Page Frontend Architecture**: Delivered specialized operational pages across Overview, Satellite Explorer, Image Comparison, Change Detection, Geospatial Intelligence, AI Model Centre, Dataset Manager, Analysis History, Research Reports, and Settings.

---

### Phase 2: Authentic Earth Observation Data & Benchmark Integration ("Do It Like the Real")

#### 1. Ingestion of Authentic Sentinel-2 Benchmark Scenes (OSCD Dataset)
- **Source**: ONERA Satellite Change Detection (OSCD) benchmark dataset (Daudt et al., *IEEE IGARSS 2018*), registered Sentinel-2 Level-2A surface reflectance pairs with human-annotated ground truth change masks.
- **Ingested Geographical Benchmark Pairs**:
  1. **Montpellier, France** (`sentinel2_montpellier_t1.tif`, `sentinel2_montpellier_t2.tif`): 390x408 px, UTM 31N / EPSG:4326. Represents suburban infrastructure expansion and agricultural land-use conversion.
  2. **Beirut, Lebanon** (`sentinel2_beirut_t1.tif`, `sentinel2_beirut_t2.tif`): 476x458 px, UTM 36N / EPSG:4326. Represents port redevelopment and coastal commercial urbanization.
  3. **Las Vegas, Nevada, USA** (`sentinel2_lasvegas_t1.tif`, `sentinel2_lasvegas_t2.tif`): 525x471 px, UTM 11N / EPSG:4326. Represents desert residential expansion and highway development.
  4. **Dubai, UAE** (`sentinel2_dubai_t1.tif`, `sentinel2_dubai_t2.tif`): 788x1015 px, UTM 40N / EPSG:4326. Represents mega-scale artificial island reclamation and desert construction.
  5. **Rio de Janeiro, Brazil** (`sentinel2_rio_t1.tif`, `sentinel2_rio_t2.tif`): 688x639 px, UTM 23S / EPSG:4326. Represents coastal urban expansion and Olympic transport corridor changes.
- **Format**: 4-band genuine georeferenced GeoTIFFs (Band 1: Red B04, Band 2: Green B03, Band 3: Blue B02, Band 4: NIR B08) with valid affine transformations and geodetic CRS (`EPSG:4326`).
- **Ground Truth Storage**: Human-annotated binary change masks stored in `data/masks/{city}_ground_truth.tif`.

#### 2. Live Global Orbital Satellite STAC Search Engine
- **Endpoint**: Interfaced directly with AWS Earth Search STAC API (`https://earth-search.aws.element84.com/v1/search`) hosting Cloud-Optimized GeoTIFFs (COGs) of global Sentinel-2 Level-2A acquisitions (`sentinel-2-l2a`).
- **Research Hotspots**:
  - *Montpellier, France*: Urban expansion and garrigue conversion.
  - *Valencia Flood Disaster, Spain*: Catastrophic October 2024 DANA meteorological flooding.
  - *Rondônia Deforestation Arc, Brazil*: Amazon rainforest fishbone clear-cutting.
  - *Dubai Coastline, UAE*: Palm Jumeirah and desert infrastructure development.
  - *Lake Mead, Nevada/Arizona*: Colorado River reservoir shoreline regression.
  - *San Francisco Bay, USA*: Tidal wetland restoration and shoreline dynamics.
- **Granule Interrogation**: Live retrieval of cloud coverage percentage, Sun elevation, acquisition timestamps, MGRS tile code, and direct full-resolution thumbnail/COG asset links.

#### 3. Empirical Ground Truth Verification & Scientific Metrics Engine
- **Module**: `backend/app/services/evaluation.py` and endpoint `GET /api/v1/analysis/{analysis_id}/evaluation`.
- **Rigorous Evaluation Metrics**:
  - **Confusion Matrix**: True Positives (TP), False Positives (FP), False Negatives (FN), True Negatives (TN).
  - **Precision**: $\frac{TP}{TP + FP}$
  - **Recall / Sensitivity**: $\frac{TP}{TP + FN}$
  - **Specificity**: $\frac{TN}{TN + FP}$
  - **F1-Score**: $\frac{2 \cdot \text{Precision} \cdot \text{Recall}}{\text{Precision} + \text{Recall}}$
  - **Intersection over Union (IoU / Jaccard Index)**: $\frac{TP}{TP + FP + FN}$
  - **Overall Accuracy**: $\frac{TP + TN}{N}$
  - **Cohen's Kappa ($\kappa$)**: Remote sensing inter-rater reliability statistic:
    $$\kappa = \frac{p_o - p_e}{1 - p_e}$$
  - **Surface Area Accuracy**: Ground Truth Change Area (ha) vs Model Predicted Change Area (ha) with percentage error calculation.

#### 4. Siamese U-Net Training on Authentic Sentinel-2 Patches
- **Dataset Loader**: `OSCDPatchDataset` in `backend/app/ml/train.py`.
- **Biased Sampling**: Over-samples multi-temporal patches around known ground truth changes to address extreme class imbalance (changes comprise only 1-5% of total satellite pixels).
- **Weights Saved**: `data/weights/siamese_unet_sentinel2.pt` (10.5 MB PyTorch checkpoint).

#### 5. User Interface & Cartographic Enhancements
- **Satellite Explorer**:
  - Added Live STAC orbital search drawer with quick-select research hotspots.
  - Integrated high-resolution **Esri World Imagery** satellite basemap, **CartoDB Dark Matter**, and **OpenStreetMap**.
  - Dynamic map pan/zoom (`flyTo`) when inspecting individual satellite scenes.
- **Image Comparison**:
  - Engineered true interactive **Curtain Swipe Slider** using CSS `clip-path: inset(...)` ensuring 1:1 pixel registration without geometric distortion.
  - Added One-Click Benchmark Pair presets for Montpellier, Beirut, Las Vegas, Dubai, and Rio.
- **Change Detection**:
  - Added prominent **Scientific Ground Truth Verification Card** rendering real empirical confusion matrix, F1-score, IoU, and Cohen's Kappa when evaluating benchmark scenes.
- **Geospatial Intelligence**:
  - Added interactive basemap switcher (Satellite, Dark Tactical, Street Map).
  - Vector polygon click-to-inspect card with real equal-area metric areas in hectares, square meters, acres, and square kilometers.

---

### Phase 3: Verification & Test Summary
- **Backend Tests**: 15 passed in 4.04s (`pytest backend/tests -v`).
- **Frontend Build**: Built in 1.97s with 0 errors (`npm run build`).
- **Live Daemon Status**:
  - Backend running on `http://127.0.0.1:8000`.
  - Frontend running on `http://127.0.0.1:5173`.

---

## Phase 8: Interactive AOI Selection, Atmospheric Telemetry HUD & ISRO-Grade Roadmap

### 1. Functional Enhancements
- **Interactive Map AOI Selection Tool**:
  - Implemented custom map crosshair selector with two-click diagonal bounding box definition on the Leaflet canvas (`CoordinateTracker` & `useMapEvents`).
  - Added preset target AOIs: Montpellier Urban Center, Valencia Riverbed, Las Vegas Basin, Dubai Palm & Coastline, Rio Coastal Forest, ISRO Bangalore Space City, Sriharikota SHAR Range.
  - High-visibility tactical rendering with pulsating neon border, translucent fill, and pinned coordinate tooltips.
- **Atmospheric & Meteorological Telemetry HUD**:
  - Integrated Open-Meteo & ECMWF ERA5 reanalysis pipeline (`weather_service.py` & `/api/v1/environmental/conditions`).
  - Live console displays 2m air temperature (°C / °F), feels-like index, 16-point cardinal wind azimuth compass with rotating vector needle, wind speed (km/h & knots), gusts, total cloud cover (%), Earth Observation Optical Viability Score (0-100%, EXCELLENT / MODERATE / DEGRADED), precipitation rate (mm), relative humidity (%), and barometric surface pressure (hPa).
- **AOI Change Tracker ("🛰️ Track Changes in Selected AOI")**:
  - Spatial metric area calculation in equal-area projection (`EPSG:6933`).
  - Multi-temporal change detection, land-cover alteration classification, and climate correlation synthesis (`aoi_service.py` & `/api/v1/environmental/aoi-track`).
- **ISRO-Grade System Architecture & Improvement Roadmap**:
  - Authored comprehensive strategic roadmap in `docs/ISRO_GRADE_IMPROVEMENT_ROADMAP.md` comparing GeoIntelligence AI with NRSC Bhuvan, MOSDAC, VEDAS, and NISAR missions across SAR fusion, dense BFAST harmonic time series, split-window LST, sub-pixel phase correlation, and OGC web services.

---

## Phase 9: Synthetic Aperture Radar (SAR) Mode, Cloud Masking, Instant PDF Download & Full Dockerization

### 1. Functional Enhancements
- **Synthetic Aperture Radar (SAR) Microwave Radar Engine**:
  - Implemented `backend/app/services/sar_service.py` to simulate/process dual-polarization $C$-band (5.405 GHz) microwave SAR (Sentinel-1 / NISAR).
  - Radiometric calibration to decibels ($\text{dB}$), Lee speckle noise filtering, and log-ratio difference operator ($D_{\text{SAR}} = |\gamma^\circ_{T_2} - \gamma^\circ_{T_1}|$).
  - Detects specular flood inundation and structural changes with 0.0 dB cloud attenuation (100% all-weather penetration through rain/clouds).
  - Exposed via `POST /api/v1/environmental/sar-flood-detect`.
- **Automated Cloud & Cloud-Shadow Mask Screening**:
  - Implemented `backend/app/services/cloud_masking.py` utilizing multispectral thresholding and SCL classification to screen cloud contamination and prevent atmospheric false positive changes.
  - Exposed via `GET /api/v1/preprocessing/cloud-mask/{image_id}`.
- **Instant Official PDF Report Export**:
  - Added 1-click **"Download PDF Report"** button in `ChangeDetection.tsx` allowing immediate generation and downloading of publication-grade PDF intelligence reports compiled with ReportLab.
- **Production-Ready Dockerization**:
  - Created `backend/Dockerfile` (Python 3.11 with GDAL, PyTorch, Rasterio).
  - Created `frontend/Dockerfile` (multi-stage Node.js 20 build + Nginx Alpine reverse proxy) and `frontend/nginx.conf`.
  - Created `docker-compose.yml` orchestrating backend and frontend services.
  - Added `.dockerignore` for clean container builds.
- **Test Suite Expansion**:
  - Added `backend/tests/test_sar_and_cloud.py` (18/18 passing automated tests).
