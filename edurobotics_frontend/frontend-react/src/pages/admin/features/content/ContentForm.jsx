/**
 * Content Form Component
 * 
 * Form for adding content to a unit (text, video, or resource links).
 * Displays existing content and allows deletion of content items.
 */

import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/ui/card'
import { Button } from '../../../../components/ui/button'
import { Badge } from '../../../../components/ui/badge'
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'

export function ContentForm({
  contentForm,
  setContentForm,
  onSubmit,
  selectedUnit,
  onContentDelete,
  expanded,
  onToggle
}) {
  return (
    <Card>
      <CardHeader
        className="cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Agregar Contenido a la Unidad
          </CardTitle>
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="space-y-6">
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Contenido
              </label>
              <select
                value={contentForm.content_type}
                onChange={(e) => setContentForm({ ...contentForm, content_type: e.target.value })}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="text">Texto</option>
                <option value="video">Video (URL de YouTube)</option>
                <option value="resource">Recurso (link)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contenido
              </label>
              <textarea
                placeholder={
                  contentForm.content_type === 'video'
                    ? 'https://www.youtube.com/watch?v=...'
                    : contentForm.content_type === 'resource'
                      ? 'https://...'
                      : 'Escribe el contenido de texto aquí'
                }
                value={contentForm.content_value}
                onChange={(e) => setContentForm({ ...contentForm, content_value: e.target.value })}
                className="flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>

            <Button type="submit" className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Agregar Contenido
            </Button>
          </form>

          {selectedUnit?.contents?.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Contenidos de la unidad ({selectedUnit.contents.length})
              </h4>
              <div className="space-y-2">
                {selectedUnit.contents.map((content) => (
                  <div
                    key={content.id}
                    className="flex items-start justify-between p-3 border border-gray-200 rounded-lg bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary">
                          {content.content_type}
                        </Badge>
                        <span className="text-xs text-gray-500">Orden: {content.order_index}</span>
                      </div>
                      <p className="text-sm text-gray-700 break-words">{content.content_value}</p>
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => onContentDelete(content.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
