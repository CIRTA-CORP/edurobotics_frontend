// Registration form: validates the new-account fields, calls registerUser and
// redirects on success.
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
  const [error, setError] = useState(null)
  const [created, setCreated] = useState(null)   // username, once the account exists
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError(null)

    if (form.password !== form.password_confirm) {
      setError('Las contraseñas no coinciden')
      return
    }

    setLoading(true)

    try {
      await registerUser(form)
      // Hand over naming the username they just chose — it is what they will
      // type next, and a green strip would not have told them.
      setCreated(form.username)
      // En el modal, volver a la vista de login; en la página, navegar a /login.
      setTimeout(() => {
        if (onSwitchToLogin) onSwitchToLogin()
        else navigate('/login')
      }, 1600)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  if (created) {
    return (
      <div className="py-2 text-center" role="status" aria-live="polite">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" strokeWidth={2.2} />
        </div>
        <p className="mt-4 text-[19px] font-bold tracking-[-0.01em] text-[#16151b]">Cuenta creada</p>
        <p className="mt-1.5 text-[14px] leading-relaxed text-[#55545f]">
          Te llevamos a iniciar sesión con tu usuario{' '}
          <strong className="font-mono font-semibold text-[#16151b]">{created}</strong>.
        </p>
        <div className="mx-auto mt-5 h-[3px] w-40 overflow-hidden rounded-full bg-[#efeef3]">
          <div className="h-full w-full origin-left animate-[loginHandoff_1.6s_ease-out_forwards] rounded-full bg-[#16151b]" />
        </div>
      </div>
    )
  }

  return (
    <>
      {error && (
        <div className="mb-4 flex items-start gap-2.5 rounded-[10px] border border-[#b4425a]/25 bg-[#b4425a]/[0.05] p-3.5">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#b4425a]" />
          <p className="text-[13.5px] text-[#16151b]">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
