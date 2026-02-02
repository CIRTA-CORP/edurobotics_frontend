#!/usr/bin/env python3
"""
EduRobotics - Servidor principal  
Plataforma educativa de robótica para CIRTA CORP
"""

import os
import json
from pathlib import Path
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse

# Configuración
PORT = 8001
BASE_DIR = Path(__file__).parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"

class EduRoboticsServer(SimpleHTTPRequestHandler):
    """Servidor HTTP para EduRobotics"""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(FRONTEND_DIR), **kwargs)
    
    def do_GET(self):
        """Manejar peticiones GET"""
        parsed_path = urlparse(self.path)
        
        # Rutas de páginas
        if parsed_path.path == '/' or parsed_path.path == '/register':
            self.serve_page('pages/register.html')
        elif parsed_path.path == '/login':
            self.serve_page('pages/login.html')
        elif parsed_path.path == '/dashboard':
            self.serve_page('pages/dashboard.html')
        # Archivos estáticos
        else:
            super().do_GET()
    
    def do_POST(self):
        """Manejar peticiones POST"""
        if self.path == '/register':
            self.handle_register()
        elif self.path == '/login':
            self.handle_login()
        else:
            self.send_error(404)
    
    def serve_page(self, page_path):
        """Servir página HTML"""
        try:
            file_path = FRONTEND_DIR / page_path
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            self.send_response(200)
            self.send_header('Content-type', 'text/html; charset=utf-8')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(content.encode('utf-8'))
        except FileNotFoundError:
            self.send_error(404)
    
    def handle_register(self):
        """Procesar registro"""
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            # Validar datos
            required_fields = ['username', 'email', 'first_name', 'last_name', 'password', 'password_confirm']
            for field in required_fields:
                if field not in data or not data[field]:
                    self.send_json(400, {"success": False, "error": f"Campo {field} requerido"})
                    return
            
            if data['password'] != data['password_confirm']:
                self.send_json(400, {"success": False, "error": "Las contraseñas no coinciden"})
                return
            
            # Importar y usar database
            import sys
            sys.path.append(os.path.dirname(__file__))
            from database import register_user
            
            result = register_user(data)
            
            if result['success']:
                self.send_json(201, {
                    "success": True,
                    "message": "Usuario registrado exitosamente",
                    "user": {"username": result['username'], "id": result['user_id']}
                })
            else:
                self.send_json(400, result)
                
        except Exception as e:
            self.send_json(500, {"success": False, "error": f"Error: {str(e)}"})
    
    def handle_login(self):
        """Procesar login"""
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            if not data.get('username') or not data.get('password'):
                self.send_json(400, {"success": False, "error": "Usuario y contraseña requeridos"})
                return
            
            import sys
            sys.path.append(os.path.dirname(__file__))
            from database import login_user
            
            result = login_user(data['username'], data['password'])
            
            if result['success']:
                self.send_json(200, result)
            else:
                self.send_json(401, result)
                
        except Exception as e:
            self.send_json(500, {"success": False, "error": f"Error: {str(e)}"})
    
    def send_json(self, status_code, data):
        """Enviar respuesta JSON"""
        self.send_response(status_code)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))

def main():
    """Función principal"""
    print("🚀 Iniciando EduRobotics...")
    print(f"📍 URL: http://localhost:{PORT}")
    print(f"📁 Frontend: {FRONTEND_DIR}")
    
    # Inicializar base de datos
    print("📊 Inicializando base de datos...")
    import sys
    sys.path.append(os.path.dirname(__file__))
    from database import init_database
    init_database()
    print("✅ Base de datos lista")
    
    # Iniciar servidor
    server = HTTPServer(('localhost', PORT), EduRoboticsServer)
    print(f"\n🎯 Servidor corriendo en puerto {PORT}")
    print("📝 Páginas disponibles:")
    print("   - http://localhost:8001/register")
    print("   - http://localhost:8001/login")  
    print("   - http://localhost:8001/dashboard")
    print("\n✅ Listo! Presiona Ctrl+C para detener\n")
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Servidor detenido")
        server.server_close()

if __name__ == "__main__":
    main()