# Versión super simple para probar que funciona
import json
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

class EduRoboticsHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed_path = urlparse(self.path)
        
        if parsed_path.path == '/':
            response = {
                "message": "🤖 EduRobotics API - CIRTA CORP",
                "version": "1.0.0", 
                "status": "running ✅",
                "docs": "Simple HTTP server funcionando"
            }
        elif parsed_path.path == '/health':
            response = {"status": "healthy", "service": "edurobotics"}
        elif parsed_path.path == '/api/v1/users':
            response = {
                "users": [],
                "message": "Sistema de usuarios funcionando ✅"
            }
        else:
            response = {"error": "Not found"}
            
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))
    
    def do_POST(self):
        if self.path == '/api/v1/users/register':
            response = {
                "message": "Registro simulado exitoso",
                "user": "test_user",
                "role": "student"
            }
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))

if __name__ == "__main__":
    print("🚀 Iniciando EduRobotics API...")
    print("📍 Servidor corriendo en: http://localhost:8000")
    print("📝 Endpoints disponibles:")
    print("   - GET  /              (Info general)")
    print("   - GET  /health        (Estado)")
    print("   - GET  /api/v1/users  (Usuarios)")
    print("   - POST /api/v1/users/register (Registro)")
    print("\n✅ Servidor listo! Presiona Ctrl+C para detener\n")
    
    server = HTTPServer(('localhost', 8000), EduRoboticsHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Servidor detenido")
        server.server_close()