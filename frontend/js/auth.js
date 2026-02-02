// EduRobotics - Funciones de autenticación

class AuthManager {
    constructor() {
        this.baseUrl = '';
    }

    // Mostrar mensajes al usuario
    showMessage(text, type) {
        const messagesDiv = document.getElementById('messages');
        const messageClass = type === 'error' ? 'error' : 'success';
        messagesDiv.innerHTML = `<div class="${messageClass}">${text}</div>`;
        
        setTimeout(() => {
            messagesDiv.innerHTML = '';
        }, 5000);
    }

    // Registrar nuevo usuario
    async register(formData) {
        const data = Object.fromEntries(formData);
        
        // Validar contraseñas
        if (data.password !== data.password_confirm) {
            this.showMessage('Las contraseñas no coinciden', 'error');
            return false;
        }
        
        try {
            const submitBtn = document.querySelector('.btn-primary');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Creando cuenta...';
            
            const response = await fetch('/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showMessage('¡Cuenta creada exitosamente! 🎉', 'success');
                document.getElementById('registerForm').reset();
                setTimeout(() => {
                    window.location.href = '/login';
                }, 2000);
                return true;
            } else {
                this.showMessage(result.error || 'Error al crear la cuenta', 'error');
                return false;
            }
        } catch (error) {
            this.showMessage('Error de conexión. Intenta nuevamente.', 'error');
            return false;
        } finally {
            const submitBtn = document.querySelector('.btn-primary');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Crear Cuenta ✨';
        }
    }

    // Iniciar sesión
    async login(formData) {
        const data = Object.fromEntries(formData);
        
        if (!data.username || !data.password) {
            this.showMessage('Usuario y contraseña son requeridos', 'error');
            return false;
        }
        
        try {
            const submitBtn = document.querySelector('.btn-primary');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Iniciando sesión...';
            
            const response = await fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showMessage('¡Bienvenido! 🎉', 'success');
                localStorage.setItem('user', JSON.stringify(result.user));
                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 1500);
                return true;
            } else {
                this.showMessage(result.error || 'Error al iniciar sesión', 'error');
                return false;
            }
        } catch (error) {
            this.showMessage('Error de conexión. Intenta nuevamente.', 'error');
            return false;
        } finally {
            const submitBtn = document.querySelector('.btn-primary');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Iniciar Sesión 🚀';
        }
    }

    // Cerrar sesión
    logout() {
        localStorage.removeItem('user');
        window.location.href = '/login';
    }

    // Obtener usuario actual
    getCurrentUser() {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    }

    // Verificar si está autenticado
    isAuthenticated() {
        return this.getCurrentUser() !== null;
    }
}

// Instancia global
const auth = new AuthManager();