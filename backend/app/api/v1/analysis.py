import uuid
import logging
from typing import List, Optional
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session, joinedload

from backend.app.config import settings
from backend.app.database import get_db
from backend.app.models.image import SatelliteImage
from backend.app.models.ai_model import AIModel
from backend.app.models.analysis import Analysis, ChangeResult
from backend.app.schemas.analysis import ChangeAnalysisRequest, AnalysisResponse, ChangeResultResponse
from backend.app.services.preprocessing import align_and_load_rasters
from backend.app.services.change_detection import change_detection_service
from backend.app.services.classification import classify_changed_regions
from backend.app.services.geospatial import polygonize_and_calculate_geometries
from backend.app.services.explainability import (
    generate_probability_heatmap,
    generate_change_overlay,
    compute_explainability_summary
)
from backend.app.services.evaluation import evaluate_against_ground_truth

logger = logging.getLogger("geointelligence.api.analysis")

router = APIRouter(prefix="/analysis", tags=["Change Detection Analysis"])

def execute_change_detection_pipeline(
    analysis_id: str,
    db: Session,
    threshold: float = 0.5,
    min_area_m2: float = 200.0
):
    """
    Synchronous / Background execution worker for multi-temporal change detection pipeline.
    """
    analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    if not analysis:
        return

    try:
        analysis.status = "PROCESSING"
        db.commit()

        img1 = db.query(SatelliteImage).filter(SatelliteImage.id == analysis.earlier_image_id).first()
        img2 = db.query(SatelliteImage).filter(SatelliteImage.id == analysis.later_image_id).first()
        model_obj = db.query(AIModel).filter(AIModel.id == analysis.model_id).first()

        if not img1 or not img2 or not model_obj:
            raise ValueError("Referenced image or model not found")

        # 1. Align and reproject rasters
        norm1, norm2, geo_profile = align_and_load_rasters(
            img1.file_path, img2.file_path, target_shape=(512, 512)
        )

        # 2. Dispatch to AI Model
        arch = model_obj.architecture.lower()
        if "siamese" in arch:
            prob_map, binary_mask, latency_ms = change_detection_service.run_siamese_unet_inference(
                norm1, norm2, threshold=threshold
            )
        elif "changeformer" in arch or "transformer" in arch:
            prob_map, binary_mask, latency_ms = change_detection_service.run_changeformer_inference(
                norm1, norm2, threshold=threshold
            )
        else: # Traditional Baseline
            prob_map, binary_mask, latency_ms = change_detection_service.run_traditional_difference(
                norm1, norm2, threshold=threshold
            )

        # 3. Classify detected changed pixels
        class_map, class_pcts = classify_changed_regions(norm1, norm2, binary_mask)

        # 4. Polygonize & Calculate Metric Areas in Projected Equal-Area CRS
        geojson_data, summary_stats = polygonize_and_calculate_geometries(
            binary_mask=binary_mask,
            class_map=class_map,
            prob_map=prob_map,
            geo_profile=geo_profile,
            min_area_m2=min_area_m2
        )

        # 5. Explainability Visualizations
        heatmap_file = str(settings.MASKS_DIR / f"{analysis_id}_heatmap.png")
        generate_probability_heatmap(prob_map, heatmap_file)

        overlay_file = str(settings.MASKS_DIR / f"{analysis_id}_overlay.png")
        generate_change_overlay(img1.preview_path or img1.file_path, binary_mask, overlay_file)

        xai_summary = compute_explainability_summary(prob_map, threshold=threshold)
        xai_summary.update(summary_stats.get("confidence_summary", {}))
        xai_summary["inference_latency_ms"] = latency_ms

        # Ground Truth Scientific Evaluation (if available, e.g. OSCD Benchmark)
        gt_path = None
        if img1.band_metadata and "ground_truth_path" in img1.band_metadata:
            gt_path = img1.band_metadata["ground_truth_path"]
        elif img2.band_metadata and "ground_truth_path" in img2.band_metadata:
            gt_path = img2.band_metadata["ground_truth_path"]
        else:
            for city_candidate in ["montpellier", "beirut", "lasvegas", "dubai", "rio"]:
                if city_candidate in img1.filename.lower() or city_candidate in img2.filename.lower():
                    candidate_mask = settings.MASKS_DIR / f"{city_candidate}_ground_truth.tif"
                    if candidate_mask.exists():
                        gt_path = str(candidate_mask)
                        break

        if gt_path:
            eval_metrics = evaluate_against_ground_truth(binary_mask, gt_path)
            if eval_metrics:
                xai_summary["ground_truth_evaluation"] = eval_metrics
                logger.info(f"Computed ground truth benchmark metrics for analysis {analysis_id}: F1={eval_metrics['metrics']['f1_score']}, IoU={eval_metrics['metrics']['iou']}")

        # 6. Save ChangeResult
        # Determine dominant overall change type
        breakdown_ha = summary_stats.get("class_breakdown_ha", {})
        dominant_type = max(breakdown_ha, key=breakdown_ha.get) if breakdown_ha else "Unclassified Change"

        change_res = ChangeResult(
            id=str(uuid.uuid4()),
            analysis_id=analysis_id,
            change_type=dominant_type,
            area_hectares=summary_stats.get("total_changed_ha", 0.0),
            area_sq_km=summary_stats.get("total_changed_sq_km", 0.0),
            area_sq_meters=summary_stats.get("total_changed_sq_m", 0.0),
            change_percentage=summary_stats.get("change_percentage", 0.0),
            polygon_count=summary_stats.get("polygon_count", 0),
            confidence_summary=xai_summary,
            class_breakdown=breakdown_ha,
            geojson_data=geojson_data,
            heatmap_path=heatmap_file,
            output_mask_path=overlay_file
        )
        db.add(change_res)

        analysis.status = "COMPLETED"
        analysis.completed_at = datetime.now(timezone.utc)
        db.commit()
        logger.info(f"Analysis {analysis_id} completed successfully.")

    except Exception as e:
        logger.error(f"Analysis {analysis_id} failed: {e}", exc_info=True)
        analysis.status = "FAILED"
        analysis.error_message = str(e)
        db.commit()

