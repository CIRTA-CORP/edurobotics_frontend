// Post-login entry route: sends the user to the right home (admin panel, teacher
// view, or student dashboard) based on their role.
import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { getStoredUser } from '@/features/auth/services/auth'

function DashboardPage() {
  // Lectura síncrona del token: se hace al montar, sin esperar a un efecto
  const [user] = useState(getStoredUser)
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) navigate('/login')
  }, [user, navigate])

  if (!user) return <div className="loading">Cargando...</div>

  const redirectTo =
    user.role === 'admin' ? '/admin' : user.role === 'teacher' ? '/teacher' : '/student'
  return <Navigate to={redirectTo} replace />
}

export default DashboardPage