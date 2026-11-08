from typing import Dict, Any
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.image import SatelliteImage
from backend.app.services.preprocessing import check_spatial_compatibility, align_and_load_rasters, assess_preprocessing_quality
from backend.app.services.cloud_masking import cloud_engine

router = APIRouter(prefix="/preprocessing", tags=["Preprocessing Engine"])

class PreprocessRequest(BaseModel):
    earlier_image_id: str
    later_image_id: str

@router.post("/run")
def run_preprocessing_check(payload: PreprocessRequest, db: Session = Depends(get_db)):
    img1 = db.query(SatelliteImage).filter(SatelliteImage.id == payload.earlier_image_id).first()
    img2 = db.query(SatelliteImage).filter(SatelliteImage.id == payload.later_image_id).first()
    
    if not img1 or not img2:
        raise HTTPException(status_code=404, detail="One or both satellite images not found")

    meta1 = {
        "crs": img1.crs,
        "resolution": img1.resolution,
        "bounds": img1.bounds or {}
    }
    meta2 = {
        "crs": img2.crs,
        "resolution": img2.resolution,
        "bounds": img2.bounds or {}
    }

    # 1. Compatibility assessment
    compat = check_spatial_compatibility(meta1, meta2)

    # 2. Alignment and Quality Control
    try:
        norm1, norm2, geo_profile = align_and_load_rasters(img1.file_path, img2.file_path, target_shape=(256, 256))
        qc_report = assess_preprocessing_quality(norm1, norm2, geo_profile)
    except Exception as e:
        qc_report = {
            "quality_grade": "PROCESSING_ERROR",
            "error_detail": str(e)
        }

    return {
        "status": "SUCCESS",
        "compatibility": compat,
        "quality_assessment": qc_report,
        "earlier_image": {
            "id": img1.id,
            "filename": img1.filename,
            "sensor": img1.sensor,
            "crs": img1.crs,
            "resolution": img1.resolution
        },
        "later_image": {
            "id": img2.id,
            "filename": img2.filename,
            "sensor": img2.sensor,
            "crs": img2.crs,
            "resolution": img2.resolution
        }
    }

@router.get("/cloud-mask/{image_id}")
def inspect_image_cloud_mask(image_id: str, db: Session = Depends(get_db)):
    """
    Analyzes an image for cloud and cloud-shadow coverage using spectral thresholding.
    Provides clear-ground observation percentage and flags whether SAR radar fallback is recommended.
    """
    img = db.query(SatelliteImage).filter(SatelliteImage.id == image_id).first()
    if not img:
        raise HTTPException(status_code=404, detail="Image not found")

    result = cloud_engine.detect_clouds_and_shadows(img.file_path)
    result["image_id"] = img.id
    result["filename"] = img.filename
    result["sensor"] = img.sensor
    return result

