// Reset-password route: takes the token from the URL and sets a new password.
// Third step of the recovery flow, on the same split screen as the other two.
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { resetPassword } from '@/features/auth/services/auth'
import { AuthLayout, AuthHeading } from '@/features/auth/components/AuthLayout'
import { Button } from '@/shared/components/button'
import { PasswordInput } from '@/shared/components/PasswordInput'
import { AlertCircle, ArrowLeft, Check } from 'lucide-react'

const CLAIMS = [
  'Elige una contraseña que recuerdes',
  'Se aplica al instante en todos tus dispositivos',
  'Tu progreso te espera intacto',
]

function ResetPasswordPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const token = params.get('token') || ''

  const [pw, setPw] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (pw !== confirm) { setError('Las contraseñas no coinciden'); return }
    if (pw.length < 8) { setError('La contraseña debe tener al menos 8 caracteres'); return }
    setLoading(true)
    try {
      await resetPassword({ token, new_password: pw, new_password_confirm: confirm })
      setDone(true)
      setTimeout(() => navigate('/login', { replace: true }), 1600)
    } catch (err) {
      setError(err.message || 'No se pudo restablecer la contraseña')
      setLoading(false)
    }
  }

  if (done) {
    return (
      <AuthLayout title="Vuelve a donde lo dejaste." claims={CLAIMS}>
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50">
          <Check className="h-5 w-5 text-emerald-600" strokeWidth={2.4} />
        </div>
        <AuthHeading title="Contraseña restablecida">
          Te llevamos a iniciar sesión con tu contraseña nueva.
        </AuthHeading>
        <div className="h-[3px] w-40 overflow-hidden rounded-full bg-[#efeef3]">
          <div className="h-full w-full origin-left animate-[loginHandoff_1.6s_ease-out_forwards] rounded-full bg-[#16151b]" />
        </div>
      </AuthLayout>
    )
  }

  // Sin token no hay nada que restablecer: se dice, en vez de fallar al enviar.
  if (!token) {
    return (
      <AuthLayout title="Vuelve a donde lo dejaste." claims={CLAIMS}>
        <AuthHeading title="El enlace no es válido">
          Le falta el código de recuperación o ya fue usado. Pide uno nuevo y vuelve a intentarlo.
        </AuthHeading>
        <Link
          to="/forgot-password"
          className="inline-flex h-11 items-center rounded-xl bg-[#16151b] px-5 text-[13.5px] font-semibold text-white transition-colors hover:bg-[#2b2b26]"
        >
          Pedir un enlace nuevo
        </Link>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Vuelve a donde lo dejaste." claims={CLAIMS}>
      <AuthHeading title="Nueva contraseña">
        Crea una contraseña nueva para tu cuenta.
      </AuthHeading>

      {error && (
        <div className="mb-4 flex items-start gap-2.5 rounded-[10px] border border-[#b4425a]/25 bg-[#b4425a]/[0.05] p-3.5">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#b4425a]" />
          <p className="text-[13.5px] text-[#16151b]">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="pw" className="text-[13.5px] font-medium text-[#16151b]">
            Nueva contraseña
          </label>
          <PasswordInput
            id="pw"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="new-password"
          />
          <p className="text-[12px] text-[#8b8a95]">
            Mínimo 8 caracteres, con al menos una letra y un número.
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="confirm" className="text-[13.5px] font-medium text-[#16151b]">
            Repetir contraseña
          </label>
          <PasswordInput
            id="confirm"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="new-password"
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Restableciendo…' : 'Restablecer contraseña'}
        </Button>
      </form>

      <Link
        to="/login"
        className="mt-6 inline-flex items-center gap-1.5 text-[13.5px] font-medium text-[#55545f] transition-colors hover:text-[#16151b]"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a iniciar sesión
      </Link>
    </AuthLayout>
  )
}

export default ResetPasswordPage
