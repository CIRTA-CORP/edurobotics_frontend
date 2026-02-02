from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
import enum

Base = declarative_base()

class UserRole(str, enum.Enum):
    """Roles de usuario en la plataforma educativa"""
    STUDENT = "student"      # Estudiante - acceso a cursos
    ADMIN = "admin"         # Administrador - gestión completa

class User(Base):
    """
    Modelo de usuario para la plataforma educativa de robótica
    Adaptado del sistema Django casino pero para educación
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    
    # Información del usuario
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    
    # Control de acceso
    role = Column(Enum(UserRole), default=UserRole.STUDENT, nullable=False)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)
    
    def __repr__(self):
        return f"<User(username='{self.username}', role='{self.role}')>"
    
    @property
    def full_name(self):
        """Nombre completo del usuario"""
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.username
    
    @property 
    def is_admin(self):
        """Check si el usuario es administrador"""
        return self.role == UserRole.ADMIN
        
    @property
    def is_student(self):
        """Check si el usuario es estudiante"""
        return self.role == UserRole.STUDENT