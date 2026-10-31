from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.analysis import ChangeResult

router = APIRouter(prefix="/analysis", tags=["Geospatial Intelligence"])

@router.get("/{analysis_id}/geojson")
def get_analysis_geojson(analysis_id: str, db: Session = Depends(get_db)):
    result = db.query(ChangeResult).filter(ChangeResult.analysis_id == analysis_id).first()
    if not result or not result.geojson_data:
        raise HTTPException(status_code=404, detail="GeoJSON not available for this analysis")
    return result.geojson_data

@router.get("/{analysis_id}/statistics")
def get_analysis_statistics(analysis_id: str, db: Session = Depends(get_db)):
    result = db.query(ChangeResult).filter(ChangeResult.analysis_id == analysis_id).first()
    if not result:
        raise HTTPException(status_code=404, detail="Analysis results not found")
        
    return {
        "analysis_id": analysis_id,
        "primary_change_type": result.change_type,
        "area_hectares": result.area_hectares,
        "area_sq_km": result.area_sq_km,
        "area_sq_meters": result.area_sq_meters,
        "change_percentage": result.change_percentage,
        "polygon_count": result.polygon_count,
        "area_calculation_method": "Projected Equal-Area Metric (EPSG:6933)",
        "class_breakdown_ha": result.class_breakdown or {},
        "confidence_summary": result.confidence_summary or {}
    }
