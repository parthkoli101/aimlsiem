"""
Stage 6 — Semantic Memory Check (FAISS + TF-IDF/SVD)
No LLM involved. Pure vector similarity search.

Loads a pre-built FAISS index of historical attack pattern embeddings (TF-IDF + TruncatedSVD).
Given an incident summary, finds the top-K most similar historical attacks.
Uses lightweight sklearn pipeline to avoid TensorFlow/PyTorch dependency conflicts.
"""
from __future__ import annotations

import os
import json
import numpy as np
import joblib

INDEX_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "..", "models", "faiss_index.bin")
META_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "..", "models", "faiss_meta.json")
EMBED_PIPELINE_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "..", "models", "faiss_embed_pipeline.pkl")

_index = None
_meta = None
_embed_pipeline = None


def _load():
    global _index, _meta, _embed_pipeline
    if _index is None:
        import faiss
        idx_path = os.path.abspath(INDEX_PATH)
        meta_path = os.path.abspath(META_PATH)
        pipe_path = os.path.abspath(EMBED_PIPELINE_PATH)
        if not os.path.exists(idx_path):
            raise FileNotFoundError(
                f"FAISS index not found at {idx_path}. "
                "Run: python -m app.services.train_models from backend/"
            )
        _index = faiss.read_index(idx_path)
        with open(meta_path, "r") as f:
            _meta = json.load(f)
        _embed_pipeline = joblib.load(pipe_path)


def find_similar(incident: dict, top_k: int = 3) -> list[dict]:
    """
    Embed the incident summary with TF-IDF/SVD and search FAISS for similar historical attacks.
    Returns list of top_k matches with similarity scores.
    """
    _load()

    # Build query text from incident fields
    query = (
        f"{incident.get('attackType', '')} "
        f"{incident.get('evidenceSummary', '')} "
        f"severity {incident.get('severity', '')} "
        f"risk score {incident.get('riskScore', 0)} "
        f"{' '.join(incident.get('riskFactors', []))}"
    )

    query_vec = _embed_pipeline.transform([query]).astype("float32")
    # Normalize for cosine similarity
    norm = np.linalg.norm(query_vec, axis=1, keepdims=True)
    query_vec = query_vec / (norm + 1e-9)

    distances, indices = _index.search(query_vec, top_k)

    results = []
    for dist, idx in zip(distances[0], indices[0]):
        if idx < 0 or idx >= len(_meta):
            continue
        entry = _meta[idx]
        # Convert L2 distance to cosine similarity percentage
        similarity = max(0.0, 1.0 - dist / 2.0)
        results.append({
            "caseId": entry.get("caseId", f"HIST-{idx:04d}"),
            "attackPattern": entry.get("attackPattern", ""),
            "vector": entry.get("vector", ""),
            "outcome": entry.get("outcome", ""),
            "mitreTactic": entry.get("mitreTactic", ""),
            "similarityScore": f"{int(similarity * 100)}%",
        })

    return results
