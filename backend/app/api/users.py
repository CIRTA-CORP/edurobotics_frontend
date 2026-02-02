from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.auth import hash_password, verify_password, create_access_token
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserLogin, UserResponse, Token

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Registro de nuevo usuario - similar a sign_up de Django
    """
    # Verificar si ya existe el usuario
    existing_user = db.query(User).filter(
        (User.username == user_data.username) | (User.email == user_data.email)
    ).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already exists"
        )
    
    # Crear nuevo usuario
    db_user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hash_password(user_data.password),
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        role=UserRole.STUDENT  # Por defecto estudiante
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Crear token
    access_token = create_access_token(data={"sub": str(db_user.id), "username": db_user.username})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": db_user
    }

@router.post("/login", response_model=Token)
async def login(user_data: UserLogin, db: Session = Depends(get_db)):
    """
    Login de usuario - similar a sign_in de Django
    """
    # Buscar usuario
    db_user = db.query(User).filter(User.username == user_data.username).first()
    
    if not db_user or not verify_password(user_data.password, db_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    if not db_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Inactive user"
        )
    
    # Actualizar último login
    from datetime import datetime
    db_user.last_login = datetime.utcnow()
    db.commit()
    
    # Crear token
    access_token = create_access_token(data={"sub": str(db_user.id), "username": db_user.username})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": db_user
    }