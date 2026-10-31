import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship
from backend.app.database import Base

class Analysis(Base):
    __tablename__ = "analyses"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(255), default="Multi-Temporal Change Analysis")
    earlier_image_id = Column(String(36), ForeignKey("satellite_images.id"), nullable=False)
    later_image_id = Column(String(36), ForeignKey("satellite_images.id"), nullable=False)
    model_id = Column(String(36), ForeignKey("ai_models.id"), nullable=False)
    status = Column(String(50), default="PENDING") # PENDING, PROCESSING, COMPLETED, FAILED
    parameters = Column(JSON, default=dict)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    completed_at = Column(DateTime, nullable=True)

    earlier_image = relationship("SatelliteImage", foreign_keys=[earlier_image_id])
    later_image = relationship("SatelliteImage", foreign_keys=[later_image_id])
    model = relationship("AIModel", foreign_keys=[model_id])
    results = relationship("ChangeResult", back_populates="analysis", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="analysis", cascade="all, delete-orphan")

class ChangeResult(Base):
    __tablename__ = "change_results"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    analysis_id = Column(String(36), ForeignKey("analyses.id"), nullable=False)
    change_type = Column(String(100), default="Unclassified Change")
    area_hectares = Column(Float, default=0.0)
    area_sq_km = Column(Float, default=0.0)
    area_sq_meters = Column(Float, default=0.0)
    change_percentage = Column(Float, default=0.0)
    polygon_count = Column(Float, default=0)
    confidence_summary = Column(JSON, default=dict) # {mean, std, high_conf_pct, etc.}
    class_breakdown = Column(JSON, default=dict) # {Deforestation: ha, Flood: ha, ...}
    geojson_data = Column(JSON, nullable=True) # Full RFC 7946 FeatureCollection
    output_mask_path = Column(String(512), nullable=True)
    heatmap_path = Column(String(512), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    analysis = relationship("Analysis", back_populates="results")
