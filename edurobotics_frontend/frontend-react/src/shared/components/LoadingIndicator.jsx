import { RefreshCw } from 'lucide-react'

export function LoadingIndicator({ isLoading, text = 'Actualizando...' }) {
  if (!isLoading) return null

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm">
      <RefreshCw className="w-4 h-4 animate-spin" />
      {text}
    </div>
  )
}
