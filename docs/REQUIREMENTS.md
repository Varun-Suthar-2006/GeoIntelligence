# GeoIntelligence AI — System Requirements Specification

## 1. Computational & Hardware Requirements
- **Operating System**: Windows 10/11 (64-bit), Linux (Ubuntu 22.04+ LTS), or macOS (12.0+)
- **Python Runtime**: Python 3.11, 3.12, 3.13, or 3.14 (64-bit AMD64 / ARM64)
- **Node.js Runtime**: Node.js v18.0+ (Tested with v22.19.0) & npm 9.0+
- **Memory (RAM)**: Minimum 8 GB (16 GB recommended for batch 512x512 GeoTIFF raster processing)
- **GPU (Optional)**: NVIDIA CUDA-capable GPU (tested seamlessly on CPU fallback)
- **Disk Storage**: 5 GB available storage for multi-temporal raster cache and model weights

---

## 2. Software Dependencies

### Backend Dependencies (`backend/requirements.txt`)
- `fastapi>=0.115.0`: Asynchronous RESTful API framework
- `uvicorn[standard]>=0.30.0`: ASGI web server implementation
- `pydantic>=2.8.0`, `pydantic-settings>=2.4.0`: Data schema validation and typing
- `sqlalchemy>=2.0.30`, `alembic>=1.13.0`: Object-relational mapping and migrations
- `torch>=2.4.0`, `torchvision>=0.19.0`: Deep learning inference and backpropagation
- `numpy>=1.26.0`, `scipy>=1.13.0`, `scikit-learn>=1.5.0`, `pandas>=2.2.0`: Numerical algorithms
- `rasterio>=1.4.0`, `tifffile>=2024.5.0`, `pillow>=10.4.0`: Geospatial raster reading & writing
- `opencv-python>=4.10.0`: Computer vision, morphological filtering, and colormap generation
- `shapely>=2.0.0`, `pyproj>=3.6.0`: Vector polygon geometry and equal-area CRS transformation
- `reportlab>=4.2.0`: Programmatic PDF report generation
- `pytest>=8.3.0`, `httpx>=0.27.0`: Automated test suites

### Frontend Dependencies (`frontend/package.json`)
- `react>=19.0.0`, `react-dom>=19.0.0`: Core UI reactive framework
- `react-router-dom>=7.1.0`: Client-side single page navigation (10 specialized pages)
- `@tanstack/react-query>=5.64.0`: Server-state caching and asynchronous API synchronization
- `leaflet>=1.9.4`, `react-leaflet>=5.0.0`, `@types/leaflet`: Interactive GIS mapping
- `recharts>=2.15.0`: Data visualization charts
- `tailwindcss>=3.4.0`, `lucide-react`: Scientific dark navy styling and icons
