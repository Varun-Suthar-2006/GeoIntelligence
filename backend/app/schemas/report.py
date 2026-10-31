from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, ConfigDict

class ReportCreate(BaseModel):
    analysis_id: str
    title: Optional[str] = "Geospatial Intelligence Research Report"

class ReportResponse(BaseModel):
    id: str
    analysis_id: str
    title: str
    report_path: str
    report_metadata: Dict[str, Any]
    generated_at: datetime

    model_config = ConfigDict(from_attributes=True)
