import { Navigate } from 'react-router-dom'
import { getStoredUser } from '@/features/auth/services/auth'

/**
 * ProtectedRoute - Componente para proteger rutas que requieren autenticación
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Componente hijo a renderizar si está autenticado
 * @param {string} props.requiredRole - Rol requerido (opcional: 'admin' o 'student')
 * @param {string[]} props.allowedRoles - Lista de roles permitidos (opcional; los admins
 *   siempre pasan como superconjunto cuando 'admin' está en la lista)
 * @returns {React.ReactNode}
 */
function ProtectedRoute({ children, requiredRole = null, allowedRoles = null }) {
    const user = getStoredUser()

    // Si no hay usuario, redirigir al login
    if (!user) {
        return <Navigate to="/login" replace />
    }

    // Si se requiere un rol específico y el usuario no lo tiene, redirigir al dashboard.
    // Los admins son superconjunto: pueden entrar a rutas de alumno (para previsualizar
    // la experiencia del estudiante), pero un alumno NUNCA accede a rutas de admin.
    if (requiredRole && user.role !== requiredRole && user.role !== 'admin') {
        return <Navigate to="/dashboard" replace />
    }

    // Lista explícita de roles (ej. el panel de gestión es admin + profesor).
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/dashboard" replace />
    }

    // Usuario autenticado y con el rol correcto (si se requiere)
    return children
}

export default ProtectedRoute
