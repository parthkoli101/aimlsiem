from fastapi import APIRouter
from app.schemas.health import HealthResponse
from app.core.config import settings

router = APIRouter()


@router.get("/health", response_model=HealthResponse, tags=["System"])
async def health_check():
    """Returns the current health status of the API service."""
    return HealthResponse(
        status="ok",
        service="SIH26-S01 Cybersecurity Assistant API",
        version="0.1.0",
        environment=settings.APP_ENV,
    )
