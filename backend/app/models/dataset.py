import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime
from sqlalchemy.orm import relationship
from backend.app.database import Base

class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), unique=True, nullable=False)
    source = Column(String(255), nullable=False)
    license = Column(String(100), default="Open Access / CC-BY")
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    images = relationship("SatelliteImage", back_populates="dataset", cascade="all, delete-orphan")
