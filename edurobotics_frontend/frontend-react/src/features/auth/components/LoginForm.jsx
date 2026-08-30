// Login form: validates credentials, calls loginUser, and redirects on success.
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getStoredUser, loginUser } from '@/features/auth/services/auth'
import { Button } from '@/shared/components/button'
import { Input } from '@/shared/components/input'
import { AlertCircle } from 'lucide-react'

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
  const [error, setError] = useState(null)
  const [welcome, setWelcome] = useState(null)   // user, once the login landed
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await loginUser(form)
      // Hand over with a proper panel instead of a green strip: it says who
      // came in and where they are being taken, and holds long enough to read.
      setWelcome(getStoredUser())
      setTimeout(() => navigate('/dashboard'), 1100)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  if (welcome) {
    const initials = `${welcome.first_name?.[0] || ''}${welcome.last_name?.[0] || ''}`.toUpperCase()
      || (welcome.username?.[0] || '').toUpperCase()
    const name = welcome.first_name || welcome.username

    return (
      <div className="py-2 text-center" role="status" aria-live="polite">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#16151b] text-[15px] font-bold text-white">
          {initials}
        </div>
        <p className="mt-4 text-[19px] font-bold tracking-[-0.01em] text-[#16151b]">
          Hola, {name}
        </p>
        <p className="mt-1.5 text-[14px] text-[#55545f]">
          Te estamos llevando a tu dashboard.
        </p>
        {/* A thin determinate bar reads as handover, not as "still loading". */}
        <div className="mx-auto mt-5 h-[3px] w-40 overflow-hidden rounded-full bg-[#efeef3]">
          <div className="h-full w-full origin-left animate-[loginHandoff_1.1s_ease-out_forwards] rounded-full bg-[#16151b]" />
        </div>
      </div>
    )
  }

  return (
    <>
      {error && (
        <div className="mb-4 flex items-start gap-2.5 rounded-[10px] border border-[#b4425a]/25 bg-[#b4425a]/[0.05] p-3.5">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#b4425a]" />
          <div className="min-w-0">
            <p className="text-[13.5px] font-semibold text-[#16151b]">{error}</p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-[#55545f]">
              Revisa que el usuario esté bien escrito. Si no lo recuerdas, puedes{' '}
              <Link to="/forgot-password" className="font-medium text-[#4b46d6] hover:underline">
                restablecer la contraseña
              </Link>.
            </p>
          </div>
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
