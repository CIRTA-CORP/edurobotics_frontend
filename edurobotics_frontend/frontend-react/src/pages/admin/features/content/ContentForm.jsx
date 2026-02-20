/**
 * Content Form Component
 *
 * Form for adding content to a unit (text, video, or resource links).
 * Displays existing content with type badges and allows deletion.
 * Redesigned with modern styling and visual hierarchy.
 */

import { Card, CardContent } from '../../../../components/ui/card'
import { Button } from '../../../../components/ui/button'
import { Badge } from '../../../../components/ui/badge'
import {
  Plus, Trash2, ChevronDown, ChevronUp,
  FileText, Video, Link2, Package
} from 'lucide-react'

const CONTENT_TYPES = {
  text: { label: 'Texto', icon: FileText, color: 'bg-blue-100 text-blue-700' },
  video: { label: 'Video', icon: Video, color: 'bg-purple-100 text-purple-700' },
  resource: { label: 'Recurso', icon: Link2, color: 'bg-amber-100 text-amber-700' },
}

export function ContentForm({
  contentForm,
  setContentForm,
  onSubmit,
  selectedUnit,
  onContentDelete,
  expanded,
  onToggle
}) {
  const contentCount = selectedUnit?.contents?.length || 0

  return (
    <Card className="border-gray-200 overflow-hidden">
      {/* Header */}
      <button
        type="button"
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50/80 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
            <Package className="w-4 h-4" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-semibold text-gray-900">Contenido de la Unidad</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {contentCount} contenido{contentCount !== 1 ? 's' : ''} agregado{contentCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        {expanded
          ? <ChevronUp className="w-4 h-4 text-gray-400" />
          : <ChevronDown className="w-4 h-4 text-gray-400" />
        }
      </button>

      {expanded && (
        <CardContent className="pt-0 px-5 pb-5 space-y-6">
          {/* Add content form */}
          <form onSubmit={onSubmit} className="space-y-4">
            {/* Content type selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Tipo de contenido
              </label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(CONTENT_TYPES).map(([value, config]) => {
                  const TypeIcon = config.icon
                  const isActive = contentForm.content_type === value
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setContentForm({ ...contentForm, content_type: value })}
                      className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${isActive
                          ? 'border-blue-300 bg-blue-50 text-blue-700 shadow-sm'
                          : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                        }`}
                    >
                      <TypeIcon className="w-3.5 h-3.5" />
                      {config.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Content value */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Contenido *
              </label>
              <textarea
                placeholder={
                  contentForm.content_type === 'video'
                    ? 'https://www.youtube.com/watch?v=...'
                    : contentForm.content_type === 'resource'
                      ? 'https://...'
                      : 'Escribe el contenido de texto aquí...'
                }
                value={contentForm.content_value}
                onChange={(e) => setContentForm({ ...contentForm, content_value: e.target.value })}
                className="flex min-h-[100px] w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors resize-none"
                required
              />
            </div>

            {/* Order */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Orden
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={contentForm.order_index}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '')
                  setContentForm({ ...contentForm, order_index: val ? parseInt(val) : 1 })
                }}
                className="flex h-10 w-24 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              />
            </div>

            <Button type="submit" className="w-full gap-1.5 bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4" />
              Agregar Contenido
            </Button>
          </form>

          {/* Existing content list */}
          {contentCount > 0 && (
            <div className="border-t border-gray-100 pt-5">
              <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
                Contenidos existentes ({contentCount})
              </h4>
              <div className="space-y-2">
                {selectedUnit.contents.map((content) => {
                  const typeConfig = CONTENT_TYPES[content.content_type] || CONTENT_TYPES.text
                  const TypeIcon = typeConfig.icon

                  return (
                    <div
                      key={content.id}
                      className="flex items-start justify-between p-3 rounded-xl border border-gray-100 bg-gray-50/80 group hover:border-gray-200 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${typeConfig.color}`}>
                            <TypeIcon className="w-3 h-3" />
                            {typeConfig.label}
                          </span>
                          <span className="text-[10px] text-gray-400">Orden: {content.order_index}</span>
                        </div>
                        <p className="text-sm text-gray-700 break-words line-clamp-3">{content.content_value}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onContentDelete(content.id)}
                        className="text-gray-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
