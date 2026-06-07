from pydantic_settings import BaseSettings
from typing import Optional, List
import os
import json
import secrets


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "ROAD-WATCH API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False  # Default OFF for production safety

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # MongoDB
    MONGODB_URL: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "roadwatch"

    # JWT — must be overridden in production via env var
    SECRET_KEY: str = "roadwatch-dev-secret-change-in-production-min-32-chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # CORS — comma-separated or JSON array in env
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]
    # Set CORS_ALLOW_ALL=true in .env to allow all origins (useful for hackathon demos)
    CORS_ALLOW_ALL: bool = True

    # Frontend URL (for CORS)
    FRONTEND_URL: str = ""

    # File Upload
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB

    # Road defect detection
    YOLO_MODEL_PATH: str = "yolov8n.pt"
    YOLO_CONFIDENCE_THRESHOLD: float = 0.25
    DUPLICATE_RADIUS_METERS: int = 150

    # Grok AI (xAI) API
    GROK_API_KEY: str = ""
    GROK_MODEL: str = "grok-beta"

    class Config:
        env_file = ".env"
        extra = "allow"

    def model_post_init(self, __context):
        # Parse CORS_ORIGINS if it's a JSON string from env
        if isinstance(self.CORS_ORIGINS, str):
            try:
                self.CORS_ORIGINS = json.loads(self.CORS_ORIGINS)
            except Exception:
                self.CORS_ORIGINS = [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

        # Append FRONTEND_URL if provided and not already in list
        if self.FRONTEND_URL and self.FRONTEND_URL not in self.CORS_ORIGINS:
            self.CORS_ORIGINS.append(self.FRONTEND_URL)

    def get_cors_origins(self) -> List[str]:
        """Return ['*'] if CORS_ALLOW_ALL, else the configured list."""
        if self.CORS_ALLOW_ALL:
            return ["*"]
        return self.CORS_ORIGINS


settings = Settings()

# Ensure upload directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
