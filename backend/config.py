from pydantic_settings import BaseSettings
from typing import Optional, List
import os
import json

class Settings(BaseSettings):
    # Application
    APP_NAME: str = "ROAD-WATCH API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # MongoDB
    MONGODB_URL: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "roadwatch"
    
    # JWT
    SECRET_KEY: str = "roadwatch-super-secret-jwt-key-2024"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"]
    
    # File Upload
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    
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
                self.CORS_ORIGINS = [self.CORS_ORIGINS]

settings = Settings()

# Ensure upload directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
