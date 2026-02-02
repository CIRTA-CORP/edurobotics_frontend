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
    
    if 'is_active' not in columns:
        cursor.execute('ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT 1')
        print("✅ Columna is_active agregada a la tabla users")
    
    if 'last_login' not in columns:
        cursor.execute('ALTER TABLE users ADD COLUMN last_login TIMESTAMP NULL')
        print("✅ Columna last_login agregada a la tabla users")
    
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
            SELECT id, username, email, first_name, last_name, is_active 
            FROM users 
            WHERE username = ? AND password_hash = ?
        ''', (username, hash_password(password)))
        
        user = cursor.fetchone()
        
        if not user:
            conn.close()
            return {"success": False, "error": "Usuario o contraseña incorrectos"}
        
        if not user[5]:  # is_active
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
                "last_name": user[4]
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