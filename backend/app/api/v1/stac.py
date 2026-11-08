import logging
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from backend.app.services.stac_service import search_stac_scenes, get_preset_hotspots

logger = logging.getLogger("geointelligence.api.stac")
router = APIRouter(prefix="/stac", tags=["Satellite STAC Catalog"])

class STACSearchRequest(BaseModel):
    bbox: List[float] = Field(..., description="[min_lon, min_lat, max_lon, max_lat] in EPSG:4326")
    datetime_range: str = Field(default="2023-01-01T00:00:00Z/2023-12-31T23:59:59Z", description="ISO 8601 interval, e.g. 2023-06-01T00:00:00Z/2023-09-01T00:00:00Z")
    max_cloud_cover: float = Field(default=20.0, ge=0.0, le=100.0, description="Maximum cloud cover percentage")
    limit: int = Field(default=6, ge=1, le=20, description="Max granules to return")

@router.get("/hotspots")
def list_hotspots():
    """
    Returns curated Earth Observation research hotspots covering urban expansion,
    deforestation, environmental flooding, and reservoir depletion.
    """
    return get_preset_hotspots()

@router.post("/search")
def search_sentinel_scenes(req: STACSearchRequest):
    """
    Performs real-time search on AWS Earth Search STAC API for Sentinel-2 Level-2A imagery
    across any geographic bounding box on Earth.
    """
    if len(req.bbox) != 4:
        raise HTTPException(status_code=400, detail="Bbox must contain exactly 4 floats: [min_lon, min_lat, max_lon, max_lat]")

    results = search_stac_scenes(
        bbox=req.bbox,
        datetime_range=req.datetime_range,
        max_cloud_cover=req.max_cloud_cover,
        limit=req.limit
    )
    return {
        "status": "SUCCESS",
        "granule_count": len(results),
        "granules": results
    }
