# GeoIntelligence AI
### AI-Based Satellite Image Intelligence and Earth Surface Change Detection System

[![Python 3.13](https://img.shields.io/badge/Python-3.13%2B-blue.svg)](https://www.python.org/)
[![PyTorch 2.15](https://img.shields.io/badge/PyTorch-2.15-EE4C2C.svg)](https://pytorch.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.162-009688.svg)](https://fastapi.tiangolo.com/)
[![React 19](https://img.shields.io/badge/React-19.0-61DAFB.svg)](https://react.dev/)
[![Leaflet](https://img.shields.io/badge/GIS-Leaflet-199900.svg)](https://leafletjs.com/)
[![Tests](https://img.shields.io/badge/pytest-12%20passed%20(100%25)-brightgreen.svg)]()

---

## 1. Executive Summary & Mission
**GeoIntelligence AI** is an Earth Observation (EO) research and operational platform designed for multi-temporal satellite image intelligence. The system automates the ingestion, co-registration, radiometric normalization, deep learning segmentation, spectral transition classification, and true metric ground area quantification of surface changes.

### Core Objectives
1. **Multi-Temporal Satellite Processing**: Ingest and align multi-spectral GeoTIFF imagery (Sentinel-2 Level-2A, OSCD, Landsat).
2. **Dual AI Model Paradigm**: Compare an analytical **Traditional Pixel Difference Baseline** against a deep convolutional **Siamese U-Net** and experimental **ChangeFormer**.
3. **Spectral Transition Classification**: Categorize detected changes into **Deforestation / Vegetation Loss**, **Flood / Water Inundation**, **Urban Expansion**, **Agricultural Change**, and **Unclassified Change** using verified spectral indices (NDVI, NDWI, NDBI).
4. **Equal-Area Metric Quantification**: Delineate vector contours into RFC 7946 GeoJSON and compute true ground areas in **Hectares (ha)**, **Square Kilometers (km²)**, and **Square Meters (m²)** using projected equal-area coordinate systems (EPSG:6933).
5. **Explainable AI (XAI)**: Render continuous change probability heatmaps, difference overlays, and confidence distributions.
6. **Publication-Grade Reporting**: Programmatically compile scientific PDF intelligence dossiers using ReportLab.

---

## 2. System Architecture

```
Satellite Imagery (GeoTIFF)
             │
             ▼
[Satellite Image Acquisition] ──► Ingestion, Metadata & Radiometric Previews
             │
             ▼
[Geospatial Preprocessing]    ──► Co-Registration, Reprojection & QC Assessment
             │
             ▼
[AI Change Detection Engine]  ──► Siamese U-Net / Baseline / ChangeFormer
             │
             ▼
[Spectral Classification]     ──► NDVI, NDWI & NDBI Transition Decisions
             │
             ▼
[Geospatial Quantification]   ──► Equal-Area (EPSG:6933) Metric Area (ha, km²)
             │
             ▼
[Interactive GIS & Reports]   ──► Leaflet Vector Map & ReportLab PDF Dossier
```

---

## 3. Technology Stack

- **Backend**: Python 3.13, FastAPI, Uvicorn, SQLAlchemy, Pydantic v2
- **AI / Deep Learning**: PyTorch 2.15, Torchvision, NumPy, SciPy, Scikit-learn, OpenCV
- **Geospatial Processing**: Rasterio, Tifffile, Shapely, PyProj, GDAL
- **Reporting**: ReportLab
- **Database**: PostgreSQL 18 with PostGIS / Seamless SQLite fallback for zero-setup local dev
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Leaflet, React Leaflet, Recharts, Lucide React

---

## 4. User Interface (10 Specialized Pages)

1. **Overview Dashboard (`/`)**: Real-time database metrics, KPI cards, transition charts, and recent multi-temporal analyses.
2. **Satellite Explorer (`/explorer`)**: Interactive Leaflet GIS map with satellite layers, scene footprints, and coordinate tracker.
3. **Image Comparison (`/comparison`)**: Interactive before/after swipe slider and side-by-side multi-spectral view.
4. **Change Detection (`/detection`)**: Workflow engine to select temporal pairs, adjust probability thresholds, and execute inference.
5. **Geospatial Intelligence (`/geospatial`)**: Interactive map with classified vector polygons, popups, and GeoJSON export.
6. **AI Model Centre (`/models`)**: Model registry, evaluation metrics (Precision, Recall, F1, IoU), and PyTorch training loop.
7. **Dataset Manager (`/datasets`)**: Register datasets, upload satellite GeoTIFFs, and inspect band metadata.
8. **Analysis History (`/history`)**: Complete audit trail of past multi-temporal runs with instant map links.
9. **Research Reports (`/reports`)**: Programmatic PDF intelligence report generator and download manager.
10. **Settings (`/settings`)**: Runtime diagnostics, analysis thresholds, and storage configurations.

---

## 5. Quickstart & Installation

### Backend Setup
```bash
# 1. Create and activate virtual environment
py -3.13 -m venv .venv
.venv\Scripts\activate      # On Windows
source .venv/bin/activate    # On Linux/macOS

# 2. Install dependencies
pip install -r backend/requirements.txt

# 3. Start the FastAPI server
python backend/run.py
```
Backend runs at `http://127.0.0.1:8000` with interactive Swagger docs at `http://127.0.0.1:8000/docs`.

### Frontend Setup
```bash
# 1. Navigate to frontend
cd frontend

# 2. Install dependencies
npm install --legacy-peer-deps

# 3. Start development server
npm run dev
```
Frontend runs at `http://127.0.0.1:5173/`.

---

## 6. Testing & Validation

Run the automated test suite:
```bash
pytest backend/tests -v
```

Execute live end-to-end integration verification:
```bash
python backend/tests/verify_live_system.py
```

**Test Results Summary**:
- 12/12 Automated Tests Passed (100%)
- Live End-to-End Pipeline Execution Verified
- True ground area measured in projected equal-area CRS (EPSG:6933)
- Real Siamese U-Net weights trained and cached on disk

---

## 7. Research Documentation Sitemap

Comprehensive scientific documentation is available in the [`docs/`](./docs) directory:
- [System Architecture](./docs/SYSTEM_ARCHITECTURE.md)
- [Project Overview & Scientific Abstract](./docs/PROJECT_OVERVIEW.md)
- [System Requirements](./docs/REQUIREMENTS.md)
- [Satellite Dataset Guide](./docs/DATASET_GUIDE.md)
- [Preprocessing & Co-Registration Guide](./docs/PREPROCESSING_GUIDE.md)
- [AI Model Formulation & Math](./docs/AI_MODEL_DOCUMENTATION.md)
- [REST API Reference](./docs/API_DOCUMENTATION.md)
- [Database & Spatial Schema](./docs/DATABASE_SCHEMA.md)
- [Installation Guide](./docs/INSTALLATION_GUIDE.md)
- [Testing & Quality Audit Report](./docs/TESTING_REPORT.md)
- [Research Methodology](./docs/RESEARCH_METHODOLOGY.md)
- [Limitations & Future Scope](./docs/LIMITATIONS_AND_FUTURE_SCOPE.md)
- [Development Log & Audit Trail](./DEVELOPMENT_LOG.md)

---

## 8. Citation
```bibtex
@software{geointelligence_ai_2026,
  author = {GeoIntelligence Research Team},
  title = {GeoIntelligence AI: AI-Based Satellite Image Intelligence and Earth Surface Change Detection System},
  year = {2026},
  url = {https://github.com/geointelligence-ai}
}
```
