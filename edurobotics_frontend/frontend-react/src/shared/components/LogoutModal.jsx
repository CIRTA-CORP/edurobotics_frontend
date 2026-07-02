import { LogOut } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/shared/components/dialog'

/**
 * Logout confirmation modal.
 *
 * Now built on the accessible Dialog (Radix): closing via Esc, backdrop click
 * or the X all route through `onOpenChange` → `onCancel`. Public API unchanged
 * (isOpen / onConfirm / onCancel) so existing callers keep working.
 */
export function LogoutModal({ isOpen, onConfirm, onCancel }) {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onCancel() }}>
            <DialogContent>
                <div className="p-6 pt-8 text-center">
                    {/* Icon */}
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
                        <LogOut className="h-6 w-6 text-red-500" />
                    </div>

                    <DialogTitle className="mb-1 text-center">¿Cerrar sesión?</DialogTitle>
                    <DialogDescription className="mb-6 text-center">
                        Tendrás que volver a iniciar sesión para acceder a la plataforma.
                    </DialogDescription>

                    {/* Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={onCancel}
                            className="flex-1 rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={onConfirm}
                            className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-600"
                        >
                            Cerrar sesión
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
