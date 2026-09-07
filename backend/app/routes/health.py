from fastapi import APIRouter

from app.config.settings import settings

router = APIRouter(tags=["health"])


@router.get("/health")
def health_check() -> dict:
    """Simple liveness probe used by the frontend to show backend status."""
    return {"status": "ok", "service": settings.app_name, "version": settings.app_version}
