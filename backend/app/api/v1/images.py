import os
import shutil
import uuid
from typing import List, Optional
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from backend.app.config import settings
from backend.app.database import get_db
from backend.app.models.image import SatelliteImage
from backend.app.schemas.image import SatelliteImageResponse
from backend.app.services.acquisition import extract_raster_metadata, generate_preview_image

router = APIRouter(prefix="/images", tags=["Satellite Images"])

@router.get("", response_model=List[SatelliteImageResponse])
def list_satellite_images(
    dataset_id: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    query = db.query(SatelliteImage)
    if dataset_id:
        query = query.filter(SatelliteImage.dataset_id == dataset_id)
    return query.order_by(SatelliteImage.created_at.desc()).limit(limit).all()

@router.get("/{image_id}", response_model=SatelliteImageResponse)
def get_satellite_image(image_id: str, db: Session = Depends(get_db)):
    image = db.query(SatelliteImage).filter(SatelliteImage.id == image_id).first()
    if not image:
        raise HTTPException(status_code=404, detail="Satellite image not found")
    return image

@router.post("/upload", response_model=SatelliteImageResponse)
async def upload_satellite_image(
    file: UploadFile = File(...),
    dataset_id: Optional[str] = Form(None),
    sensor: str = Form("Sentinel-2A MSI"),
    acquisition_date: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    allowed_exts = {".tif", ".tiff", ".png", ".jpg", ".jpeg"}
    suffix = Path(file.filename).suffix.lower()
    if suffix not in allowed_exts:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{suffix}'. Supported: GeoTIFF (.tif, .tiff), PNG, JPEG."
        )

    # Save uploaded file
    file_id = str(uuid.uuid4())
    stored_filename = f"{file_id}_{file.filename}"
    target_path = settings.RAW_DIR / stored_filename
    
    with open(target_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Extract raster metadata
    try:
        metadata = extract_raster_metadata(str(target_path))
    except Exception as e:
        if target_path.exists():
            target_path.unlink()
        raise HTTPException(status_code=400, detail=f"Failed to read raster metadata: {str(e)}")

    # Generate web preview
    preview_filename = f"{file_id}_preview.png"
    preview_path = settings.PROCESSED_DIR / preview_filename
    generate_preview_image(str(target_path), str(preview_path))

    # Parse date
    acq_dt = None
    if acquisition_date:
        try:
            acq_dt = datetime.fromisoformat(acquisition_date.replace("Z", "+00:00"))
        except Exception:
            acq_dt = datetime.now(timezone.utc)
    else:
        acq_dt = datetime.now(timezone.utc)

    # Persist in DB
    image_record = SatelliteImage(
        id=file_id,
        dataset_id=dataset_id,
        filename=file.filename,
        file_path=str(target_path),
        preview_path=str(preview_path),
        acquisition_date=acq_dt,
        sensor=sensor,
        crs=metadata.get("crs", "EPSG:4326"),
        resolution=metadata.get("resolution", 10.0),
        width=metadata.get("width"),
        height=metadata.get("height"),
        channels=metadata.get("channels", 3),
        bounds=metadata.get("bounds"),
        band_metadata=metadata.get("band_metadata")
    )
    db.add(image_record)
    db.commit()
    db.refresh(image_record)

    return image_record

@router.get("/{image_id}/preview")
def get_image_preview(image_id: str, db: Session = Depends(get_db)):
    image = db.query(SatelliteImage).filter(SatelliteImage.id == image_id).first()
    if not image or not image.preview_path or not Path(image.preview_path).exists():
        raise HTTPException(status_code=404, detail="Preview image not found")
    return FileResponse(image.preview_path, media_type="image/png")

@router.delete("/{image_id}")
def delete_satellite_image(image_id: str, db: Session = Depends(get_db)):
    image = db.query(SatelliteImage).filter(SatelliteImage.id == image_id).first()
    if not image:
        raise HTTPException(status_code=404, detail="Satellite image not found")

    # Clean up files safely
    for p in [image.file_path, image.preview_path]:
        if p and Path(p).exists():
            try:
                Path(p).unlink()
            except Exception:
                pass

    db.delete(image)
    db.commit()
    return {"message": f"Satellite image {image_id} successfully deleted"}
