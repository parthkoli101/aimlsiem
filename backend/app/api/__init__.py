from fastapi import APIRouter
from app.api.routes import health
from app.api.routes import logs
from app.api.routes import incidents

api_router = APIRouter()

api_router.include_router(health.router, prefix="/api")
api_router.include_router(logs.router, prefix="/api")
api_router.include_router(incidents.router, prefix="/api")
