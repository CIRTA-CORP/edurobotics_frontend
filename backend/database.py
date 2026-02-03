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

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

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
        conn = get_connection()
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
        conn = get_connection()
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
        conn = get_connection()
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
        conn = get_connection()
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
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute('UPDATE users SET role = ? WHERE username = ?', (role, username))
        conn.commit()
        updated = cursor.rowcount
        conn.close()
        return updated > 0
    except Exception as e:
        print(f"❌ Error actualizando rol: {str(e)}")
        return False

def create_course(payload):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            'INSERT INTO courses (title, description, level, version) VALUES (?, ?, ?, ?)',
            (
                payload['title'],
                payload.get('description', ''),
                payload.get('level', 'beginner'),
                payload.get('version', 1),
            )
        )
        conn.commit()
        course_id = cursor.lastrowid
        conn.close()
        return course_id
    except Exception as e:
        print(f"❌ Error creando curso: {str(e)}")
        return None

def update_course(course_id, payload):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            'UPDATE courses SET title = ?, description = ?, level = ?, version = ? WHERE id = ?',
            (
                payload['title'],
                payload.get('description', ''),
                payload.get('level', 'beginner'),
                payload.get('version', 1),
                course_id,
            )
        )
        conn.commit()
        updated = cursor.rowcount
        conn.close()
        return updated > 0
    except Exception as e:
        print(f"❌ Error actualizando curso: {str(e)}")
        return False

def delete_course(course_id):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute('DELETE FROM courses WHERE id = ?', (course_id,))
        conn.commit()
        deleted = cursor.rowcount
        conn.close()
        return deleted > 0
    except Exception as e:
        print(f"❌ Error eliminando curso: {str(e)}")
        return False

def list_courses():
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT id, title, description, level, version FROM courses')
        rows = cursor.fetchall()
        conn.close()
        return [
            {
                "id": row[0],
                "title": row[1],
                "description": row[2],
                "level": row[3],
                "version": row[4],
            }
            for row in rows
        ]
    except Exception as e:
        print(f"❌ Error listando cursos: {str(e)}")
        return []

def set_course_prerequisites(course_id, prereq_ids):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute('DELETE FROM course_prerequisites WHERE course_id = ?', (course_id,))
        for prereq_id in prereq_ids:
            cursor.execute(
                'INSERT OR IGNORE INTO course_prerequisites (course_id, prereq_course_id) VALUES (?, ?)',
                (course_id, prereq_id)
            )
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"❌ Error guardando prerequisitos: {str(e)}")
        return False

def get_course_detail(course_id):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT id, title, description, level, version FROM courses WHERE id = ?', (course_id,))
        course = cursor.fetchone()
        if not course:
            conn.close()
            return None

        cursor.execute(
            'SELECT prereq_course_id FROM course_prerequisites WHERE course_id = ?',
            (course_id,)
        )
        prereqs = [row[0] for row in cursor.fetchall()]

        cursor.execute(
            'SELECT id, title, position FROM modules WHERE course_id = ? ORDER BY position',
            (course_id,)
        )
        module_rows = cursor.fetchall()

        modules = []
        for module_row in module_rows:
            module_id = module_row[0]

            cursor.execute(
                'SELECT id, content_type, content_value, created_at FROM module_contents WHERE module_id = ? ORDER BY id',
                (module_id,)
            )
            contents = [
                {
                    "id": row[0],
                    "content_type": row[1],
                    "content_value": row[2],
                    "created_at": row[3],
                }
                for row in cursor.fetchall()
            ]

            cursor.execute(
                'SELECT id, title, passing_type, passing_score FROM quizzes WHERE module_id = ? ORDER BY id',
                (module_id,)
            )
            quiz_rows = cursor.fetchall()
            quizzes = []
            for quiz_row in quiz_rows:
                quiz_id = quiz_row[0]
                cursor.execute(
                    'SELECT id, question_text FROM quiz_questions WHERE quiz_id = ? ORDER BY id',
                    (quiz_id,)
                )
                question_rows = cursor.fetchall()
                questions = []
                for question_row in question_rows:
                    question_id = question_row[0]
                    cursor.execute(
                        'SELECT id, answer_text, is_correct FROM quiz_answers WHERE question_id = ? ORDER BY id',
                        (question_id,)
                    )
                    answers = [
                        {
                            "id": row[0],
                            "answer_text": row[1],
                            "is_correct": bool(row[2]),
                        }
                        for row in cursor.fetchall()
                    ]
                    questions.append({
                        "id": question_id,
                        "question_text": question_row[1],
                        "answers": answers,
                    })

                quizzes.append({
                    "id": quiz_id,
                    "title": quiz_row[1],
                    "passing_type": quiz_row[2],
                    "passing_score": quiz_row[3],
                    "questions": questions,
                })

            modules.append({
                "id": module_id,
                "title": module_row[1],
                "position": module_row[2],
                "contents": contents,
                "quizzes": quizzes,
            })

        conn.close()
        return {
            "id": course[0],
            "title": course[1],
            "description": course[2],
            "level": course[3],
            "version": course[4],
            "prerequisites": prereqs,
            "modules": modules,
        }
    except Exception as e:
        print(f"❌ Error obteniendo curso: {str(e)}")
        return None

