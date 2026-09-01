from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api import api_router

app = FastAPI(
    title="SIH26-S01 Cybersecurity Assistant API",
    description=(
        "Agentic AI Cybersecurity Assistant for Automated Threat Investigation "
        "and Incident Response."
    ),
    version="0.1.0",
)

# ---------------------------------------------------------------------------
# CORS — allow the React dev server to reach this API
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(api_router)
