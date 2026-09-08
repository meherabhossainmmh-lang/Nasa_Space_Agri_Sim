"""
FastAPI entry point.

Run locally with:
    uvicorn app.main:app --reload --port 8000
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config.settings import settings
from app.routes import health, simulation

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description=(
        "Backend for the Space Agriculture & Life Support Simulator. "
        "Phase 1 is a mathematical simulation prototype; the numbers are based on "
        "documented assumptions, not validated NASA predictions."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix=settings.api_prefix)
app.include_router(simulation.router, prefix=settings.api_prefix)


@app.get("/", include_in_schema=False)
def root() -> dict:
    return {"message": f"{settings.app_name} is running", "docs": "/docs"}
