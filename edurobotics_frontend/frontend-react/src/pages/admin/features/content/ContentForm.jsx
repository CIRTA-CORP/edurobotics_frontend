/**
 * Content Form Component
 *
 * TipTap-based rich text editor for creating/editing unit content.
 * Replaces the old multi-block system with a single unified editor
 * where admins can write text, insert images, embed videos, and
 * attach files — all in one place, like Notion or Medium.
 *
 * Legacy content blocks (from the old system) are shown below with
 * an option to migrate them into the new rich editor.
 */

import { useState, useMemo } from 'react'
import { Card, CardContent } from '../../../../components/ui/card'
import { Button } from '../../../../components/ui/button'
import {
  ChevronDown, ChevronUp, Package, Trash2, Wand2, AlertTriangle,
  FileText, Video, Link2, ImageIcon, FileDown
} from 'lucide-react'
import { RichTextEditor } from './RichTextEditor'
import { API_BASE } from '../../../../config'

const LEGACY_TYPE_CONFIG = {
  text: { label: 'Texto', icon: FileText, color: 'bg-blue-100 text-blue-700' },
  video: { label: 'Video', icon: Video, color: 'bg-purple-100 text-purple-700' },
  resource: { label: 'Recurso', icon: Link2, color: 'bg-amber-100 text-amber-700' },
  image: { label: 'Imagen', icon: ImageIcon, color: 'bg-emerald-100 text-emerald-700' },
  file: { label: 'Archivo', icon: FileDown, color: 'bg-rose-100 text-rose-700' },
}

export function ContentForm({
  selectedUnit,
  onRichContentSave,
  onContentDelete,
  onMigrateLegacy,
  expanded,
  onToggle,
  saving,
}) {
  const [showMigrateConfirm, setShowMigrateConfirm] = useState(false)

  // Separate rich_text content from legacy blocks
  const richContent = useMemo(() => {
    return selectedUnit?.contents?.find(c => c.content_type === 'rich_text')
  }, [selectedUnit?.contents])

  const legacyContents = useMemo(() => {
    return [...(selectedUnit?.contents || [])]
      .filter(c => c.content_type !== 'rich_text')
      .sort((a, b) => a.order_index - b.order_index)
  }, [selectedUnit?.contents])

  const hasLegacyContent = legacyContents.length > 0

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
            <h3 className="text-sm font-semibold text-gray-900">Editor de Contenido</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Escribe todo el contenido de la unidad aquí: texto, imágenes, videos y archivos
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
          {/* TipTap Rich Text Editor */}
          <RichTextEditor
            content={richContent?.content_value || ''}
            onSave={onRichContentSave}
            saving={saving}
          />

          {/* Legacy content migration notice */}
          {hasLegacyContent && (
            <div className="border-t border-gray-100 pt-5 space-y-4">
              <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-amber-800">
                    Contenido heredado ({legacyContents.length} {legacyContents.length === 1 ? 'bloque' : 'bloques'})
                  </h4>
                  <p className="text-xs text-amber-700 mt-1">
                    Esta unidad tiene contenido creado con el sistema anterior. Puedes migrarlo al nuevo editor
                    para tener todo en un solo documento, o eliminarlo manualmente.
                  </p>
                  <div className="flex gap-2 mt-3">
                    {!showMigrateConfirm ? (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => setShowMigrateConfirm(true)}
                        className="gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
                      >
                        <Wand2 className="w-3.5 h-3.5" />
                        Migrar al editor
                      </Button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-amber-700">¿Estás seguro? Se combinará todo en el editor.</span>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => { onMigrateLegacy?.(); setShowMigrateConfirm(false) }}
                          className="bg-amber-600 hover:bg-amber-700 text-white h-7 px-3 text-xs"
                        >
                          Sí, migrar
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowMigrateConfirm(false)}
                          className="h-7 px-3 text-xs"
                        >
                          Cancelar
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Legacy content list */}
              <div className="space-y-2">
                {legacyContents.map((content, index) => {
                  const typeConfig = LEGACY_TYPE_CONFIG[content.content_type] || LEGACY_TYPE_CONFIG.text
                  const TypeIcon = typeConfig.icon

                  return (
                    <div
                      key={content.id}
                      className="flex items-start gap-2 p-3 rounded-xl border border-gray-100 bg-gray-50/80 group hover:border-gray-200 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${typeConfig.color}`}>
                            <TypeIcon className="w-3 h-3" />
                            {typeConfig.label}
                          </span>
                          <span className="text-[10px] text-gray-400">Pos. {index + 1}</span>
                          <span className="text-[10px] text-amber-500 font-medium">Legacy</span>
                        </div>
                        {content.content_type === 'image' ? (
                          <img
                            src={content.content_value?.startsWith('http') ? content.content_value : `${API_BASE}${content.content_value}`}
                            alt="Content"
                            className="w-32 h-20 object-cover rounded-lg border border-gray-200"
                          />
                        ) : (
                          <p className="text-sm text-gray-700 break-words line-clamp-3">
                            {content.content_type === 'text'
                              ? (() => {
                                try {
                                  return new DOMParser().parseFromString(content.content_value, 'text/html').body.textContent || ''
                                } catch { return content.content_value?.replace(/<[^>]+>/g, '') || '' }
                              })()
                              : content.content_value}
                          </p>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onContentDelete(content.id)}
                        className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-1.5 h-auto opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Eliminar"
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
