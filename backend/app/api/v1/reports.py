import os
import uuid
from typing import List
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.analysis import Analysis, ChangeResult
from backend.app.models.image import SatelliteImage
from backend.app.models.ai_model import AIModel
from backend.app.models.report import Report
from backend.app.schemas.report import ReportCreate, ReportResponse
from backend.app.services.reporting import generate_pdf_report

router = APIRouter(prefix="/reports", tags=["Research Reports"])

@router.get("", response_model=List[ReportResponse])
def list_reports(db: Session = Depends(get_db)):
    return db.query(Report).order_by(Report.generated_at.desc()).all()

@router.post("/generate", response_model=ReportResponse)
def create_report(payload: ReportCreate, db: Session = Depends(get_db)):
    analysis = db.query(Analysis).filter(Analysis.id == payload.analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    if analysis.status != "COMPLETED":
        raise HTTPException(status_code=400, detail="Cannot generate report for non-completed analysis")

    result = db.query(ChangeResult).filter(ChangeResult.analysis_id == analysis.id).first()
    img1 = db.query(SatelliteImage).filter(SatelliteImage.id == analysis.earlier_image_id).first()
    img2 = db.query(SatelliteImage).filter(SatelliteImage.id == analysis.later_image_id).first()
    model_obj = db.query(AIModel).filter(AIModel.id == analysis.model_id).first()

    analysis_payload = {
        "model_architecture": model_obj.architecture if model_obj else "Siamese U-Net",
        "threshold": analysis.parameters.get("threshold", 0.5),
        "earlier_date": img1.acquisition_date.strftime("%Y-%m-%d") if img1 and img1.acquisition_date else "T1 Reference",
        "later_date": img2.acquisition_date.strftime("%Y-%m-%d") if img2 and img2.acquisition_date else "T2 Comparison",
        "crs": img1.crs if img1 else "EPSG:4326",
        "results": {
            "total_changed_ha": result.area_hectares if result else 0.0,
            "total_changed_sq_km": result.area_sq_km if result else 0.0,
            "total_changed_sq_m": result.area_sq_meters if result else 0.0,
            "change_percentage": result.change_percentage if result else 0.0,
            "polygon_count": result.polygon_count if result else 0,
            "class_breakdown_ha": result.class_breakdown if result else {}
        }
    }

    try:
        report_file_path = generate_pdf_report(
            analysis_id=analysis.id,
            analysis_data=analysis_payload,
            earlier_img_path=img1.preview_path if img1 else None,
            later_img_path=img2.preview_path if img2 else None,
            heatmap_path=result.heatmap_path if result else None
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to compile PDF report: {str(e)}")

    report = Report(
        id=str(uuid.uuid4()),
        analysis_id=analysis.id,
        title=payload.title or "Geospatial Intelligence Research Report",
        report_path=report_file_path,
        report_metadata={
            "analysis_id": analysis.id,
            "model": model_obj.model_name if model_obj else "Unknown",
            "area_ha": result.area_hectares if result else 0.0
        }
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    return report

@router.get("/{report_id}")
def download_report(report_id: str, db: Session = Depends(get_db)):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report or not Path(report.report_path).exists():
        raise HTTPException(status_code=404, detail="Report file not found")
    return FileResponse(
        report.report_path,
        media_type="application/pdf",
        filename=Path(report.report_path).name
    )
