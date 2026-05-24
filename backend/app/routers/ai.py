from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models.ai_prediction import AIPrediction
from app.models.user import User
from app.schemas.ai_prediction import (
    AIHealthResponse,
    ClassifyRequest,
    ClassifyResponse,
    PredictRequest,
    PredictResponse,
)
from app.services.ai import classification_service, prediction_service

router = APIRouter(prefix="/ai", tags=["AI"])


@router.get("/health", response_model=AIHealthResponse)
def ai_health(current_user: User = Depends(get_current_user)):
    return {
        "status": "ok",
        "predictor": prediction_service.health(),
        "classifier": classification_service.health(),
    }


@router.post("/predict", response_model=PredictResponse)
def predict(
    payload: PredictRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    result = prediction_service.predict(rows=payload.rows, n_steps_ahead=payload.n_steps_ahead)
    history = AIPrediction(
        user_id=current_user.id,
        type="predict",
        input_data=payload.model_dump(mode="json"),
        result=result,
    )
    db.add(history)
    db.commit()
    return result


@router.post("/classify", response_model=ClassifyResponse)
def classify(
    payload: ClassifyRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    result = classification_service.classify(**payload.model_dump())
    history = AIPrediction(
        user_id=current_user.id,
        type="classify",
        input_data=payload.model_dump(mode="json"),
        result=result,
    )
    db.add(history)
    db.commit()
    return result

