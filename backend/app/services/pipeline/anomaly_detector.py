"""
Stage 2 — Anomaly Detector: Isolation Forest (unsupervised)
Loads pre-trained Isolation Forest model and scores each event.
Returns anomaly scores and binary flags (1 = anomalous).
"""
from __future__ import annotations

import os
import numpy as np
import joblib

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "..", "models", "isolation_forest.pkl")
SCALER_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "..", "models", "if_scaler.pkl")

_model = None
_scaler = None


def _load():
    global _model, _scaler
    if _model is None:
        mp = os.path.abspath(MODEL_PATH)
        sp = os.path.abspath(SCALER_PATH)
        if not os.path.exists(mp):
            raise FileNotFoundError(
                f"Isolation Forest model not found at {mp}. "
                "Run: python -m app.services.train_models from backend/"
            )
        _model = joblib.load(mp)
        _scaler = joblib.load(sp) if os.path.exists(sp) else None


def score_events(feature_matrix: np.ndarray) -> dict:
    """
    Score events with Isolation Forest.
    Returns dict with:
      - anomaly_flags: list[int]  (1 = anomaly, 0 = normal)
      - anomaly_scores: list[float]  (higher = more anomalous, 0-1 normalized)
    """
    _load()

    if feature_matrix.shape[0] == 0:
        return {"anomaly_flags": [], "anomaly_scores": []}

    X = feature_matrix.copy()
    if _scaler is not None:
        X = _scaler.transform(X)

    # Isolation Forest returns -1 (anomaly) or 1 (normal)
    raw_preds = _model.predict(X)
    # decision_function: lower = more anomalous
    raw_scores = _model.decision_function(X)

    # Normalize scores to 0-1 (1 = most anomalous)
    min_s, max_s = raw_scores.min(), raw_scores.max()
    if max_s > min_s:
        norm_scores = 1.0 - (raw_scores - min_s) / (max_s - min_s)
    else:
        norm_scores = np.zeros_like(raw_scores)

    anomaly_flags = [1 if p == -1 else 0 for p in raw_preds]

    return {
        "anomaly_flags": anomaly_flags,
        "anomaly_scores": norm_scores.tolist(),
    }
