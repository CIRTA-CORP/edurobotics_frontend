import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { resetPassword } from '@/features/auth/services/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/card'
import { Button } from '@/shared/components/button'
import { Input } from '@/shared/components/input'
import { CheckCircle2, AlertCircle } from 'lucide-react'

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
      setTimeout(() => navigate('/login', { replace: true }), 1800)
    } catch (err) {
      setError(err.message || 'No se pudo restablecer la contraseña')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/cirtanitido.svg" alt="CIRTA Logo" className="h-12 mx-auto mb-4" />
          <h1 className="text-3xl font-bold tracking-tight">EduRobotics</h1>
          <p className="text-muted-foreground mt-2">Plataforma educativa de robótica</p>
        </div>

        <Card className="border-gray-200 shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-semibold">Nueva contraseña</CardTitle>
            <CardDescription>Crea una nueva contraseña para tu cuenta.</CardDescription>
          </CardHeader>
          <CardContent>
            {!token ? (
              <div className="space-y-4">
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span>Enlace inválido. Solicita un nuevo enlace de recuperación.</span>
                </div>
                <Link to="/forgot-password" className="text-sm font-medium text-primary hover:underline">
                  Solicitar nuevo enlace
                </Link>
              </div>
            ) : done ? (
              <div className="space-y-4">
                <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-900">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span>Contraseña restablecida. Redirigiendo a iniciar sesión…</span>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">
                    <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
                <div className="space-y-2">
                  <label htmlFor="pw" className="text-sm font-medium leading-none">Nueva contraseña</label>
                  <Input id="pw" type="password" required placeholder="••••••••"
                    value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="confirm" className="text-sm font-medium leading-none">Repetir contraseña</label>
                  <Input id="confirm" type="password" required placeholder="••••••••"
                    value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
                </div>
                <p className="text-[11px] text-muted-foreground">Mínimo 8 caracteres, con al menos una letra y un número.</p>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Guardando…' : 'Restablecer contraseña'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ResetPasswordPage