@router.post("/change-detection", response_model=AnalysisResponse)
def create_change_detection(
    payload: ChangeAnalysisRequest,
    db: Session = Depends(get_db)
):
    img1 = db.query(SatelliteImage).filter(SatelliteImage.id == payload.earlier_image_id).first()
    img2 = db.query(SatelliteImage).filter(SatelliteImage.id == payload.later_image_id).first()
    model_obj = db.query(AIModel).filter(AIModel.id == payload.model_id).first()

    if not img1 or not img2:
        raise HTTPException(status_code=404, detail="Selected satellite images not found")
    if not model_obj:
        raise HTTPException(status_code=404, detail="Selected AI model not found")

    analysis = Analysis(
        id=str(uuid.uuid4()),
        title=payload.title or "Multi-Temporal Change Analysis",
        earlier_image_id=payload.earlier_image_id,
        later_image_id=payload.later_image_id,
        model_id=payload.model_id,
        status="PENDING",
        parameters={
            "threshold": payload.threshold,
            "min_area_m2": payload.min_area_m2,
            "apply_spectral_classification": payload.apply_spectral_classification
        }
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)

    # Execute directly so client gets immediate results without needing a distributed queue
    execute_change_detection_pipeline(
        analysis_id=analysis.id,
        db=db,
        threshold=payload.threshold or 0.5,
        min_area_m2=payload.min_area_m2 or 200.0
    )

    db.refresh(analysis)
    return analysis

@router.get("", response_model=List[AnalysisResponse])
def list_analyses(limit: int = 50, db: Session = Depends(get_db)):
    return (
        db.query(Analysis)
        .options(
            joinedload(Analysis.earlier_image),
            joinedload(Analysis.later_image),
            joinedload(Analysis.model),
            joinedload(Analysis.results)
        )
        .order_by(Analysis.created_at.desc())
        .limit(limit)
        .all()
    )

@router.get("/{analysis_id}", response_model=AnalysisResponse)
def get_analysis(analysis_id: str, db: Session = Depends(get_db)):
    analysis = (
        db.query(Analysis)
        .options(
            joinedload(Analysis.earlier_image),
            joinedload(Analysis.later_image),
            joinedload(Analysis.model),
            joinedload(Analysis.results)
        )
        .filter(Analysis.id == analysis_id)
        .first()
    )
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return analysis

@router.get("/{analysis_id}/heatmap")
def get_analysis_heatmap(analysis_id: str, db: Session = Depends(get_db)):
    res = db.query(ChangeResult).filter(ChangeResult.analysis_id == analysis_id).first()
    if not res or not res.heatmap_path or not Path(res.heatmap_path).exists():
        raise HTTPException(status_code=404, detail="Heatmap image not found")
    return FileResponse(res.heatmap_path, media_type="image/png")

@router.get("/{analysis_id}/overlay")
def get_analysis_overlay(analysis_id: str, db: Session = Depends(get_db)):
    res = db.query(ChangeResult).filter(ChangeResult.analysis_id == analysis_id).first()
    if not res or not res.output_mask_path or not Path(res.output_mask_path).exists():
        raise HTTPException(status_code=404, detail="Overlay image not found")
    return FileResponse(res.output_mask_path, media_type="image/png")

@router.get("/{analysis_id}/evaluation")
def get_analysis_evaluation(analysis_id: str, db: Session = Depends(get_db)):
    """
    Returns empirical accuracy metrics evaluated directly against authentic ground truth masks
    (e.g., from the OSCD benchmark).
    """
    res = db.query(ChangeResult).filter(ChangeResult.analysis_id == analysis_id).first()
    if not res:
        raise HTTPException(status_code=404, detail="Analysis result not found")

    summary = res.confidence_summary or {}
    evaluation = summary.get("ground_truth_evaluation")
    if not evaluation:
        return {
            "has_ground_truth": False,
            "message": "No ground truth annotations found for this image pair. To evaluate accuracy, analyze an OSCD benchmark scene."
        }
    return evaluation

