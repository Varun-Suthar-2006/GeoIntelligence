# GeoIntelligence AI — RESTful API Documentation

**Base Gateway URL**: `http://127.0.0.1:8000/api/v1`  
**Interactive Swagger UI**: `http://127.0.0.1:8000/docs`  
**OpenAPI Specification**: `http://127.0.0.1:8000/openapi.json`

---

## 1. Satellite Image Endpoints

### `GET /api/v1/images`
Returns a list of all ingested satellite scenes and their spatial metadata.
- **Parameters**: `dataset_id` (optional query string), `limit` (default 50)
- **Response**: Array of `SatelliteImageResponse` objects.

### `POST /api/v1/images/upload`
Uploads and validates a multi-spectral GeoTIFF or image file.
- **Content-Type**: `multipart/form-data`
- **Fields**:
  - `file`: Binary file (`.tif`, `.tiff`, `.png`)
  - `dataset_id`: Optional UUID string
  - `sensor`: String (e.g., "Sentinel-2A MSI")
  - `acquisition_date`: ISO 8601 string (e.g., "2025-06-15T10:30:00Z")

### `GET /api/v1/images/{image_id}/preview`
Serves a fast web PNG thumbnail with percentile contrast stretching.

### `DELETE /api/v1/images/{image_id}`
Deletes the satellite image record and cleans up raster files from disk.

---

## 2. Preprocessing & Quality Verification

### `POST /api/v1/preprocessing/run`
Checks spatial compatibility and evaluates cloud/illumination quality between two temporal scenes.
- **Request Body**:
  ```json
  {
    "earlier_image_id": "uuid-here",
    "later_image_id": "uuid-here"
  }
  ```
- **Response**: Spatial compatibility report, CRS match status, overlap dimensions, and quality assessment grade (`EXCELLENT`, `CLOUD_CONTAMINATED`, etc.).

---

## 3. Change Detection Analysis

### `POST /api/v1/analysis/change-detection`
Executes end-to-end change detection: co-registration, model inference (Siamese U-Net / Baseline), spectral classification, vector polygonization, and metric area calculation.
- **Request Body**:
  ```json
  {
    "title": "Amazon Basin Deforestation Monitoring",
    "earlier_image_id": "uuid-1",
    "later_image_id": "uuid-2",
    "model_id": "siamese-unet-uuid",
    "threshold": 0.50,
    "min_area_m2": 200.0,
    "apply_spectral_classification": true
  }
  ```
- **Response**: Complete `AnalysisResponse` object containing the results, affected ground area in hectares, and confidence metrics.

### `GET /api/v1/analysis/{analysis_id}/geojson`
Returns standard RFC 7946 GeoJSON FeatureCollection with change polygon geometries, classification categories, and individual polygon metric areas in hectares.

### `GET /api/v1/analysis/{analysis_id}/statistics`
Returns summary statistics: total affected ground area (ha, km², m²), scene change percentage, and class breakdown.

---

## 4. AI Models & Training

### `GET /api/v1/models`
Returns registered change detection models and verified benchmark evaluation metrics (Precision, Recall, F1, IoU, FPR, Latency).

### `POST /api/v1/models/train`
Triggers reproducible PyTorch training for the Siamese U-Net model and updates weights checkpoint.
- **Request Body**: `{"epochs": 3, "batch_size": 4, "learning_rate": 0.001}`

---

## 5. Research Reports

### `POST /api/v1/reports/generate`
Generates a scientific PDF research dossier.
- **Request Body**: `{"analysis_id": "uuid", "title": "Report Title"}`

### `GET /api/v1/reports/{report_id}`
Downloads the compiled PDF file.

---

## 6. Dashboard Analytics

### `GET /api/v1/dashboard/overview`
Computes empirical, un-fabricated summary statistics directly from the database: total analyses, ingested satellite scenes, total changed area in hectares, and transition breakdown.
