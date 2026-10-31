from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, ConfigDict
from backend.app.schemas.image import SatelliteImageResponse
from backend.app.schemas.ai_model import AIModelResponse

class ChangeAnalysisRequest(BaseModel):
    title: Optional[str] = "Multi-Temporal Change Analysis"
    earlier_image_id: str
    later_image_id: str
    model_id: str
    threshold: Optional[float] = 0.5
    min_area_m2: Optional[float] = 200.0
    apply_spectral_classification: Optional[bool] = True

class ChangeResultResponse(BaseModel):
    id: str
    analysis_id: str
    change_type: str
    area_hectares: float
    area_sq_km: float
    area_sq_meters: float
    change_percentage: float
    polygon_count: int
    confidence_summary: Dict[str, Any]
    class_breakdown: Dict[str, Any]
    output_mask_path: Optional[str] = None
    heatmap_path: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class AnalysisResponse(BaseModel):
    id: str
    title: str
    earlier_image_id: str
    later_image_id: str
    model_id: str
    status: str
    parameters: Dict[str, Any]
    error_message: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None
    earlier_image: Optional[SatelliteImageResponse] = None
    later_image: Optional[SatelliteImageResponse] = None
    model: Optional[AIModelResponse] = None
    results: List[ChangeResultResponse] = []

    model_config = ConfigDict(from_attributes=True)
