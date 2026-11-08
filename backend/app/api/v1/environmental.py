import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.services.weather_service import fetch_meteorological_intelligence
from backend.app.services.aoi_service import (
    calculate_aoi_spatial_extent,
    analyze_aoi_with_intelligence
)
from backend.app.services.sar_service import sar_processor

logger = logging.getLogger("geointelligence.api.environmental")
router = APIRouter(prefix="/environmental", tags=["Environmental & Meteorological Intelligence"])

class WeatherRequest(BaseModel):
    lat: Optional[float] = Field(None, description="Latitude in decimal degrees")
    lon: Optional[float] = Field(None, description="Longitude in decimal degrees")
    bbox: Optional[List[float]] = Field(None, description="[min_lon, min_lat, max_lon, max_lat]")
    date: Optional[str] = Field(None, description="ISO Date YYYY-MM-DD for historical satellite pass reanalysis")

class AOITrackRequest(BaseModel):
    bbox: List[float] = Field(..., description="[min_lon, min_lat, max_lon, max_lat] in WGS84")
    model_id: Optional[str] = Field(None, description="AI Model ID for change inference")
    threshold: float = Field(default=0.45, ge=0.05, le=0.95, description="Probability threshold")
    min_area_m2: float = Field(default=100.0, ge=10.0, le=5000.0, description="Minimum polygon area in square meters")

class SARFloodRequest(BaseModel):
    bbox: Optional[List[float]] = Field(None, description="[min_lon, min_lat, max_lon, max_lat]")
    flood_threshold_db: float = Field(default=-4.5, description="Backscatter drop threshold in dB for water detection")

@router.post("/conditions")
def get_environmental_conditions(req: WeatherRequest):
    """
    Retrieves satellite-grade meteorological intelligence (wind vector, 2m temperature,
    cloud cover optical attenuation, precipitation, humidity, pressure) for any coordinate or AOI on Earth.
    """
    target_lat = req.lat
    target_lon = req.lon

    if req.bbox and len(req.bbox) == 4:
        min_lon, min_lat, max_lon, max_lat = req.bbox
        target_lon = (min_lon + max_lon) / 2.0
        target_lat = (min_lat + max_lat) / 2.0

    if target_lat is None or target_lon is None:
        raise HTTPException(status_code=400, detail="Either 'lat' and 'lon' or a valid 'bbox' must be provided.")

    weather = fetch_meteorological_intelligence(target_lat, target_lon, date=req.date)
    return weather

@router.post("/aoi-track")
def track_aoi_changes(req: AOITrackRequest, db: Session = Depends(get_db)):
    """
    Performs comprehensive Area of Interest (AOI) change detection and atmospheric intelligence:
    1. Metric area calculation in equal-area projection EPSG:6933.
    2. Atmospheric, wind, cloud, and thermal profiling.
    3. AI change detection across overlapping satellite imagery.
    4. Environmental correlation report explaining the drivers of land alteration.
    """
    if len(req.bbox) != 4:
        raise HTTPException(status_code=400, detail="Bbox must contain exactly 4 floats: [min_lon, min_lat, max_lon, max_lat]")

    min_lon, min_lat, max_lon, max_lat = req.bbox
    if min_lon >= max_lon or min_lat >= max_lat:
        raise HTTPException(status_code=400, detail="Invalid bbox coordinates: min values must be less than max values.")

    try:
        result = analyze_aoi_with_intelligence(
            bbox=req.bbox,
            db=db,
            model_id=req.model_id,
            threshold=req.threshold,
            min_area_m2=req.min_area_m2
        )
        return result
    except Exception as e:
        logger.error(f"Error analyzing AOI: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"AOI tracking failed: {str(e)}")

@router.post("/sar-flood-detect")
def detect_sar_flood_inundation(req: SARFloodRequest):
    """
    Synthetic Aperture Radar (SAR) Microwave Flood & Inundation Mapping.
    Utilizes all-weather C-band / S-band active radar pulses to penetrate clouds and monsoon rain,
    calculating backscatter decibel (dB) attenuation caused by specular reflection from standing water.
    """
    try:
        result = sar_processor.compute_sar_change(
            flood_detection_threshold_db=req.flood_threshold_db
        )
        return result
    except Exception as e:
        logger.error(f"Error in SAR flood detection: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"SAR radar processing failed: {str(e)}")


