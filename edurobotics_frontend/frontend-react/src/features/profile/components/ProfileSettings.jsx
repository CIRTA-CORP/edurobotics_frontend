/**
 * ProfileSettings — "Configuración" tab of the user profile.
 *
 * Two self-contained forms: edit name and change password. Both hit the
 * authenticated /api/profile (PATCH) and /api/auth/change-password endpoints.
 */
import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, User, Lock } from 'lucide-react'
import { Button } from '@/shared/components/button'
import { updateProfile, changePassword } from '@/features/profile/services/profile'

function Field({ label, ...props }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-600">{label}</span>
      <input
        {...props}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:bg-gray-50"
      />
    </label>
  )
}

function EditNameForm({ profile, onUpdated }) {
  const [firstName, setFirstName] = useState(profile?.first_name || '')
  const [lastName, setLastName] = useState(profile?.last_name || '')
  const [saving, setSaving] = useState(false)

  const dirty =
    firstName.trim() !== (profile?.first_name || '') ||
    lastName.trim() !== (profile?.last_name || '')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!firstName.trim() || !lastName.trim()) {
      toast.error('El nombre y el apellido no pueden estar vacíos')
      return
    }
    setSaving(true)
    try {
      await updateProfile({ first_name: firstName.trim(), last_name: lastName.trim() })
      toast.success('Perfil actualizado')
      onUpdated?.()
    } catch (err) {
      toast.error(err.message || 'No se pudo actualizar el perfil')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-200 bg-white p-6">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          <User className="h-4 w-4" />
        </div>
        <h3 className="text-sm font-semibold text-gray-900">Datos personales</h3>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Nombre" value={firstName} onChange={(e) => setFirstName(e.target.value)} disabled={saving} />
        <Field label="Apellido" value={lastName} onChange={(e) => setLastName(e.target.value)} disabled={saving} />
      </div>
      <div className="mt-4 flex justify-end">
        <Button type="submit" disabled={!dirty || saving} className="gap-1.5 bg-blue-600 hover:bg-blue-700">
          {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Guardando…</> : 'Guardar cambios'}
        </Button>
      </div>
    </form>
  )
}

function ChangePasswordForm() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (next !== confirm) {
      toast.error('Las contraseñas nuevas no coinciden')
      return
    }
    if (next.length < 8) {
      toast.error('La nueva contraseña debe tener al menos 8 caracteres')
      return
    }
    setSaving(true)
    try {
      await changePassword({
        current_password: current,
        new_password: next,
        new_password_confirm: confirm,
      })
      toast.success('Contraseña actualizada')
      setCurrent(''); setNext(''); setConfirm('')
    } catch (err) {
      toast.error(err.message || 'No se pudo cambiar la contraseña')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-200 bg-white p-6">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          <Lock className="h-4 w-4" />
        </div>
        <h3 className="text-sm font-semibold text-gray-900">Cambiar contraseña</h3>
      </div>
      <div className="space-y-4">
        <Field label="Contraseña actual" type="password" autoComplete="current-password"
          value={current} onChange={(e) => setCurrent(e.target.value)} disabled={saving} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nueva contraseña" type="password" autoComplete="new-password"
            value={next} onChange={(e) => setNext(e.target.value)} disabled={saving} />
          <Field label="Repetir nueva contraseña" type="password" autoComplete="new-password"
            value={confirm} onChange={(e) => setConfirm(e.target.value)} disabled={saving} />
        </div>
        <p className="text-[11px] text-gray-400">Mínimo 8 caracteres, con al menos una letra y un número.</p>
      </div>
      <div className="mt-4 flex justify-end">
        <Button type="submit" disabled={saving || !current || !next || !confirm}
          className="gap-1.5 bg-blue-600 hover:bg-blue-700">
          {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Cambiando…</> : 'Cambiar contraseña'}
        </Button>
      </div>
    </form>
  )
}

export function ProfileSettings({ profile, onUpdated }) {
  return (
    <div className="space-y-6">
      <EditNameForm profile={profile} onUpdated={onUpdated} />
      <ChangePasswordForm />
    </div>
  )
}

export default ProfileSettings
