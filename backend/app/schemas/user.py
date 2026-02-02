from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from app.models.user import UserRole

# Schemas para requests (entrada de datos)
class UserCreate(BaseModel):
    """Schema para crear usuario - similar a RegisterForm Django"""
    username: str
    email: EmailStr
    password: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None

class UserLogin(BaseModel):
    """Schema para login - similar a LoginForm Django"""
    username: str
    password: str

# Schemas para responses (salida de datos)
class UserBase(BaseModel):
    """Schema base del usuario (sin datos sensibles)"""
    id: int
    username: str
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: UserRole
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True  # Para trabajar con SQLAlchemy

class UserResponse(UserBase):
    """Schema completo de respuesta de usuario"""
    pass

# Schema para tokens
class Token(BaseModel):
    """Schema para respuesta de autenticación"""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse