#!/usr/bin/env python3
"""
EduRobotics - Servidor FastAPI
Plataforma educativa de robótica para CIRTA CORP
"""

import os
import sys
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, status, Header, Depends
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

# Configuración
BASE_DIR = Path(__file__).parent.parent

# Importar funciones de database
sys.path.append(os.path.dirname(__file__))
from database import (
    init_database,
    register_user,
    login_user,
    set_user_role,
    create_course,
    update_course,
    delete_course,
    list_courses,
    set_course_prerequisites,
    get_course_detail,
    create_module,
    delete_module,
    add_module_content,
    list_module_contents,
    delete_module_content,
    create_quiz,
    list_module_quizzes,
    delete_quiz,
    add_quiz_question,
    add_quiz_answer,
)

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

class CoursePayload(BaseModel):
    title: str
    description: Optional[str] = ""
    level: Optional[str] = "beginner"
    version: Optional[int] = 1

class PrerequisitesPayload(BaseModel):
    prereq_ids: list[int]

class ModulePayload(BaseModel):
    title: str
    position: Optional[int] = 1

class ModuleContentPayload(BaseModel):
    content_type: str
    content_value: str

class QuizPayload(BaseModel):
    title: str
    passing_type: Optional[str] = "score"
    passing_score: Optional[int] = 80

class QuizQuestionPayload(BaseModel):
    question_text: str

class QuizAnswerPayload(BaseModel):
    answer_text: str
    is_correct: Optional[bool] = False

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Inicializar base de datos al iniciar"""
    print("🚀 Iniciando EduRobotics FastAPI...")
    print("📊 Inicializando base de datos...")
    init_database()
    print("✅ Base de datos lista")
    yield

# Crear aplicación FastAPI
app = FastAPI(
    title="EduRobotics API",
    description="Plataforma educativa de robótica para CIRTA CORP",
    version="1.0.0",
    lifespan=lifespan,
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def require_admin_token(x_admin_token: str = Header(default="")):
    expected = os.getenv("ADMIN_TOKEN", "change-me")
    if not x_admin_token or x_admin_token != expected:
        raise HTTPException(status_code=403, detail="Acceso restringido a administradores")
    return True

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

# Cursos (admin)
@app.post("/api/courses", dependencies=[Depends(require_admin_token)])
async def create_course_endpoint(payload: CoursePayload):
    course_id = create_course(payload.dict())
    if not course_id:
        raise HTTPException(status_code=500, detail="No se pudo crear el curso")
    return {"success": True, "course_id": course_id}

@app.put("/api/courses/{course_id}", dependencies=[Depends(require_admin_token)])
async def update_course_endpoint(course_id: int, payload: CoursePayload):
    updated = update_course(course_id, payload.dict())
    if not updated:
        raise HTTPException(status_code=404, detail="Curso no encontrado")
    return {"success": True, "course_id": course_id}

@app.delete("/api/courses/{course_id}", dependencies=[Depends(require_admin_token)])
async def delete_course_endpoint(course_id: int):
    deleted = delete_course(course_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Curso no encontrado")
    return {"success": True}

@app.post("/api/courses/{course_id}/prerequisites", dependencies=[Depends(require_admin_token)])
async def set_prerequisites_endpoint(course_id: int, payload: PrerequisitesPayload):
    saved = set_course_prerequisites(course_id, payload.prereq_ids)
    if not saved:
        raise HTTPException(status_code=500, detail="No se pudieron guardar prerequisitos")
    return {"success": True, "course_id": course_id, "prereq_ids": payload.prereq_ids}

@app.post("/api/courses/{course_id}/modules", dependencies=[Depends(require_admin_token)])
async def create_module_endpoint(course_id: int, payload: ModulePayload):
    module_id = create_module(course_id, payload.dict())
    if not module_id:
        raise HTTPException(status_code=500, detail="No se pudo crear el módulo")
    return {"success": True, "module_id": module_id}

@app.post("/api/modules/{module_id}/contents", dependencies=[Depends(require_admin_token)])
async def add_module_content_endpoint(module_id: int, payload: ModuleContentPayload):
    content_id = add_module_content(module_id, payload.dict())
    if not content_id:
        raise HTTPException(status_code=500, detail="No se pudo agregar contenido")
    return {"success": True, "content_id": content_id}

@app.delete("/api/modules/{module_id}", dependencies=[Depends(require_admin_token)])
async def delete_module_endpoint(module_id: int):
    deleted = delete_module(module_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Módulo no encontrado")
    return {"success": True}

@app.delete("/api/contents/{content_id}", dependencies=[Depends(require_admin_token)])
async def delete_module_content_endpoint(content_id: int):
    deleted = delete_module_content(content_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Contenido no encontrado")
    return {"success": True}

@app.get("/api/modules/{module_id}/contents")
async def list_module_contents_endpoint(module_id: int):
    return {"contents": list_module_contents(module_id)}

@app.post("/api/modules/{module_id}/quizzes", dependencies=[Depends(require_admin_token)])
async def create_quiz_endpoint(module_id: int, payload: QuizPayload):
    quiz_id = create_quiz(module_id, payload.dict())
    if not quiz_id:
        raise HTTPException(status_code=500, detail="No se pudo crear el quiz")
    return {"success": True, "quiz_id": quiz_id}

@app.delete("/api/quizzes/{quiz_id}", dependencies=[Depends(require_admin_token)])
async def delete_quiz_endpoint(quiz_id: int):
    deleted = delete_quiz(quiz_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Quiz no encontrado")
    return {"success": True}

@app.get("/api/modules/{module_id}/quizzes")
async def list_module_quizzes_endpoint(module_id: int):
    return {"quizzes": list_module_quizzes(module_id)}

@app.post("/api/quizzes/{quiz_id}/questions", dependencies=[Depends(require_admin_token)])
async def add_quiz_question_endpoint(quiz_id: int, payload: QuizQuestionPayload):
    question_id = add_quiz_question(quiz_id, payload.dict())
    if not question_id:
        raise HTTPException(status_code=500, detail="No se pudo crear la pregunta")
    return {"success": True, "question_id": question_id}

@app.post("/api/questions/{question_id}/answers", dependencies=[Depends(require_admin_token)])
async def add_quiz_answer_endpoint(question_id: int, payload: QuizAnswerPayload):
    answer_id = add_quiz_answer(question_id, payload.dict())
    if not answer_id:
        raise HTTPException(status_code=500, detail="No se pudo crear la respuesta")
    return {"success": True, "answer_id": answer_id}

# Cursos (público)
@app.get("/api/courses")
async def list_courses_endpoint():
    return {"courses": list_courses()}

@app.get("/api/courses/{course_id}")
async def get_course_detail_endpoint(course_id: int):
    course = get_course_detail(course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Curso no encontrado")
    return course

if __name__ == "__main__":
    import uvicorn
    
    print("🎯 Servidor FastAPI iniciado")
    print("🧭 API disponible en: http://localhost:8001/docs")
    print("\n✅ Listo! Presiona Ctrl+C para detener\n")
    
    uvicorn.run(
        "main:app", 
        host="localhost", 
        port=8001, 
        reload=True,
        log_level="info"
    )