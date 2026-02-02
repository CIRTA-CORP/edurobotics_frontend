// Configuración de la API
const API_BASE = 'http://localhost:8000';

// DOM Elements
const registerForm = document.getElementById('registerForm');
const registerBtn = document.getElementById('registerBtn');
const messageDiv = document.getElementById('message');

// Función para mostrar mensajes
function showMessage(message, type = 'error') {
    messageDiv.textContent = message;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = 'block';
    
    // Auto-hide después de 5 segundos
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 5000);
}

// Validaciones
function validateForm(formData) {
    const { username, email, password, confirmPassword } = formData;
    
    if (username.length < 3) {
        return 'El nombre de usuario debe tener al menos 3 caracteres';
    }
    
    if (!email.includes('@')) {
        return 'Ingresa un email válido';
    }
    
    if (password.length < 6) {
        return 'La contraseña debe tener al menos 6 caracteres';
    }
    
    if (password !== confirmPassword) {
        return 'Las contraseñas no coinciden';
    }
    
    return null;
}

// Manejar envío del formulario
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Obtener datos del formulario
    const formData = {
        username: document.getElementById('username').value.trim(),
        email: document.getElementById('email').value.trim(),
        first_name: document.getElementById('firstName').value.trim(),
        last_name: document.getElementById('lastName').value.trim(),
        password: document.getElementById('password').value,
        confirmPassword: document.getElementById('confirmPassword').value
    };
    
    // Validar formulario
    const validationError = validateForm(formData);
    if (validationError) {
        showMessage(validationError, 'error');
        return;
    }
    
    // Deshabilitar botón
    registerBtn.disabled = true;
    registerBtn.textContent = 'Registrando...';
    
    try {
        // Preparar datos para la API (sin confirmPassword)
        const { confirmPassword, ...apiData } = formData;
        
        // Llamar a la API
        const response = await fetch(`${API_BASE}/api/v1/users/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(apiData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showMessage('¡Registro exitoso! Redirigiendo...', 'success');
            
            // Opcional: guardar información del usuario
            localStorage.setItem('user', JSON.stringify({
                username: result.user || formData.username,
                role: result.role || 'student'
            }));
            
            // Redirigir después de 2 segundos
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 2000);
            
        } else {
            showMessage(result.detail || 'Error en el registro', 'error');
        }
        
    } catch (error) {
        console.error('Error:', error);
        showMessage('Error de conexión. Verifica que el servidor esté corriendo.', 'error');
    }
    
    // Rehabilitar botón
    registerBtn.disabled = false;
    registerBtn.textContent = 'Registrarse';
});

// Validación en tiempo real de contraseñas
document.getElementById('confirmPassword').addEventListener('input', (e) => {
    const password = document.getElementById('password').value;
    const confirmPassword = e.target.value;
    
    if (confirmPassword && password !== confirmPassword) {
        e.target.style.borderColor = '#dc3545';
    } else {
        e.target.style.borderColor = '#e1e5e9';
    }
});