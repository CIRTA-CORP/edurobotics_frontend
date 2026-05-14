import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { registerUser, getStoredUser } from '@/features/auth/services/auth'
import { Button } from '@/shared/components/button'
import { Input } from '@/shared/components/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/shared/components/card'
import { BookOpen, AlertCircle, CheckCircle2 } from 'lucide-react'

const initialState = {
  username: '',
  email: '',
  first_name: '',
  last_name: '',
  password: '',
  password_confirm: '',
}

function RegisterPage() {
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

    if (form.password !== form.password_confirm) {
      setMessageType('error')
      setMessage('Las contraseñas no coinciden')
      return
    }

    setLoading(true)

    try {
      await registerUser(form)
      setMessageType('success')
      setMessage('¡Cuenta creada exitosamente! Redirigiendo...')
      setTimeout(() => navigate('/login'), 1200)
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
            <CardTitle className="text-2xl font-semibold">Crear cuenta</CardTitle>
            <CardDescription>Completa tus datos para registrarte</CardDescription>
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="first_name" className="text-sm font-medium leading-none">
                    Nombre
                  </label>
                  <Input
                    type="text"
                    id="first_name"
                    name="first_name"
                    placeholder="Juan"
                    value={form.first_name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="last_name" className="text-sm font-medium leading-none">
                    Apellido
                  </label>
                  <Input
                    type="text"
                    id="last_name"
                    name="last_name"
                    placeholder="Pérez"
                    value={form.last_name}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium leading-none">
                  Nombre de usuario
                </label>
                <Input
                  type="text"
                  id="username"
                  name="username"
                  placeholder="juanperez"
                  value={form.username}
                  onChange={handleChange}
                  required
                  autoComplete="username"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium leading-none">
                  Correo electrónico
                </label>
                <Input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="juan@ejemplo.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
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
                  autoComplete="new-password"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password_confirm" className="text-sm font-medium leading-none">
                  Confirmar contraseña
                </label>
                <Input
                  type="password"
                  id="password_confirm"
                  name="password_confirm"
                  placeholder="••••••••"
                  value={form.password_confirm}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creando cuenta...' : 'Crear cuenta'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-sm text-center text-muted-foreground">
              ¿Ya tienes una cuenta?{' '}
              <Link to="/login" className="font-medium text-primary hover:underline">
                Inicia sesión
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

export default RegisterPage
