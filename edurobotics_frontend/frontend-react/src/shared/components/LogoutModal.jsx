import { getStoredUser } from '@/features/auth/services/auth'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/shared/components/dialog'

const ROLE_LABEL = { admin: 'Administrador', teacher: 'Profesor', student: 'Estudiante' }

/**
 * Logout confirmation modal.
 *
 * Built on the accessible Dialog (Radix): closing via Esc, backdrop click or the
 * X all route through `onOpenChange` → `onCancel`. Public API unchanged
 * (isOpen / onConfirm / onCancel) so existing callers keep working.
 *
 * Signing out is not destructive — nothing is lost — so it uses the same
 * near-black as every other action. Red stays reserved for deleting, which is
 * what makes red mean something when it does appear.
 */
export function LogoutModal({ isOpen, onConfirm, onCancel }) {
    const user = getStoredUser()
    const initials = user
        ? (`${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase()
            || (user.username?.[0] || '').toUpperCase())
        : ''
    const fullName = user
        ? [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username
        : ''

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onCancel() }}>
            <DialogContent>
                <div className="p-6 pt-7">
                    <DialogTitle className="text-[19px]">¿Cerrar sesión?</DialogTitle>
                    <DialogDescription className="mt-2 text-[13.5px] leading-relaxed">
                        Volverás a la página principal. Tu progreso queda guardado — no pierdes nada.
                    </DialogDescription>

                    {/* Whose session is ending: the confirmation is about a person */}
                    {user && (
                        <div className="mt-5 flex items-center gap-3 rounded-xl border border-[#e9e9ee] p-3">
                            <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-[#16151b] text-[11px] font-bold text-white">
                                {initials}
                            </span>
                            <span className="min-w-0">
                                <span className="block truncate text-[13.5px] font-semibold text-[#16151b]">
                                    {fullName}
                                </span>
                                <span className="block truncate font-mono text-[11px] text-[#a9a8b4]">
                                    @{user.username}
                                    {ROLE_LABEL[user.role] && ` · ${ROLE_LABEL[user.role]}`}
                                </span>
                            </span>
                        </div>
                    )}

                    <div className="mt-6 flex gap-3">
                        <button
                            onClick={onCancel}
                            className="h-11 flex-1 rounded-xl border border-[#e9e9ee] text-[13.5px] font-semibold text-[#55545f] transition-colors hover:border-[#c4c3cd] hover:text-[#16151b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4b46d6]"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={onConfirm}
                            className="h-11 flex-1 rounded-xl bg-[#16151b] text-[13.5px] font-semibold text-white transition-colors hover:bg-[#2b2b26] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#16151b]"
                        >
                            Cerrar sesión
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
