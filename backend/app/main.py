from datetime import datetime, timezone
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api.v1.router import api_router
from app.core.config import settings
from app.schemas.health import HealthResponse


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Application lifespan context manager for startup and shutdown events.
    """
    # Startup actions (e.g. database pool pre-ping, connection verification)
    yield
    # Shutdown actions (e.g. closing database engines, connection pools)


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Multi-tenant Omnichannel Customer Support Backend with AI Grounding and SLA Engine.",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan
)

# ------------------------------------------------------------------------------
# CORS Middleware (Configured to allow React Native Expo mobile app access)
# ------------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ------------------------------------------------------------------------------
# Consistent Global Error Handlers
# ------------------------------------------------------------------------------
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": True,
            "status_code": exc.status_code,
            "message": exc.detail,
            "detail": exc.detail,
            "path": request.url.path,
            "timestamp": datetime.now(timezone.utc).isoformat()
        },
        # Forward custom headers (e.g. Retry-After from rate limiter)
        headers=dict(exc.headers) if exc.headers else None,
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": True,
            "status_code": status.HTTP_422_UNPROCESSABLE_ENTITY,
            "message": "Input validation error",
            "details": exc.errors(),
            "path": request.url.path,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": True,
            "status_code": status.HTTP_500_INTERNAL_SERVER_ERROR,
            "message": "An unexpected internal server error occurred." if not settings.DEBUG else str(exc),
            "path": request.url.path,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    )


# ------------------------------------------------------------------------------
# Root & Health Endpoints
# ------------------------------------------------------------------------------
@app.get(
    "/",
    summary="Root Service Index",
    tags=["Root"]
)
async def root_index():
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "status": "online",
        "documentation": f"{settings.API_V1_STR}/docs",
        "health_check": "/health",
        "v1_health_check": f"{settings.API_V1_STR}/health"
    }


@app.get(
    "/health",
    response_model=HealthResponse,
    summary="Top-level Service Health Probe",
    tags=["Health"]
)
async def service_health() -> HealthResponse:
    """
    Lightweight health probe endpoint for Docker, Kubernetes, and load balancers.
    """
    return HealthResponse(
        status="ok",
        app_name=settings.PROJECT_NAME,
        version=settings.VERSION,
        environment=settings.ENVIRONMENT,
        timestamp=datetime.now(timezone.utc),
        database="probed_via_v1",
        details={
            "service": "operational",
            "debug": str(settings.DEBUG)
        }
    )


# ------------------------------------------------------------------------------
# Register Versioned API Router
# ------------------------------------------------------------------------------
app.include_router(api_router, prefix=settings.API_V1_STR)

