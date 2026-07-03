import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStoredUser } from '@/features/auth/services/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/card'
import { RegisterForm } from '@/features/auth/components/RegisterForm'

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="w-full max-w-md">
        {/* Logo y header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <img src="/cirtanitido.svg" alt="CIRTA Logo" className="h-12" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">EduRobotics</h1>
          <p className="text-muted-foreground mt-2">Plataforma educativa de robótica</p>
        </div>

        {/* Card principal */}
        <Card className="border-gray-200 shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-semibold">Crear cuenta</CardTitle>
            <CardDescription>Completa tus datos para registrarte</CardDescription>
          </CardHeader>
          <CardContent>
            <RegisterForm />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default RegisterPage
