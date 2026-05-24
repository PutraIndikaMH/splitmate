import json
import pickle
from pathlib import Path
from typing import Any

import numpy as np
from fastapi import HTTPException
from tensorflow import keras

from app.ai.components.predictor_custom_objects import AttentionLayer, WeightedHuberLoss


BASE_DIR = Path(__file__).resolve().parents[2]
ARTIFACTS_DIR = BASE_DIR / "ai" / "predictor_artifacts"
MODEL_PATH = ARTIFACTS_DIR / "expense_predictor.keras"
SCALERS_PATH = ARTIFACTS_DIR / "scalers.pkl"
CONFIG_PATH = ARTIFACTS_DIR / "model_config.json"

_MODEL: Any = None
_SCALER_Y: Any = None
_MODEL_CONFIG: dict[str, Any] | None = None
_FEATURE_COLS: list[str] | None = None
_WINDOW: int | None = None
_N_FEATURES: int | None = None


def _ensure_loaded() -> None:
    global _MODEL, _SCALER_Y, _MODEL_CONFIG, _FEATURE_COLS, _WINDOW, _N_FEATURES
    if _MODEL is not None:
        return

    if not MODEL_PATH.exists() or not SCALERS_PATH.exists() or not CONFIG_PATH.exists():
        raise HTTPException(status_code=500, detail="Artifact model prediksi tidak ditemukan")

    _MODEL = keras.models.load_model(
        MODEL_PATH,
        custom_objects={"AttentionLayer": AttentionLayer, "WeightedHuberLoss": WeightedHuberLoss},
    )

    with open(SCALERS_PATH, "rb") as f:
        scalers = pickle.load(f)
    _SCALER_Y = scalers["scaler_y"]

    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        _MODEL_CONFIG = json.load(f)
    _FEATURE_COLS = _MODEL_CONFIG["feature_cols"]
    _WINDOW = _MODEL_CONFIG["window_size"]
    _N_FEATURES = _MODEL_CONFIG["n_features"]


def health() -> dict[str, Any]:
    return {
        "model_exists": MODEL_PATH.exists(),
        "scalers_exists": SCALERS_PATH.exists(),
        "config_exists": CONFIG_PATH.exists(),
        "model_loaded": _MODEL is not None,
    }


def predict(rows: list[dict[str, Any]], n_steps_ahead: int = 1) -> dict[str, Any]:
    _ensure_loaded()

    assert _WINDOW is not None
    assert _FEATURE_COLS is not None
    assert _N_FEATURES is not None
    assert _SCALER_Y is not None
    assert _MODEL_CONFIG is not None

    if len(rows) < _WINDOW:
        raise HTTPException(
            status_code=400, detail=f"Butuh minimal {_WINDOW} baris, tersedia {len(rows)}"
        )

    X_raw = np.array(
        [[float(row.get(col, 0.0)) for col in _FEATURE_COLS] for row in rows],
        dtype=np.float32,
    )
    X_win = X_raw[-_WINDOW:].copy()
    preds: list[dict[str, Any]] = []

    for step in range(n_steps_ahead):
        X_in = X_win[-_WINDOW:].reshape(1, _WINDOW, _N_FEATURES)
        y_norm = float(_MODEL.predict(X_in, verbose=0)[0, 0])
        y_idr = float(_SCALER_Y.inverse_transform([[y_norm]])[0, 0])

        preds.append(
            {
                "step": step + 1,
                "prediksi_norm": y_norm,
                "prediksi_idr": y_idr,
                "prediksi_fmt": f"Rp {y_idr:,.0f}",
            }
        )

        new_row = X_win[-1].copy()
        if "amount_idr" in _FEATURE_COLS:
            new_row[_FEATURE_COLS.index("amount_idr")] = y_norm
        X_win = np.vstack([X_win[1:], new_row])

    return {
        "status": "success",
        "window_size": _WINDOW,
        "predictions": preds,
        "mae_normalized": _MODEL_CONFIG.get("test_mae_norm"),
    }

