import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { registerUser } from '@/features/auth/services/auth'
import { Button } from '@/shared/components/button'
import { Input } from '@/shared/components/input'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

/**
 * RegisterForm — formulario de registro reutilizable.
 *
 * Lo usan tanto la página /register como el AuthModal de la landing.
 *
 * @param {Function} [onSwitchToLogin] - Si se entrega, tras registrarse (y el
 *   enlace "Inicia sesión") cambia a la vista de login del modal en vez de
 *   navegar a /login.
 */
export function RegisterForm({ onSwitchToLogin }) {
  const [form, setForm] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    password_confirm: '',
  })
  const [message, setMessage] = useState(null)
  const [messageType, setMessageType] = useState('success')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

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
      setMessage('¡Cuenta creada exitosamente!')
      // En el modal, volver a la vista de login; en la página, navegar a /login.
      setTimeout(() => {
        if (onSwitchToLogin) onSwitchToLogin()
        else navigate('/login')
      }, 1200)
    } catch (error) {
      setMessageType('error')
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
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

      <div className="mt-4 text-sm text-center text-muted-foreground">
        ¿Ya tienes una cuenta?{' '}
        {onSwitchToLogin ? (
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="font-medium text-primary hover:underline"
          >
            Inicia sesión
          </button>
        ) : (
          <Link to="/login" className="font-medium text-primary hover:underline">
            Inicia sesión
          </Link>
        )}
      </div>
    </>
  )
}
