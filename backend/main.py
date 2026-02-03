#!/usr/bin/env python3
"""
EduRobotics - Servidor FastAPI
Plataforma educativa de robótica para CIRTA CORP
"""

import os
import sys
from pathlib import Path
from fastapi import FastAPI, HTTPException, status, Header, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

# Configuración
BASE_DIR = Path(__file__).parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"

# Importar funciones de database
sys.path.append(os.path.dirname(__file__))
from database import init_database, register_user, login_user, set_user_role

# Modelos Pydantic
class UserRegister(BaseModel):
    username: str
    email: str
    first_name: str
    last_name: str
    password: str
    password_confirm: str

class UserLogin(BaseModel):
    username: str
    password: str

class AdminRoleUpdate(BaseModel):
    username: str
    role: str = "admin"

# Crear aplicación FastAPI
app = FastAPI(
    title="EduRobotics API",
    description="Plataforma educativa de robótica para CIRTA CORP",
    version="1.0.0"
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Montar archivos estáticos
app.mount("/css", StaticFiles(directory=str(FRONTEND_DIR / "css")), name="css")
app.mount("/js", StaticFiles(directory=str(FRONTEND_DIR / "js")), name="js")

def require_admin_token(x_admin_token: str = Header(default="")):
    expected = os.getenv("ADMIN_TOKEN", "change-me")
    if not x_admin_token or x_admin_token != expected:
        raise HTTPException(status_code=403, detail="Acceso restringido a administradores")
    return True

@app.on_event("startup")
async def startup_event():
    """Inicializar base de datos al iniciar"""
    print("🚀 Iniciando EduRobotics FastAPI...")
    print("📊 Inicializando base de datos...")
    init_database()
    print("✅ Base de datos lista")

def load_html_page(page_path: str) -> str:
    """Cargar página HTML"""
    try:
        file_path = FRONTEND_DIR / "pages" / page_path
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Página no encontrada")

@app.get("/", response_class=HTMLResponse)
@app.get("/register", response_class=HTMLResponse)
async def get_register_page():
    """Página de registro"""
    return load_html_page("register.html")

@app.get("/login", response_class=HTMLResponse)
async def get_login_page():
    """Página de login"""
    return load_html_page("login.html")

@app.get("/dashboard", response_class=HTMLResponse)
async def get_dashboard_page():
    """Página del dashboard"""
    return load_html_page("dashboard.html")

@app.post("/register")
async def register_endpoint(user_data: UserRegister):
    """Endpoint de registro de usuarios"""
    try:
        # Validar contraseñas
        if user_data.password != user_data.password_confirm:
            raise HTTPException(
                status_code=400, 
                detail="Las contraseñas no coinciden"
            )
        
        # Usar la función existente de database.py
        result = register_user(user_data.dict())
        
        if result['success']:
            return JSONResponse(
                status_code=201,
                content={
                    "success": True,
                    "message": "Usuario registrado exitosamente",
                    "user": {
                        "username": result['username'],
                        "id": result['user_id'],
                        "role": "student"
                    }
                }
            )
        else:
            raise HTTPException(status_code=400, detail=result['error'])
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

@app.post("/login")
async def login_endpoint(user_data: UserLogin):
    """Endpoint de login de usuarios"""
    try:
        if not user_data.username or not user_data.password:
            raise HTTPException(
                status_code=400, 
                detail="Usuario y contraseña requeridos"
            )
        
        # Usar la función existente de database.py
        result = login_user(user_data.username, user_data.password)
        
        if result['success']:
            return JSONResponse(content=result)
        else:
            raise HTTPException(status_code=401, detail=result['error'])
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

@app.get("/api/health")
async def health_check():
    """Endpoint de salud"""
    return {"status": "ok", "message": "EduRobotics API funcionando correctamente"}

@app.post("/admin/promote", dependencies=[Depends(require_admin_token)])
async def promote_user(payload: AdminRoleUpdate):
    """Asignar rol de administrador a un usuario"""
    if payload.role not in {"admin", "student"}:
        raise HTTPException(status_code=400, detail="Rol inválido")

    updated = set_user_role(payload.username, payload.role)
    if not updated:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    return {"success": True, "username": payload.username, "role": payload.role}

if __name__ == "__main__":
    import uvicorn
    
    print("🎯 Servidor FastAPI iniciado")
    print("📝 Páginas disponibles:")
    print("   - http://localhost:8001/register")
    print("   - http://localhost:8001/login")  
    print("   - http://localhost:8001/dashboard")
    print("   - http://localhost:8001/docs (Documentación API)")
    print("\n✅ Listo! Presiona Ctrl+C para detener\n")
    
    uvicorn.run(
        "main:app", 
        host="localhost", 
        port=8001, 
        reload=True,
        log_level="info"
    )