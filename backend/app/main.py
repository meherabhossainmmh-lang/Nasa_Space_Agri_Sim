"""
FastAPI entry point.

Run locally with:
    uvicorn app.main:app --reload --port 8000
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config.settings import settings
from app.routes import health, simulation
from app.routes.errors import register_error_handlers

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description=(
        "Backend for the Space Agriculture & Life Support Simulator. "
        "Phase 1 is a mathematical simulation prototype; the numbers are based on "
        "documented assumptions, not validated NASA predictions."
    ),
    # Docs live under the API prefix so they stay reachable when only /api/*
    # is routed to this app (e.g. behind the Vercel rewrite in vercel.json).
    docs_url=f"{settings.api_prefix}/docs",
    redoc_url=f"{settings.api_prefix}/redoc",
    openapi_url=f"{settings.api_prefix}/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

register_error_handlers(app)

app.include_router(health.router, prefix=settings.api_prefix)
app.include_router(simulation.router, prefix=settings.api_prefix)


@app.get("/", include_in_schema=False)
def root() -> dict:
    return {"message": f"{settings.app_name} is running", "docs": f"{settings.api_prefix}/docs"}
