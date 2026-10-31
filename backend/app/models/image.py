import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from backend.app.database import Base

class SatelliteImage(Base):
    __tablename__ = "satellite_images"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    dataset_id = Column(String(36), ForeignKey("datasets.id"), nullable=True)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(512), nullable=False)
    preview_path = Column(String(512), nullable=True)
    acquisition_date = Column(DateTime, nullable=True)
    sensor = Column(String(100), default="Sentinel-2A MSI")
    crs = Column(String(100), default="EPSG:4326")
    resolution = Column(Float, default=10.0) # Spatial resolution in meters
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    channels = Column(Integer, default=3)
    bounds = Column(JSON, nullable=True) # {min_lat, min_lon, max_lat, max_lon}
    band_metadata = Column(JSON, nullable=True) # {bands: [...], nodata: val, stats: {...}}
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    dataset = relationship("Dataset", back_populates="images")
