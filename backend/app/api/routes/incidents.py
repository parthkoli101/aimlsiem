"""
GET  /api/incidents       — List all incidents from last analysis
GET  /api/incidents/{id}  — Get single incident
POST /api/incidents/{id}/chat  — Groq manager chat locked to incident
"""
from __future__ import annotations

import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.pipeline.orchestrator import get_last_analysis, get_incident_by_id
from app.services.pipeline.groq_agent import chat_about_incident

router = APIRouter(prefix="/incidents", tags=["incidents"])
logger = logging.getLogger(__name__)


class ChatRequest(BaseModel):
    message: str
    history: list[dict] = []


@router.get("")
async def list_incidents():
    """Return all incidents from the last uploaded log analysis."""
    data = get_last_analysis()
    return {
        "incidents": data.get("incidents", []),
        "metadata": data.get("metadata", {}),
        "analyzed_at": data.get("timestamp"),
    }


@router.get("/{incident_id}")
async def get_incident(incident_id: str):
    """Return a single incident by ID."""
    incident = get_incident_by_id(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found.")
    return incident


@router.post("/{incident_id}/chat")
async def chat_with_incident(incident_id: str, body: ChatRequest):
    """
    Groq manager chat locked to a specific incident.
    Returns AI response in the context of only that incident.
    """
    incident = get_incident_by_id(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found.")

    reply = chat_about_incident(
        incident=incident,
        conversation_history=body.history,
        user_message=body.message,
    )
    return {
        "sender": "ai",
        "message": reply,
        "incident_id": incident_id,
    }
