import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { loginUser, getStoredUser } from '@/features/auth/services/auth'
import { Button } from '@/shared/components/button'
import { Input } from '@/shared/components/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/shared/components/card'
import { BookOpen, AlertCircle, CheckCircle2 } from 'lucide-react'

const initialState = {
  username: '',
  password: '',
}

function LoginPage() {
  const [form, setForm] = useState(initialState)
  const [message, setMessage] = useState(null)
  const [messageType, setMessageType] = useState('success')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  // Redirigir si el usuario ya está autenticado
  useEffect(() => {
    const user = getStoredUser()
    if (user) {
      navigate('/dashboard', { replace: true })
    }
  }, [navigate])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setMessage(null)
    setLoading(true)

    try {
      const result = await loginUser(form)
      // Token is automatically stored by loginUser function
      setMessageType('success')
      setMessage('¡Bienvenido! Redirigiendo...')
      setTimeout(() => navigate('/dashboard'), 800)
    } catch (error) {
      setMessageType('error')
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="w-full max-w-md">
        {/* Logo y header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <img
              src="/cirtaimagen.jpg"
              alt="CIRTA Logo"
              className="h-16 mix-blend-multiply"
            />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">EduRobotics</h1>
          <p className="text-muted-foreground mt-2">Plataforma educativa de robótica</p>
        </div>

        {/* Card principal */}
        <Card className="border-gray-200 shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-semibold">Iniciar sesión</CardTitle>
            <CardDescription>Ingresa tus credenciales para acceder</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Mensaje de estado */}
            {message && (
              <div
                className={`mb-4 p-3 rounded-lg flex items-start gap-2 text-sm ${messageType === 'success'
                  ? 'bg-green-50 text-green-900 border border-green-200'
                  : 'bg-red-50 text-red-900 border border-red-200'
                  }`}
              >
                {messageType === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                )}
                <span>{message}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium leading-none">
                  Usuario
                </label>
                <Input
                  type="text"
                  id="username"
                  name="username"
                  placeholder="Ingresa tu usuario"
                  value={form.username}
                  onChange={handleChange}
                  required
                  autoComplete="username"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium leading-none">
                  Contraseña
                </label>
                <Input
                  type="password"
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  required
                  autoComplete="current-password"
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Iniciando sesión...' : 'Continuar'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-sm text-center text-muted-foreground">
              ¿No tienes una cuenta?{' '}
              <Link to="/register" className="font-medium text-primary hover:underline">
                Regístrate
              </Link>
            </div>
          </CardFooter>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-8">

        </p>
      </div>
    </div>
  )
}

export default LoginPage