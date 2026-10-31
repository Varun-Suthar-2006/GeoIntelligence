from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class DatasetBase(BaseModel):
    name: str
    source: str
    license: str = "Open Access / CC-BY"
    description: Optional[str] = None

class DatasetCreate(DatasetBase):
    pass

class DatasetResponse(DatasetBase):
    id: str
    created_at: datetime
    image_count: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)
