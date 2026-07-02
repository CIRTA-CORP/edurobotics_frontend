/**
 * Modal — centered dialog for forms and content overlays.
 *
 * Built on the accessible Dialog (Radix): focus trap, Esc, scroll lock and ARIA
 * come for free. Public API unchanged (isOpen / onClose / title / children /
 * size) so existing callers keep working.
 */
import { Dialog, DialogContent, DialogTitle } from '@/shared/components/dialog'
import { cn } from '@/shared/lib/utils'

const SIZE_CLASSES = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-3xl',
    xl: 'max-w-5xl',
    full: 'max-w-full mx-4',
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }) {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
            <DialogContent className={cn('flex max-h-[90vh] flex-col rounded-xl', SIZE_CLASSES[size])}>
                <div className="border-b border-gray-100 px-6 py-4">
                    <DialogTitle className="text-xl">{title}</DialogTitle>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                    {children}
                </div>
            </DialogContent>
        </Dialog>
    )
}
