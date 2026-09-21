"""
POST /api/logs/upload  — Receive JSON log file, run full pipeline, return incidents
"""
from __future__ import annotations

import logging
from fastapi import APIRouter, UploadFile, File, HTTPException

from app.services.pipeline.orchestrator import run_pipeline

router = APIRouter(prefix="/logs", tags=["logs"])
logger = logging.getLogger(__name__)


@router.post("/upload")
async def upload_log(file: UploadFile = File(...)):
    """
    Upload a JSON log file. Runs the full DarkShield ML pipeline:
      1. Parse & normalize
      2. Isolation Forest anomaly detection
      3. LightGBM classification + SHAP
      4. Threat correlation
      5. FAISS semantic search
      6. Groq LLM validation
    Returns structured incident list.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided.")

    # Accept .json files
    if not (
        file.filename.endswith(".json")
        or file.content_type in ("application/json", "text/plain", "text/json")
    ):
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Upload a .json log file."
        )

    try:
        raw_bytes = await file.read()
        if len(raw_bytes) > 50 * 1024 * 1024:  # 50MB cap
            raise HTTPException(status_code=413, detail="File exceeds 50MB limit.")

        logger.info(f"Starting pipeline for file: {file.filename} ({len(raw_bytes)} bytes)")
        result = run_pipeline(raw_bytes)

        return {
            "success": True,
            "filename": file.filename,
            "incidents": result["incidents"],
            "metadata": result["metadata"],
        }
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error(f"Pipeline error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Pipeline error: {str(e)}")
