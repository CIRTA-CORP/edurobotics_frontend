import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge class names (shadcn/ui convention): clsx handles conditionals/arrays,
 * tailwind-merge resolves conflicting Tailwind utilities so a passed className
 * (e.g. `max-w-xl`) correctly overrides a component default (e.g. `max-w-sm`).
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
