/**
 * ProfileSettings — "Configuración" tab of the user profile.
 *
 * Two self-contained forms: edit name and change password. Both hit the
 * authenticated /api/profile (PATCH) and /api/auth/change-password endpoints.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Loader2, User, Lock, ShieldCheck, Download, Trash2 } from 'lucide-react'
import { Button } from '@/shared/components/button'
import { Modal } from '@/shared/components/Modal'
import { PasswordInput } from '@/shared/components/PasswordInput'
import { updateProfile, changePassword } from '@/features/profile/services/profile'
import { clearStoredUser, deleteMyAccount, exportMyData } from '@/features/auth/services/auth'

const FIELD_CLASSES =
  "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4b46d6]/30 disabled:bg-gray-50"

function Field({ label, ...props }) {
  // Los campos de contraseña usan PasswordInput para que también tengan el
  // control de mostrar/ocultar. Le pasamos las clases de este formulario:
  // `Input` las compone con tailwind-merge, así que el aspecto no cambia.
  const isPassword = props.type === 'password'
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-600">{label}</span>
      {isPassword ? (
        <PasswordInput {...props} type={undefined} className={FIELD_CLASSES} />
      ) : (
        <input {...props} className={FIELD_CLASSES} />
      )}
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
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f4f3f8] text-[#16151b]">
          <User className="h-4 w-4" />
        </div>
        <h3 className="text-sm font-semibold text-gray-900">Datos personales</h3>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Nombre" value={firstName} onChange={(e) => setFirstName(e.target.value)} disabled={saving} />
        <Field label="Apellido" value={lastName} onChange={(e) => setLastName(e.target.value)} disabled={saving} />
      </div>
      <div className="mt-4 flex justify-end">
        <Button type="submit" disabled={!dirty || saving} className="gap-1.5">
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
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f4f3f8] text-[#16151b]">
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
          className="gap-1.5">
          {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Cambiando…</> : 'Cambiar contraseña'}
        </Button>
      </div>
    </form>
  )
}

/**
 * PrivacyDataSection — derechos de portabilidad y supresión (Ley 21.719).
 *
 * La rectificación ya la cubre el formulario de datos personales de arriba, así
 * que aquí solo viven los dos derechos que antes no se podían ejercer.
 */
function PrivacyDataSection({ profile }) {
  const [downloading, setDownloading] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const navigate = useNavigate()

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const data = await exportMyData()
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      )
      const link = document.createElement('a')
      link.href = url
      link.download = `edurobotics-mis-datos-${new Date().toISOString().slice(0, 10)}.json`
      link.click()
      URL.revokeObjectURL(url)
      toast.success('Descarga lista')
    } catch (err) {
      toast.error(err.message || 'No se pudieron descargar tus datos')
    } finally {
      setDownloading(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteMyAccount()
      // El token ya no sirve para nada: la cuenta que identifica no existe.
      clearStoredUser()
      toast.success('Tu cuenta y tus datos fueron eliminados')
      navigate('/')
    } catch (err) {
      toast.error(err.message || 'No se pudo eliminar la cuenta')
      setDeleting(false)
      setConfirmOpen(false)
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f4f3f8] text-[#16151b]">
          <ShieldCheck className="h-4 w-4" />
        </div>
        <h3 className="text-sm font-semibold text-gray-900">Privacidad y datos</h3>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="sm:pr-6">
            <p className="text-sm font-medium text-gray-900">Descargar mis datos</p>
            <p className="mt-0.5 text-xs text-gray-500">
              Un archivo JSON con tu perfil, cursos, progreso, intentos de quiz y comentarios.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleDownload}
            disabled={downloading}
            className="shrink-0 gap-1.5"
          >
            {downloading
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Preparando…</>
              : <><Download className="h-4 w-4" /> Descargar</>}
          </Button>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="sm:pr-6">
              <p className="text-sm font-medium text-gray-900">Eliminar mi cuenta</p>
              <p className="mt-0.5 text-xs text-gray-500">
                Se borran tu cuenta y todos tus datos. No se puede deshacer.
              </p>
            </div>
            <Button
              type="button"
              onClick={() => setConfirmOpen(true)}
              className="shrink-0 gap-1.5 bg-[#b4425a] text-white hover:bg-[#9c3950]"
            >
              <Trash2 className="h-4 w-4" /> Eliminar
            </Button>
          </div>
        </div>
      </div>

      <Modal isOpen={confirmOpen} onClose={() => !deleting && setConfirmOpen(false)} title="Eliminar tu cuenta" size="sm">
        <p className="text-sm text-gray-600">
          {profile?.username ? <>Vas a eliminar la cuenta <strong className="font-semibold text-gray-900">{profile.username}</strong>. </> : null}
          Se borrarán tu perfil, tus matrículas, tu progreso, tus intentos de quiz y tus comentarios.
          <strong className="font-semibold text-gray-900"> Esta acción no se puede deshacer.</strong>
        </p>
        <p className="mt-3 text-xs text-gray-500">
          Si solo quieres una copia de tu información, cierra esto y usa «Descargar mis datos».
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)} disabled={deleting}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="gap-1.5 bg-[#b4425a] text-white hover:bg-[#9c3950]"
          >
            {deleting
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Eliminando…</>
              : 'Sí, eliminar mi cuenta'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}

export function ProfileSettings({ profile, onUpdated }) {
  return (
    <div className="space-y-6">
      <EditNameForm profile={profile} onUpdated={onUpdated} />
      <ChangePasswordForm />
      <PrivacyDataSection profile={profile} />
    </div>
  )
}

export default ProfileSettings
