from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os

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

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup
    await connect_to_mongo()
    yield
    # Shutdown
    await close_mongo_connection()

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-Powered Smart Governance Platform for Road Infrastructure Monitoring",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for uploads
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include routers
app.include_router(auth_router, prefix="/api")
app.include_router(complaints_router, prefix="/api")
app.include_router(contractors_router, prefix="/api")
app.include_router(projects_router, prefix="/api")
app.include_router(analytics_router, prefix="/api")
app.include_router(alerts_router, prefix="/api")
app.include_router(ai_router, prefix="/api")

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "docs": "/docs",
        "redoc": "/redoc"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    from database import db
    
    try:
        # Check MongoDB connection
        await db.client.admin.command('ping')
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"
    
    return {
        "status": "healthy" if db_status == "connected" else "unhealthy",
        "database": db_status,
        "version": settings.APP_VERSION
    }

@app.get("/api/stats")
async def get_public_stats():
    """Get public statistics (no auth required)"""
    from database import get_database
    
    db = get_database()
    
    total_complaints = await db.complaints.count_documents({})
    resolved = await db.complaints.count_documents({"status": "resolved"})
    contractors = await db.contractors.count_documents({})
    
    return {
        "total_complaints": total_complaints,
        "resolved_complaints": resolved,
        "active_contractors": contractors,
        "resolution_rate": round(resolved / total_complaints * 100, 1) if total_complaints > 0 else 0
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        reload_excludes=["venv/*"]
    )