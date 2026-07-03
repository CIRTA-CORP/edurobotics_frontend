import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { loginUser } from '@/features/auth/services/auth'
import { Button } from '@/shared/components/button'
import { Input } from '@/shared/components/input'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

/**
 * LoginForm — formulario de inicio de sesión reutilizable.
 *
 * Lo usan tanto la página /login como el AuthModal de la landing, para no
 * duplicar la lógica de autenticación.
 *
 * @param {Function} [onSwitchToRegister] - Si se entrega, el enlace "Regístrate"
 *   llama a esta función (cambiar de vista en el modal) en vez de navegar a /register.
 */
export function LoginForm({ onSwitchToRegister }) {
  const [form, setForm] = useState({ username: '', password: '' })
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
    setLoading(true)

    try {
      await loginUser(form)
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
          <div className="text-right">
            <Link to="/forgot-password" className="text-xs font-medium text-primary hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Iniciando sesión...' : 'Continuar'}
        </Button>
      </form>

      <div className="mt-4 text-sm text-center text-muted-foreground">
        ¿No tienes una cuenta?{' '}
        {onSwitchToRegister ? (
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="font-medium text-primary hover:underline"
          >
            Regístrate
          </button>
        ) : (
          <Link to="/register" className="font-medium text-primary hover:underline">
            Regístrate
          </Link>
        )}
      </div>
    </>
  )
}
