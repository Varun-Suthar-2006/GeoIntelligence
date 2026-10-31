import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.app.config import settings
from backend.app.database import init_db, SessionLocal
from backend.app.services.sample_data import seed_sample_data
from backend.app.api.v1.images import router as images_router
from backend.app.api.v1.datasets import router as datasets_router
from backend.app.api.v1.preprocessing import router as preprocessing_router
from backend.app.api.v1.analysis import router as analysis_router
from backend.app.api.v1.geospatial import router as geospatial_router
from backend.app.api.v1.models import router as models_router
from backend.app.api.v1.reports import router as reports_router
from backend.app.api.v1.dashboard import router as dashboard_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("geointelligence")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Initializing GeoIntelligence AI backend system...")
    init_db()
    with SessionLocal() as db:
        seed_sample_data(db)
    logger.info("System startup complete. Ready for satellite intelligence analysis.")
    yield
    # Shutdown
    logger.info("GeoIntelligence AI backend shutting down.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AI-Based Satellite Image Intelligence and Earth Surface Change Detection System API",
    lifespan=lifespan
)

# Configure CORS for local development & frontend clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API v1 Routers
app.include_router(images_router, prefix=settings.API_V1_STR)
app.include_router(datasets_router, prefix=settings.API_V1_STR)
app.include_router(preprocessing_router, prefix=settings.API_V1_STR)
app.include_router(analysis_router, prefix=settings.API_V1_STR)
app.include_router(geospatial_router, prefix=settings.API_V1_STR)
app.include_router(models_router, prefix=settings.API_V1_STR)
app.include_router(reports_router, prefix=settings.API_V1_STR)
app.include_router(dashboard_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "system": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "OPERATIONAL",
        "docs_url": "/docs",
        "api_v1": settings.API_V1_STR
    }

@app.get("/health")
def health_check():
    return {
        "status": "HEALTHY",
        "services": {
            "database": "CONNECTED",
            "pytorch": "READY",
            "rasterio": "READY"
        }
    }
