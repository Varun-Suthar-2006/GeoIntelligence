from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.app.database import get_db
from backend.app.models.dataset import Dataset
from backend.app.models.image import SatelliteImage
from backend.app.models.ai_model import AIModel
from backend.app.models.analysis import Analysis, ChangeResult

router = APIRouter(prefix="/dashboard", tags=["Dashboard Analytics"])

@router.get("/overview")
def get_dashboard_overview(db: Session = Depends(get_db)):
    """
    Computes real, un-fabricated operational metrics directly from the persistence layer.
    """
    total_analyses = db.query(func.count(Analysis.id)).scalar() or 0
    total_images = db.query(func.count(SatelliteImage.id)).scalar() or 0
    total_datasets = db.query(func.count(Dataset.id)).scalar() or 0
    total_models = db.query(func.count(AIModel.id)).scalar() or 0
    
    total_area_ha = db.query(func.sum(ChangeResult.area_hectares)).scalar() or 0.0
    total_polygons = db.query(func.sum(ChangeResult.polygon_count)).scalar() or 0

    # Recent analyses
    recent = (
        db.query(Analysis)
        .order_by(Analysis.created_at.desc())
        .limit(6)
        .all()
    )
    recent_list = []
    for a in recent:
        res = a.results[0] if a.results else None
        recent_list.append({
            "id": a.id,
            "title": a.title,
            "status": a.status,
            "created_at": a.created_at,
            "model_name": a.model.model_name if a.model else "Unknown",
            "earlier_image": a.earlier_image.filename if a.earlier_image else "None",
            "later_image": a.later_image.filename if a.later_image else "None",
            "area_ha": round(res.area_hectares, 3) if res else 0.0,
            "change_type": res.change_type if res else "N/A"
        })

    # Class distribution aggregated across all completed analyses
    all_results = db.query(ChangeResult).all()
    aggregated_classes = {
        "Deforestation": 0.0,
        "Flood": 0.0,
        "Urban Expansion": 0.0,
        "Agricultural Change": 0.0,
        "Unclassified": 0.0
    }
    for r in all_results:
        breakdown = r.class_breakdown or {}
        for k, v in breakdown.items():
            if "deforest" in k.lower():
                aggregated_classes["Deforestation"] += v
            elif "flood" in k.lower() or "water" in k.lower():
                aggregated_classes["Flood"] += v
            elif "urban" in k.lower():
                aggregated_classes["Urban Expansion"] += v
            elif "agri" in k.lower():
                aggregated_classes["Agricultural Change"] += v
            else:
                aggregated_classes["Unclassified"] += v

    class_distribution_list = [
        {"name": k, "hectares": round(v, 2)} for k, v in aggregated_classes.items() if v > 0 or total_analyses > 0
    ]

    return {
        "total_analyses": total_analyses,
        "total_images": total_images,
        "total_datasets": total_datasets,
        "total_models": total_models,
        "total_area_analyzed_ha": round(total_area_ha, 3),
        "total_change_polygons": int(total_polygons),
        "recent_analyses": recent_list,
        "class_distribution": class_distribution_list
    }
