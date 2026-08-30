// Forgot-password route: asks for an email and triggers the reset link. Always
// shows a neutral confirmation (never reveals whether the email exists), which
// is why the sent state says "si está registrado" rather than "te enviamos".
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { forgotPassword } from '@/features/auth/services/auth'
import { AuthLayout, AuthHeading } from '@/features/auth/components/AuthLayout'
import { Button } from '@/shared/components/button'
import { Input } from '@/shared/components/input'
import { AlertCircle, ArrowLeft, Mail } from 'lucide-react'

const CLAIMS = [
  'El enlace llega a tu correo en segundos',
  'Vence en 1 hora, por seguridad',
  'Tu progreso te espera intacto',
]

function BackToLogin() {
  return (
    <Link
      to="/login"
      className="mt-6 inline-flex items-center gap-1.5 text-[13.5px] font-medium text-[#55545f] transition-colors hover:text-[#16151b]"
    >
      <ArrowLeft className="h-4 w-4" />
      Volver a iniciar sesión
    </Link>
  )
}

function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await forgotPassword(email)
      setSent(true)
    } catch (err) {
      setError(err.message || 'No se pudo procesar la solicitud')
    } finally {
      setLoading(false)
    }
  }

  // ── Paso 2: enlace enviado ──
  if (sent) {
    return (
      <AuthLayout title="Vuelve a donde lo dejaste." claims={CLAIMS}>
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#f4f3f8]">
          <Mail className="h-5 w-5 text-[#16151b]" strokeWidth={1.8} />
        </div>
        <AuthHeading title="Revisa tu correo">
          Si <strong className="font-semibold text-[#16151b]">{email}</strong> está registrado, ahí
          llega el enlace. Mira también el spam.
        </AuthHeading>
        <p className="rounded-[10px] border border-[#e9e9ee] bg-[#fafafa] px-3.5 py-3 text-[12.5px] leading-relaxed text-[#55545f]">
          El enlace vence en 1 hora. Si no llega, vuelve a pedirlo.
        </p>
        <BackToLogin />
      </AuthLayout>
    )
  }

  // ── Paso 1: pedir el enlace ──
  return (
    <AuthLayout title="Vuelve a donde lo dejaste." claims={CLAIMS}>
      <AuthHeading title="Recuperar contraseña">
        Escribe tu correo y te enviamos un enlace para crear una nueva.
      </AuthHeading>

      {error && (
        <div className="mb-4 flex items-start gap-2.5 rounded-[10px] border border-[#b4425a]/25 bg-[#b4425a]/[0.05] p-3.5">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#b4425a]" />
          <p className="text-[13.5px] text-[#16151b]">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-[13.5px] font-medium text-[#16151b]">
            Correo electrónico
          </label>
          <Input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@correo.cl"
            required
            autoComplete="email"
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Enviando…' : 'Enviar enlace'}
        </Button>
      </form>

      <BackToLogin />
    </AuthLayout>
  )
}

export default ForgotPasswordPage
