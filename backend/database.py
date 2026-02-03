#!/usr/bin/env python3
"""
EduRobotics - Gestión de base de datos
Funciones para manejo de usuarios y autenticación
"""

import sqlite3
import hashlib
from pathlib import Path

# Configuración de la base de datos
DB_PATH = Path(__file__).parent / "edurobotics.db"

def init_database():
    """Inicializar la base de datos con las tablas necesarias"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("PRAGMA foreign_keys = ON")
    
    # Tabla de usuarios
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT DEFAULT 'student',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMP NULL
        )
    ''')
    
    # Verificar si las columnas existen y agregarlas si no
    cursor.execute("PRAGMA table_info(users)")
    columns = [column[1] for column in cursor.fetchall()]
    
    if 'role' not in columns:
        cursor.execute("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'student'")
        print("✅ Columna role agregada a la tabla users")

    if 'is_active' not in columns:
        cursor.execute('ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT 1')
        print("✅ Columna is_active agregada a la tabla users")
    
    if 'last_login' not in columns:
        cursor.execute('ALTER TABLE users ADD COLUMN last_login TIMESTAMP NULL')
        print("✅ Columna last_login agregada a la tabla users")

    # Tabla de cursos
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS courses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            level TEXT DEFAULT 'beginner',
            version INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Prerequisitos de cursos
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS course_prerequisites (
            course_id INTEGER NOT NULL,
            prereq_course_id INTEGER NOT NULL,
            PRIMARY KEY (course_id, prereq_course_id),
            FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
            FOREIGN KEY (prereq_course_id) REFERENCES courses(id) ON DELETE CASCADE
        )
    ''')

    # Módulos
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS modules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            course_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            position INTEGER DEFAULT 1,
            FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
        )
    ''')

    # Contenidos de módulos
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS module_contents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            module_id INTEGER NOT NULL,
            content_type TEXT NOT NULL,
            content_value TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
        )
    ''')

    # Quizzes
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS quizzes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            module_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            passing_type TEXT DEFAULT 'score',
            passing_score INTEGER DEFAULT 80,
            FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
        )
    ''')

    # Preguntas
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS quiz_questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            quiz_id INTEGER NOT NULL,
            question_text TEXT NOT NULL,
            FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
        )
    ''')

    # Respuestas
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS quiz_answers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            question_id INTEGER NOT NULL,
            answer_text TEXT NOT NULL,
            is_correct INTEGER DEFAULT 0,
            FOREIGN KEY (question_id) REFERENCES quiz_questions(id) ON DELETE CASCADE
        )
    ''')
    
    conn.commit()
    conn.close()
    print("✅ Tablas de base de datos creadas/verificadas")

def hash_password(password):
    """Hashear contraseña de forma segura"""
    return hashlib.sha256(password.encode()).hexdigest()

def register_user(data):
    """
    Registrar un nuevo usuario
    
    Args:
        data (dict): Datos del usuario (username, email, first_name, last_name, password)
    
    Returns:
        dict: Resultado de la operación
    """
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Verificar si el usuario ya existe
        cursor.execute(
            'SELECT id FROM users WHERE username = ? OR email = ?',
            (data['username'], data['email'])
        )
        
        if cursor.fetchone():
            conn.close()
            return {"success": False, "error": "Usuario o email ya existe"}
        
        # Insertar nuevo usuario
        cursor.execute('''
            INSERT INTO users (username, email, first_name, last_name, password_hash)
            VALUES (?, ?, ?, ?, ?)
        ''', (
            data['username'],
            data['email'],
            data['first_name'],
            data['last_name'],
            hash_password(data['password'])
        ))
        
        conn.commit()
        user_id = cursor.lastrowid
        conn.close()
        
        print(f"✅ Usuario registrado: {data['username']} (ID: {user_id})")
        return {
            "success": True,
            "user_id": user_id,
            "username": data['username']
        }
        
    except Exception as e:
        print(f"❌ Error en registro: {str(e)}")
        return {"success": False, "error": f"Error de base de datos: {str(e)}"}

def login_user(username, password):
    """
    Autenticar usuario
    
    Args:
        username (str): Nombre de usuario
        password (str): Contraseña
    
    Returns:
        dict: Resultado de autenticación
    """
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Buscar usuario
        cursor.execute('''
            SELECT id, username, email, first_name, last_name, role, is_active 
            FROM users 
            WHERE username = ? AND password_hash = ?
        ''', (username, hash_password(password)))
        
        user = cursor.fetchone()
        
        if not user:
            conn.close()
            return {"success": False, "error": "Usuario o contraseña incorrectos"}
        
        if not user[6]:  # is_active
            conn.close()
            return {"success": False, "error": "Cuenta desactivada"}
        
        # Actualizar último login
        cursor.execute(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
            (user[0],)
        )
        conn.commit()
        conn.close()
        
        print(f"✅ Login exitoso: {username}")
        return {
            "success": True,
            "user": {
                "id": user[0],
                "username": user[1],
                "email": user[2],
                "first_name": user[3],
                "last_name": user[4],
                "role": user[5]
            }
        }
        
    except Exception as e:
        print(f"❌ Error en login: {str(e)}")
        return {"success": False, "error": f"Error de base de datos: {str(e)}"}

def get_user_stats():
    """Obtener estadísticas de usuarios"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute('SELECT COUNT(*) FROM users')
        total_users = cursor.fetchone()[0]
        
        cursor.execute('SELECT COUNT(*) FROM users WHERE is_active = 1')
        active_users = cursor.fetchone()[0]
        
        conn.close()
        
        return {
            "total_users": total_users,
            "active_users": active_users
        }
    except Exception as e:
        print(f"❌ Error obteniendo estadísticas: {str(e)}")
        return None

def get_user_role(username):
    """Obtener el rol de un usuario"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute('SELECT role FROM users WHERE username = ?', (username,))
        row = cursor.fetchone()
        conn.close()
        return row[0] if row else None
    except Exception as e:
        print(f"❌ Error obteniendo rol: {str(e)}")
        return None

def set_user_role(username, role):
    """Actualizar el rol de un usuario"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute('UPDATE users SET role = ? WHERE username = ?', (role, username))
        conn.commit()
        updated = cursor.rowcount
        conn.close()
        return updated > 0
    except Exception as e:
        print(f"❌ Error actualizando rol: {str(e)}")
        return False