# GeoIntelligence AI — Installation & Execution Guide

## 1. Quickstart Guide (Local Execution)

### Prerequisites
- Python 3.11+ (Python 3.13 recommended)
- Node.js v18+ & npm
- Git

---

## 2. Backend Setup

1. **Clone & Navigate to Repository**:
   ```bash
   cd GeoIntelligence
   ```

2. **Create and Activate Python Virtual Environment**:
   - On Windows (PowerShell):
     ```powershell
     py -3.13 -m venv .venv
     .venv\Scripts\Activate.ps1
     ```
   - On Linux / macOS:
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     ```

3. **Install Backend Dependencies**:
   ```bash
   pip install -r backend/requirements.txt
   ```

4. **Initialize Database & Seed Data**:
   The backend automatically seeds initial Sentinel-2 multi-temporal scenes and model weights upon first launch.
   To run manually:
   ```bash
   python backend/run.py
   ```
   Backend will start on `http://127.0.0.1:8000`. You can explore interactive Swagger documentation at `http://127.0.0.1:8000/docs`.

---

## 3. Frontend Setup

1. **Navigate to Frontend Directory**:
   ```bash
   cd frontend
   ```

2. **Install Node Dependencies**:
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Start the Frontend Development Server**:
   ```bash
   npm run dev
   ```
   Open your browser at `http://127.0.0.1:5173/` to access the GeoIntelligence AI dashboard.

4. **Build Production Bundle (Optional)**:
   ```bash
   npm run build
   ```

---

## 4. Running Automated Tests

Execute the complete pytest suite:
```bash
pytest backend/tests -v
```
To run the live end-to-end integration test against the running backend:
```bash
python backend/tests/verify_live_system.py
```

---

## 5. PostgreSQL & PostGIS Configuration (Optional)
By default, GeoIntelligence AI operates seamlessly using an embedded SQLite database with Shapely geometric calculations. To connect to an enterprise PostgreSQL 18 + PostGIS instance:
1. Create a database: `createdb geointelligence`
2. Add the PostGIS extension: `psql -d geointelligence -c "CREATE EXTENSION postgis;"`
3. Set the environment variable in `.env`:
   ```env
   DATABASE_URL=postgresql://postgres:password@localhost:5432/geointelligence
   ```
The application will automatically detect and utilize PostGIS.
