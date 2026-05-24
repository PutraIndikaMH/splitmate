import datetime
import json
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
from fastapi import HTTPException
from tensorflow import keras
from tensorflow.keras.preprocessing.sequence import pad_sequences

from app.ai.components.classifier_custom_objects import FocalLoss, PositionalEmbedding


BASE_DIR = Path(__file__).resolve().parents[2]
ARTIFACTS_DIR = BASE_DIR / "ai" / "classifier_artifacts"
MODEL_PATH = ARTIFACTS_DIR / "best_model.keras"
CONFIG_PATH = ARTIFACTS_DIR / "model_config.json"
LE_PATH = ARTIFACTS_DIR / "label_encoder.pkl"
TOKENIZER_PATH = ARTIFACTS_DIR / "tokenizer.pkl"
SCALER_PATH = ARTIFACTS_DIR / "scaler.pkl"
CAT_COLUMNS_PATH = ARTIFACTS_DIR / "cat_columns.pkl"

_MODEL: Any = None
_CONFIG: dict[str, Any] | None = None
_LE: Any = None
_TOKENIZER: Any = None
_SCALER: Any = None
_CAT_COLUMNS: list[str] | None = None

NUM_COLS = ["amount_idr", "month", "is_weekend"]
CAT_COLS = ["payment_mode", "location", "day_of_week"]


def _ensure_loaded() -> None:
    global _MODEL, _CONFIG, _LE, _TOKENIZER, _SCALER, _CAT_COLUMNS
    if _MODEL is not None:
        return

    needed = [MODEL_PATH, CONFIG_PATH, LE_PATH, TOKENIZER_PATH, SCALER_PATH, CAT_COLUMNS_PATH]
    if not all(p.exists() for p in needed):
        raise HTTPException(status_code=500, detail="Artifact model klasifikasi tidak ditemukan")

    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        _CONFIG = json.load(f)

    _MODEL = keras.models.load_model(
        MODEL_PATH, custom_objects={"PositionalEmbedding": PositionalEmbedding, "FocalLoss": FocalLoss}
    )
    _LE = joblib.load(LE_PATH)
    _TOKENIZER = joblib.load(TOKENIZER_PATH)
    _SCALER = joblib.load(SCALER_PATH)
    _CAT_COLUMNS = joblib.load(CAT_COLUMNS_PATH)


def health() -> dict[str, Any]:
    return {
        "model_exists": MODEL_PATH.exists(),
        "config_exists": CONFIG_PATH.exists(),
        "label_encoder_exists": LE_PATH.exists(),
        "tokenizer_exists": TOKENIZER_PATH.exists(),
        "scaler_exists": SCALER_PATH.exists(),
        "cat_columns_exists": CAT_COLUMNS_PATH.exists(),
        "model_loaded": _MODEL is not None,
    }


def _preprocess(
    notes: str,
    amount_idr: float,
    payment_mode: str,
    location: str,
    month: int,
    day_of_week: str,
    is_weekend: bool,
) -> tuple[np.ndarray, np.ndarray]:
    assert _TOKENIZER is not None
    assert _CONFIG is not None
    assert _SCALER is not None
    assert _CAT_COLUMNS is not None

    seq = _TOKENIZER.texts_to_sequences([notes.lower()])
    x_text = pad_sequences(seq, maxlen=_CONFIG["max_len"], padding="post").astype(np.int32)

    num_df = pd.DataFrame([{"amount_idr": amount_idr, "month": month, "is_weekend": int(is_weekend)}])
    x_num = _SCALER.transform(num_df[NUM_COLS]).astype(np.float32)

    cat_df = pd.DataFrame([{"payment_mode": payment_mode, "location": location, "day_of_week": day_of_week}])
    cat_enc = pd.get_dummies(cat_df, columns=CAT_COLS).reindex(columns=_CAT_COLUMNS, fill_value=0)
    x_cat = cat_enc.values.astype(np.float32)

    x_tab = np.concatenate([x_num, x_cat], axis=1)
    return x_text, x_tab


def classify(
    notes: str,
    amount_idr: float,
    payment_mode: str = "unknown",
    location: str = "unknown",
    month: int | None = None,
    day_of_week: str = "Monday",
    is_weekend: bool = False,
    top_k: int = 3,
) -> dict[str, Any]:
    _ensure_loaded()
    assert _MODEL is not None
    assert _LE is not None

    if month is None:
        month = datetime.datetime.now().month

    x_text, x_tab = _preprocess(
        notes=notes,
        amount_idr=amount_idr,
        payment_mode=payment_mode,
        location=location,
        month=month,
        day_of_week=day_of_week,
        is_weekend=is_weekend,
    )

    probs = _MODEL.predict([x_text, x_tab], verbose=0)[0]
    top_idx = np.argsort(probs)[::-1][:top_k]
    top_predictions = [
        {"category": _LE.classes_[i], "probability": float(round(float(probs[i]), 4))}
        for i in top_idx
    ]

    return {
        "predicted_category": top_predictions[0]["category"],
        "confidence": top_predictions[0]["probability"],
        "top_predictions": top_predictions,
    }

