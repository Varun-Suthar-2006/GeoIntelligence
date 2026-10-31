from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, ConfigDict

class Bounds(BaseModel):
    min_lat: float
    min_lon: float
    max_lat: float
    max_lon: float

class SatelliteImageBase(BaseModel):
    filename: str
    acquisition_date: Optional[datetime] = None
    sensor: str = "Sentinel-2A MSI"
    crs: str = "EPSG:4326"
    resolution: float = 10.0

class SatelliteImageResponse(SatelliteImageBase):
    id: str
    dataset_id: Optional[str] = None
    file_path: str
    preview_path: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None
    channels: Optional[int] = 3
    bounds: Optional[Dict[str, Any]] = None
    band_metadata: Optional[Dict[str, Any]] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
