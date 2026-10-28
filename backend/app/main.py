import logging
from datetime import datetime, timezone
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.api.datasets import router as datasets_router
from app.api.analysis import router as analysis_router
from app.api.reports import router as reports_router
from app.schemas.responses import HealthResponse

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s"
)
logger = logging.getLogger("medianalytics")

start_time = datetime.now(timezone.utc)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Multi-Dataset Medical Data Analytics & Machine Learning Platform",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permits local Vite dev server and external clients
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handler for cleaner frontend error messages
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global error handling request {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"}
    )

# Include Routers
app.include_router(datasets_router, prefix=settings.API_V1_STR)
app.include_router(analysis_router, prefix=settings.API_V1_STR)
app.include_router(reports_router, prefix=settings.API_V1_STR)

@app.get("/api/health", response_model=HealthResponse, tags=["System"])
def health_check():
    """Health check endpoint to verify backend status and version."""
    uptime_seconds = int((datetime.now(timezone.utc) - start_time).total_seconds())
    return HealthResponse(
        status="healthy",
        version=settings.VERSION,
        project=settings.PROJECT_NAME,
        uptime=f"{uptime_seconds}s"
    )

@app.get("/", tags=["System"])
def root():
    return {
        "project": "MediAnalytics API",
        "version": settings.VERSION,
        "docs": "/docs",
        "health": "/api/health"
    }
