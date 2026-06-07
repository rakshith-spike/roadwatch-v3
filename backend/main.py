from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from contextlib import asynccontextmanager
from starlette.middleware.base import BaseHTTPMiddleware
import os
import time
import logging

from config import settings
from database import connect_to_mongo, close_mongo_connection
from routes import (
    auth_router,
    complaints_router,
    contractors_router,
    projects_router,
    analytics_router,
    alerts_router,
    ai_router
)

# Configure logging
logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s — %(message)s",
)
logger = logging.getLogger("roadwatch")


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start = time.perf_counter()
        response = await call_next(request)
        duration = round((time.perf_counter() - start) * 1000, 1)
        logger.info(f"{request.method} {request.url.path} → {response.status_code} ({duration}ms)")
        return response


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    logger.info("Starting ROAD-WATCH API…")
    await connect_to_mongo()
    logger.info("MongoDB connected. API ready.")
    yield
    logger.info("Shutting down ROAD-WATCH API…")
    await close_mongo_connection()


# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-Powered Smart Governance Platform for Road Infrastructure Monitoring",
    lifespan=lifespan,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

# ── Middleware ────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
    allow_credentials=not settings.CORS_ALLOW_ALL,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(RequestLoggingMiddleware)

# ── Error Handlers ────────────────────────────────────────────────────────────

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Return clean 422 with details instead of FastAPI's default verbose output."""
    errors = []
    for error in exc.errors():
        field = " → ".join(str(loc) for loc in error["loc"] if loc != "body")
        errors.append(f"{field}: {error['msg']}" if field else error["msg"])
    return JSONResponse(
        status_code=422,
        content={"detail": "; ".join(errors) or "Validation error"},
    )


@app.exception_handler(404)
async def not_found_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=404,
        content={"detail": f"Endpoint not found: {request.method} {request.url.path}"},
    )


@app.exception_handler(500)
async def server_error_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error. Please try again later."},
    )

# ── Static Files ──────────────────────────────────────────────────────────────

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# ── Routers ───────────────────────────────────────────────────────────────────

app.include_router(auth_router, prefix="/api")
app.include_router(complaints_router, prefix="/api")
app.include_router(contractors_router, prefix="/api")
app.include_router(projects_router, prefix="/api")
app.include_router(analytics_router, prefix="/api")
app.include_router(alerts_router, prefix="/api")
app.include_router(ai_router, prefix="/api")

# ── Root Endpoints ────────────────────────────────────────────────────────────

@app.get("/", tags=["Health"])
async def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "docs": "/docs" if settings.DEBUG else "disabled in production",
    }


@app.get("/health", tags=["Health"])
async def health_check():
    from database import db
    try:
        await db.client.admin.command("ping")
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"

    return {
        "status": "healthy" if db_status == "connected" else "unhealthy",
        "database": db_status,
        "version": settings.APP_VERSION,
    }


@app.get("/api/stats", tags=["Public"])
async def get_public_stats():
    """Public statistics endpoint — no auth required."""
    from database import get_database
    database = get_database()
    try:
        total_complaints = await database.complaints.count_documents({})
        resolved = await database.complaints.count_documents({"status": {"$in": ["resolved", "closed"]}})
        contractors = await database.contractors.count_documents({})
        active = await database.complaints.count_documents({"status": {"$in": ["pending", "verified", "assigned", "in_progress"]}})
        return {
            "total_complaints": total_complaints,
            "resolved_complaints": resolved,
            "active_complaints": active,
            "active_contractors": contractors,
            "resolution_rate": round(resolved / total_complaints * 100, 1) if total_complaints > 0 else 0,
        }
    except Exception:
        return {
            "total_complaints": 0,
            "resolved_complaints": 0,
            "active_complaints": 0,
            "active_contractors": 0,
            "resolution_rate": 0,
        }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        reload_excludes=["venv/*", "uploads/*"],
    )