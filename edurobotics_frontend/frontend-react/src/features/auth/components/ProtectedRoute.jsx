import { Navigate } from 'react-router-dom'
import { getStoredUser } from '@/features/auth/services/auth'

/**
 * ProtectedRoute - Componente para proteger rutas que requieren autenticación
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Componente hijo a renderizar si está autenticado
 * @param {string} props.requiredRole - Rol requerido (opcional: 'admin' o 'student')
 * @returns {React.ReactNode}
 */
function ProtectedRoute({ children, requiredRole = null }) {
    const user = getStoredUser()

    // Si no hay usuario, redirigir al login
    if (!user) {
        return <Navigate to="/login" replace />
    }

    // Si se requiere un rol específico y el usuario no lo tiene, redirigir al dashboard
    if (requiredRole && user.role !== requiredRole) {
        return <Navigate to="/dashboard" replace />
    }

    // Usuario autenticado y con el rol correcto (si se requiere)
    return children
}

export default ProtectedRoute
