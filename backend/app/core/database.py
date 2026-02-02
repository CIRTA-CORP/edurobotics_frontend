from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.models.user import Base

# Crear engine de base de datos
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
)

# SessionLocal para crear sesiones de DB
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def create_tables():
    """Crear todas las tablas (equivalent to migrate en Django)"""
    Base.metadata.create_all(bind=engine)

def get_db():
    """Dependency para obtener sesión de DB en FastAPI"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()