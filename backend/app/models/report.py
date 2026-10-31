import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from backend.app.database import Base

class Report(Base):
    __tablename__ = "reports"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    analysis_id = Column(String(36), ForeignKey("analyses.id"), nullable=False)
    title = Column(String(255), default="Geospatial Intelligence Research Report")
    report_path = Column(String(512), nullable=False)
    report_metadata = Column(JSON, default=dict)
    generated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    analysis = relationship("Analysis", back_populates="reports")
