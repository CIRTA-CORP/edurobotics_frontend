/**
 * Sheet — slide-over panel (shadcn/ui style) built on Radix Dialog.
 *
 * Same accessibility guarantees as Dialog (focus trap, Esc, scroll lock, ARIA).
 * Currently supports the right side, which is what the app's forms use.
 */
import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

const Sheet = DialogPrimitive.Root
const SheetTrigger = DialogPrimitive.Trigger
const SheetClose = DialogPrimitive.Close

const SheetContent = React.forwardRef(({ className, children, showClose = true, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 animate-fade-in" />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed right-0 top-0 z-50 flex h-full w-full max-w-xl flex-col bg-white shadow-2xl animate-slide-in-right focus:outline-none',
        className,
      )}
      {...props}
    >
      {children}
      {showClose && (
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700">
          <X className="h-5 w-5" />
          <span className="sr-only">Cerrar</span>
        </DialogPrimitive.Close>
      )}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
))
SheetContent.displayName = 'SheetContent'

const SheetTitle = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Title ref={ref} className={cn('text-lg font-bold text-gray-900', className)} {...props} />
))
SheetTitle.displayName = 'SheetTitle'

const SheetDescription = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Description ref={ref} className={cn('text-sm text-gray-500', className)} {...props} />
))
SheetDescription.displayName = 'SheetDescription'

export { Sheet, SheetTrigger, SheetClose, SheetContent, SheetTitle, SheetDescription }
