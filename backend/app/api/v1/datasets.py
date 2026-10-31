from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.app.database import get_db
from backend.app.models.dataset import Dataset
from backend.app.models.image import SatelliteImage
from backend.app.schemas.dataset import DatasetCreate, DatasetResponse

router = APIRouter(prefix="/datasets", tags=["Dataset Management"])

@router.get("", response_model=List[DatasetResponse])
def list_datasets(db: Session = Depends(get_db)):
    datasets = db.query(Dataset).order_by(Dataset.created_at.desc()).all()
    results = []
    for d in datasets:
        count = db.query(func.count(SatelliteImage.id)).filter(SatelliteImage.dataset_id == d.id).scalar()
        item = DatasetResponse(
            id=d.id,
            name=d.name,
            source=d.source,
            license=d.license,
            description=d.description,
            created_at=d.created_at,
            image_count=count
        )
        results.append(item)
    return results

@router.post("", response_model=DatasetResponse)
def create_dataset(payload: DatasetCreate, db: Session = Depends(get_db)):
    existing = db.query(Dataset).filter(Dataset.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Dataset with this name already exists")
    
    ds = Dataset(
        name=payload.name,
        source=payload.source,
        license=payload.license,
        description=payload.description
    )
    db.add(ds)
    db.commit()
    db.refresh(ds)
    return DatasetResponse(
        id=ds.id,
        name=ds.name,
        source=ds.source,
        license=ds.license,
        description=ds.description,
        created_at=ds.created_at,
        image_count=0
    )

@router.get("/{dataset_id}", response_model=DatasetResponse)
def get_dataset(dataset_id: str, db: Session = Depends(get_db)):
    ds = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found")
    count = db.query(func.count(SatelliteImage.id)).filter(SatelliteImage.dataset_id == ds.id).scalar()
    return DatasetResponse(
        id=ds.id,
        name=ds.name,
        source=ds.source,
        license=ds.license,
        description=ds.description,
        created_at=ds.created_at,
        image_count=count
    )

@router.delete("/{dataset_id}")
def delete_dataset(dataset_id: str, db: Session = Depends(get_db)):
    ds = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found")
    db.delete(ds)
    db.commit()
    return {"message": f"Dataset {dataset_id} deleted successfully"}
