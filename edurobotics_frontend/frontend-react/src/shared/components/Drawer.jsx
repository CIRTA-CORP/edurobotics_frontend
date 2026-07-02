/**
 * Drawer — slide-over panel from the right, for create/edit forms.
 *
 * Thin wrapper over the accessible Sheet (Radix): focus trap, Esc, scroll lock
 * and ARIA come for free. Public API unchanged (open / onClose / title /
 * children / width) so existing callers keep working. Content mounts only while
 * open (Radix Portal), preserving the previous form-reset behaviour.
 */
import { Sheet, SheetContent, SheetTitle } from '@/shared/components/sheet'
import { cn } from '@/shared/lib/utils'

export function Drawer({ open, onClose, title, children, width = 'max-w-xl' }) {
  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose?.() }}>
      <SheetContent className={cn(width)}>
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <SheetTitle>{title}</SheetTitle>
        </div>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </SheetContent>
    </Sheet>
  )
}

export default Drawer
