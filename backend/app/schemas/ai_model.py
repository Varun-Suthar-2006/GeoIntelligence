from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, ConfigDict

class AIModelBase(BaseModel):
    model_name: str
    architecture: str
    version: str = "1.0.0"
    training_dataset: str = "Sentinel-2 & OSCD Benchmark"
    configuration: Dict[str, Any] = {}
    metrics: Dict[str, Any] = {}

class AIModelCreate(AIModelBase):
    model_path: Optional[str] = None

class AIModelResponse(AIModelBase):
    id: str
    model_path: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