def create_module(course_id, payload):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            'INSERT INTO modules (course_id, title, position) VALUES (?, ?, ?)',
            (course_id, payload['title'], payload.get('position', 1))
        )
        conn.commit()
        module_id = cursor.lastrowid
        conn.close()
        return module_id
    except Exception as e:
        print(f"❌ Error creando módulo: {str(e)}")
        return None

def delete_module(module_id):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute('DELETE FROM modules WHERE id = ?', (module_id,))
        conn.commit()
        deleted = cursor.rowcount
        conn.close()
        return deleted > 0
    except Exception as e:
        print(f"❌ Error eliminando módulo: {str(e)}")
        return False

def add_module_content(module_id, payload):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            'INSERT INTO module_contents (module_id, content_type, content_value) VALUES (?, ?, ?)',
            (module_id, payload['content_type'], payload['content_value'])
        )
        conn.commit()
        content_id = cursor.lastrowid
        conn.close()
        return content_id
    except Exception as e:
        print(f"❌ Error agregando contenido: {str(e)}")
        return None

def delete_module_content(content_id):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute('DELETE FROM module_contents WHERE id = ?', (content_id,))
        conn.commit()
        deleted = cursor.rowcount
        conn.close()
        return deleted > 0
    except Exception as e:
        print(f"❌ Error eliminando contenido: {str(e)}")
        return False

def create_quiz(module_id, payload):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            'INSERT INTO quizzes (module_id, title, passing_type, passing_score) VALUES (?, ?, ?, ?)',
            (
                module_id,
                payload['title'],
                payload.get('passing_type', 'score'),
                payload.get('passing_score', 80)
            )
        )
        conn.commit()
        quiz_id = cursor.lastrowid
        conn.close()
        return quiz_id
    except Exception as e:
        print(f"❌ Error creando quiz: {str(e)}")
        return None

def delete_quiz(quiz_id):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute('DELETE FROM quizzes WHERE id = ?', (quiz_id,))
        conn.commit()
        deleted = cursor.rowcount
        conn.close()
        return deleted > 0
    except Exception as e:
        print(f"❌ Error eliminando quiz: {str(e)}")
        return False

def add_quiz_question(quiz_id, payload):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            'INSERT INTO quiz_questions (quiz_id, question_text) VALUES (?, ?)',
            (quiz_id, payload['question_text'])
        )
        conn.commit()
        question_id = cursor.lastrowid
        conn.close()
        return question_id
    except Exception as e:
        print(f"❌ Error creando pregunta: {str(e)}")
        return None

def add_quiz_answer(question_id, payload):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            'INSERT INTO quiz_answers (question_id, answer_text, is_correct) VALUES (?, ?, ?)',
            (question_id, payload['answer_text'], 1 if payload.get('is_correct') else 0)
        )
        conn.commit()
        answer_id = cursor.lastrowid
        conn.close()
        return answer_id
    except Exception as e:
        print(f"❌ Error creando respuesta: {str(e)}")
        return None

def list_module_contents(module_id):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            'SELECT id, content_type, content_value, created_at FROM module_contents WHERE module_id = ? ORDER BY id',
            (module_id,)
        )
        rows = cursor.fetchall()
        conn.close()
        return [
            {
                "id": row[0],
                "content_type": row[1],
                "content_value": row[2],
                "created_at": row[3],
            }
            for row in rows
        ]
    except Exception as e:
        print(f"❌ Error listando contenidos: {str(e)}")
        return []

def list_module_quizzes(module_id):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            'SELECT id, title, passing_type, passing_score FROM quizzes WHERE module_id = ? ORDER BY id',
            (module_id,)
        )
        quiz_rows = cursor.fetchall()
        quizzes = []
        for quiz_row in quiz_rows:
            quiz_id = quiz_row[0]
            cursor.execute(
                'SELECT id, question_text FROM quiz_questions WHERE quiz_id = ? ORDER BY id',
                (quiz_id,)
            )
            question_rows = cursor.fetchall()
            questions = []
            for question_row in question_rows:
                question_id = question_row[0]
                cursor.execute(
                    'SELECT id, answer_text, is_correct FROM quiz_answers WHERE question_id = ? ORDER BY id',
                    (question_id,)
                )
                answers = [
                    {
                        "id": row[0],
                        "answer_text": row[1],
                        "is_correct": bool(row[2]),
                    }
                    for row in cursor.fetchall()
                ]
                questions.append({
                    "id": question_id,
                    "question_text": question_row[1],
                    "answers": answers,
                })

            quizzes.append({
                "id": quiz_id,
                "title": quiz_row[1],
                "passing_type": quiz_row[2],
                "passing_score": quiz_row[3],
                "questions": questions,
            })

        conn.close()
        return quizzes
    except Exception as e:
        print(f"❌ Error listando quizzes: {str(e)}")
        return []