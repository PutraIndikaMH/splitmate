from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class PredictRequest(BaseModel):
    rows: list[dict[str, Any]]
    n_steps_ahead: int = Field(default=1, ge=1, le=12)


class PredictItem(BaseModel):
    step: int
    prediksi_norm: float
    prediksi_idr: float
    prediksi_fmt: str


class PredictResponse(BaseModel):
    status: str
    window_size: int
    predictions: list[PredictItem]
    mae_normalized: float | None = None


class ClassifyRequest(BaseModel):
    notes: str
    amount_idr: float
    payment_mode: str = "unknown"
    location: str = "unknown"
    month: int | None = None
    day_of_week: str = "Monday"
    is_weekend: bool = False
    top_k: int = Field(default=3, ge=1, le=10)


class ClassifyTopPrediction(BaseModel):
    category: str
    probability: float


class ClassifyResponse(BaseModel):
    predicted_category: str
    confidence: float
    top_predictions: list[ClassifyTopPrediction]


class AIHealthResponse(BaseModel):
    status: str
    predictor: dict[str, Any]
    classifier: dict[str, Any]


class AIPredictionResponse(BaseModel):
    id: UUID
    user_id: UUID
    type: str
    input_data: dict[str, Any]
    result: dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True
