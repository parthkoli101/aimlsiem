"""
Stage 3 — LightGBM Classifier + Stage 4 SHAP Evidence
Loads pre-trained LightGBM model and label encoder.
Classifies each anomalous event into an attack category.
Runs SHAP to extract the top evidence features.
"""
from __future__ import annotations

import os
import numpy as np
import joblib

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "..", "models", "lgbm_classifier.pkl")
ENCODER_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "..", "models", "label_encoder.pkl")
SCALER_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "..", "models", "lgbm_scaler.pkl")
FEAT_COLS_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "..", "models", "lgbm_feature_cols.pkl")

_model = None
_encoder = None
_scaler = None
_explainer = None
_n_features = None  # number of features the model was trained on


def _load():
    global _model, _encoder, _scaler, _explainer, _n_features
    if _model is None:
        mp = os.path.abspath(MODEL_PATH)
        ep = os.path.abspath(ENCODER_PATH)
        sp = os.path.abspath(SCALER_PATH)
        fp = os.path.abspath(FEAT_COLS_PATH)
        if not os.path.exists(mp):
            raise FileNotFoundError(
                f"LightGBM model not found at {mp}. "
                "Run: python -m app.services.train_models from backend/"
            )
        _model = joblib.load(mp)
        _encoder = joblib.load(ep)
        _scaler = joblib.load(sp) if os.path.exists(sp) else None
        # Determine n_features from scaler or saved feature cols
        if _scaler is not None:
            _n_features = _scaler.n_features_in_
        elif os.path.exists(fp):
            _n_features = len(joblib.load(fp))
        else:
            _n_features = None
        # Lazy SHAP explainer
        try:
            import shap
            _explainer = shap.TreeExplainer(_model)
        except Exception:
            _explainer = None


def classify_events(
    feature_matrix: np.ndarray,
    feature_names: list[str],
    anomaly_flags: list[int],
) -> list[dict]:
    """
    For each event that has anomaly_flag=1 (or all events if desired),
    run LightGBM classification + SHAP evidence.

    Returns list of classification results (one per event):
      - predicted_class: str
      - confidence: float (0-1)
      - shap_evidence: list of (feature_name, contribution_direction, abs_value)
    """
    _load()

    results = []
    if feature_matrix.shape[0] == 0:
        return results

    X = feature_matrix.copy()
    # Align feature dimensions: log-parser features may differ from CICIDS training features
    if _n_features is not None and X.shape[1] != _n_features:
        if X.shape[1] < _n_features:
            # Pad with zeros for missing CICIDS features
            pad = np.zeros((X.shape[0], _n_features - X.shape[1]))
            X = np.hstack([X, pad])
        else:
            # Trim extra features
            X = X[:, :_n_features]
    if _scaler is not None:
        X = _scaler.transform(X)

    # Predict all events (classifier still gives BENIGN for normal ones)
    try:
        proba = _model.predict_proba(X)
        preds = np.argmax(proba, axis=1)
        confidences = np.max(proba, axis=1)
    except Exception:
        raw_preds = _model.predict(X)
        preds = raw_preds
        confidences = np.ones(len(preds))

    # SHAP values for evidence
    shap_vals = None
    if _explainer is not None:
        try:
            sv = _explainer.shap_values(X)
            # For multi-class: sv is list of arrays
            if isinstance(sv, list):
                # Use the predicted class SHAP for each sample
                shap_vals = sv
            else:
                shap_vals = sv
        except Exception:
            shap_vals = None

    for i in range(len(preds)):
        try:
            class_name = _encoder.inverse_transform([preds[i]])[0]
        except Exception:
            class_name = str(preds[i])

        # Extract top SHAP features
        evidence = []
        if shap_vals is not None:
            try:
                if isinstance(shap_vals, list):
                    # Multi-class: get SHAP for predicted class
                    sv_row = shap_vals[int(preds[i])][i]
                else:
                    sv_row = shap_vals[i]
                top_idx = np.argsort(np.abs(sv_row))[::-1][:5]
                for idx in top_idx:
                    if idx < len(feature_names):
                        direction = "increases" if sv_row[idx] > 0 else "decreases"
                        evidence.append({
                            "feature": feature_names[idx],
                            "direction": direction,
                            "importance": float(abs(sv_row[idx])),
                        })
            except Exception:
                pass

        # Fallback evidence from feature values
        if not evidence and i < feature_matrix.shape[0]:
            row = feature_matrix[i]
            top_idx = np.argsort(np.abs(row))[::-1][:3]
            for idx in top_idx:
                if idx < len(feature_names) and row[idx] != 0:
                    evidence.append({
                        "feature": feature_names[idx],
                        "direction": "elevated",
                        "importance": float(abs(row[idx])),
                    })

        results.append({
            "predicted_class": class_name,
            "confidence": float(confidences[i]),
            "shap_evidence": evidence,
            "is_anomaly": bool(anomaly_flags[i]) if i < len(anomaly_flags) else False,
        })

    return results
