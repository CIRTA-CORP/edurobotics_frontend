import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { getStoredUser } from '../services/auth'

function DashboardPage() {
  const [user, setUser] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const storedUser = getStoredUser()
    if (!storedUser) {
      navigate('/login')
      return
    }
    setUser(storedUser)
  }, [navigate])

  if (!user) return <div className="loading">Cargando...</div>

  const redirectTo = user.role === 'admin' ? '/admin' : '/student'
  return <Navigate to={redirectTo} replace />
}

export default DashboardPage