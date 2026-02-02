import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """Configuración de la aplicación - similar a settings.py Django"""
    
    # Base de datos (empezamos con SQLite para testing)
    DATABASE_URL: str = "sqlite:///./edurobotics.db"
    
    # JWT
    SECRET_KEY: str = "cirta-edurobotics-secret-key-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS
    CORS_ORIGINS: list = ["http://localhost:3000", "http://127.0.0.1:3000"]
    
    # App info
    PROJECT_NAME: str = "EduRobotics API - CIRTA CORP"
    VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    class Config:
        env_file = ".env"

# Instancia global
settings = Settings()