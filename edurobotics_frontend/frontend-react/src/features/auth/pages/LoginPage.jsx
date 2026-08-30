// Login route: the split auth screen around LoginForm (redirects away if already
// logged in). The brand band on the left is the same one the landing opens with,
// so entering the platform reads as a continuation of the public page.
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStoredUser } from '@/features/auth/services/auth'
import { AuthLayout, AuthHeading } from '@/features/auth/components/AuthLayout'
import { LoginForm } from '@/features/auth/components/LoginForm'

const CLAIMS = [
  'Tu progreso guardado unidad por unidad',
  'El simulador del UR5, sin instalar nada',
  'Todos los cursos, siempre gratis',
]

function LoginPage() {
  const navigate = useNavigate()

  // Redirigir si el usuario ya está autenticado
  useEffect(() => {
    const user = getStoredUser()
    if (user) {
      navigate('/dashboard', { replace: true })
    }
  }, [navigate])

  return (
    <AuthLayout title="Vuelve a donde lo dejaste." claims={CLAIMS}>
      <AuthHeading title="Iniciar sesión">
        Entra con tu usuario para seguir con tus cursos.
      </AuthHeading>
      <LoginForm />
    </AuthLayout>
  )
}

export default LoginPage
