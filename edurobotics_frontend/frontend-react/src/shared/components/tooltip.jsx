/**
 * Tooltip — accessible tooltip (shadcn/ui style) built on Radix.
 *
 * Exports the Radix parts, plus a `Tooltip` convenience wrapper that bundles
 * Provider + Root + Trigger + Content so a single icon button can get an
 * accessible tooltip without extra ceremony:
 *
 *   <Tooltip content="Cerrar sesión"><button>…</button></Tooltip>
 */
import * as React from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { cn } from '@/shared/lib/utils'

const TooltipProvider = TooltipPrimitive.Provider
const TooltipRoot = TooltipPrimitive.Root
const TooltipTrigger = TooltipPrimitive.Trigger

const TooltipContent = React.forwardRef(({ className, sideOffset = 6, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        'z-[9999] overflow-hidden rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-md',
        'animate-fade-in',
        className,
      )}
      {...props}
    />
  </TooltipPrimitive.Portal>
))
TooltipContent.displayName = 'TooltipContent'

/** Convenience: wrap any element to give it a tooltip. */
function Tooltip({ content, children, side = 'bottom', delayDuration = 200, ...props }) {
  if (!content) return children
  return (
    <TooltipProvider delayDuration={delayDuration}>
      <TooltipRoot>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side={side} {...props}>{content}</TooltipContent>
      </TooltipRoot>
    </TooltipProvider>
  )
}

export { Tooltip, TooltipProvider, TooltipRoot, TooltipTrigger, TooltipContent }
