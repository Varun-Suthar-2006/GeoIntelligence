import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, JSON
from backend.app.database import Base

class AIModel(Base):
    __tablename__ = "ai_models"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    model_name = Column(String(100), unique=True, nullable=False)
    architecture = Column(String(100), nullable=False)
    version = Column(String(50), default="1.0.0")
    model_path = Column(String(512), nullable=True)
    training_dataset = Column(String(255), default="OSCD & Sentinel-2 Benchmark")
    configuration = Column(JSON, default=dict)
    metrics = Column(JSON, default=dict) # {precision, recall, f1, iou, fpr, latency_ms}
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
