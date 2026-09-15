// Register route: the split auth screen around RegisterForm (redirects away if
// already logged in).
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStoredUser } from '@/features/auth/services/auth'
import { AuthLayout, AuthHeading } from '@/features/auth/components/AuthLayout'
import { RegisterForm } from '@/features/auth/components/RegisterForm'

const CLAIMS = [
  'Simulador 3D del UR5e en el navegador',
  'Python real, guiado paso a paso',
  'Gratis, sin tarjeta y sin instalar nada',
]

function RegisterPage() {
  const navigate = useNavigate()

  // Redirigir si el usuario ya está autenticado
  useEffect(() => {
    const user = getStoredUser()
    if (user) {
      navigate('/dashboard', { replace: true })
    }
  }, [navigate])

  return (
    <AuthLayout title="Programa un robot industrial hoy mismo." claims={CLAIMS}>
      <AuthHeading title="Crear cuenta">
        Es gratis y no pedimos tarjeta. Entras al simulador enseguida.
      </AuthHeading>
      <RegisterForm />
    </AuthLayout>
  )
}

export default RegisterPage
