from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.ai_model import AIModel
from backend.app.schemas.ai_model import AIModelResponse
from backend.app.ml.train import train_siamese_unet

router = APIRouter(prefix="/models", tags=["AI Models"])

class TrainModelRequest(BaseModel):
    epochs: int = 3
    batch_size: int = 4
    learning_rate: float = 0.001

@router.get("", response_model=List[AIModelResponse])
def list_ai_models(db: Session = Depends(get_db)):
    return db.query(AIModel).order_by(AIModel.created_at.asc()).all()

@router.get("/{model_id}", response_model=AIModelResponse)
def get_ai_model(model_id: str, db: Session = Depends(get_db)):
    model = db.query(AIModel).filter(AIModel.id == model_id).first()
    if not model:
        raise HTTPException(status_code=404, detail="AI Model not found")
    return model

@router.post("/train", response_model=AIModelResponse)
def train_model(payload: TrainModelRequest, db: Session = Depends(get_db)):
    """
    Executes actual PyTorch training on the Siamese U-Net architecture.
    Calculates real precision, recall, F1, and IoU metrics and updates model checkpoint.
    """
    try:
        train_results = train_siamese_unet(
            epochs=payload.epochs,
            batch_size=payload.batch_size,
            learning_rate=payload.learning_rate
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Training pipeline execution failed: {str(e)}")

    # Update Siamese model in DB
    siamese_db = db.query(AIModel).filter(AIModel.architecture.like("%Siamese%")).first()
    if siamese_db:
        siamese_db.metrics = train_results.get("final_metrics", {})
        siamese_db.model_path = train_results.get("model_path")
        db.commit()
        db.refresh(siamese_db)
        return siamese_db
    else:
        raise HTTPException(status_code=404, detail="Siamese model not registered in database")
