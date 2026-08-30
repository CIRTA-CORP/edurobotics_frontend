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

import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent } from '@/shared/components/card'
import {
  ChevronDown, ChevronUp, Package, Trash2, Wand2, AlertTriangle,
  FileText, Video, Link2, ImageIcon, FileDown, Cpu
} from 'lucide-react'
import { RichTextEditor } from './RichTextEditor'
import { API_BASE } from '@/config'

const LEGACY_TYPE_CONFIG = {
  text: { label: 'Texto', icon: FileText, color: 'bg-[#eef2ff] text-[#4338ca]' },
  video: { label: 'Video', icon: Video, color: 'bg-[#f5edfb] text-[#7e22ce]' },
  resource: { label: 'Recurso', icon: Link2, color: 'bg-[#fdf0d9] text-[#b45309]' },
  image: { label: 'Imagen', icon: ImageIcon, color: 'bg-[#e7f8f1] text-[#047857]' },
  file: { label: 'Archivo', icon: FileDown, color: 'bg-[#fdeef1] text-[#b4425a]' },
}

/** "Último guardado hace N" en texto (mono, como el canvas). */
function fmtSavedAgo(ts) {
  if (!ts) return 'Sin guardar aún'
  const min = Math.max(0, Math.round((Date.now() - new Date(ts).getTime()) / 60000))
  if (min < 1) return 'Guardado ahora'
  if (min === 1) return 'Último guardado hace 1 min'
  if (min < 60) return `Último guardado hace ${min} min`
  return `Último guardado hace ${Math.round(min / 60)} h`
}

export function ContentForm({
  selectedUnit,
  onRichContentSave,
  onContentDelete,
  onMigrateLegacy,
  onSimulatorToggle,
  onSimulatorDescriptionSave,
  expanded,
  onToggle,
  saving,
  editorRef,
  hideEditorSave = false,
  lastSavedAt,
}) {
  const [showMigrateConfirm, setShowMigrateConfirm] = useState(false)

  // Separate rich_text, simulator and legacy blocks
  const richContent = useMemo(() => {
    return selectedUnit?.contents?.find(c => c.content_type === 'rich_text')
  }, [selectedUnit?.contents])

  const simulatorContent = useMemo(() => {
    return selectedUnit?.contents?.find(c => c.content_type === 'simulator')
  }, [selectedUnit?.contents])

  const legacyContents = useMemo(() => {
    return [...(selectedUnit?.contents || [])]
      .filter(c => c.content_type !== 'rich_text' && c.content_type !== 'simulator')
      .sort((a, b) => a.order_index - b.order_index)
  }, [selectedUnit?.contents])

  const hasLegacyContent = legacyContents.length > 0

  const [simulatorDesc, setSimulatorDesc] = useState(simulatorContent?.content_value || '')
  useEffect(() => {
    setSimulatorDesc(simulatorContent?.content_value || '')
  }, [simulatorContent?.id, simulatorContent?.content_value])

  const descChanged = (simulatorContent?.content_value || '') !== simulatorDesc

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
            ref={editorRef}
            content={richContent?.content_value || ''}
            onSave={onRichContentSave}
            saving={saving}
            hideSave={hideEditorSave}
          />

          {/* Pie del editor (canvas 2b.3): último guardado + aviso de publicación */}
          {hideEditorSave && (
            <div className="flex items-center justify-between gap-4 rounded-b-xl border-t border-[#f2f1f6] bg-[#fcfcfd] px-4 py-2.5">
              <span className="font-mono text-[10.5px] text-[#a9a8b4]">{fmtSavedAgo(lastSavedAt)}</span>
              <span className="text-xs text-[#a9a8b4]">Los cambios no se publican hasta que guardas.</span>
            </div>
          )}

          {/* Simulator block — banda de marca (canvas 2b.4). La trama de puntos va en
              una capa aparte con su propia máscara; el contenido queda encima sin máscara. */}
          <div className="relative overflow-hidden rounded-2xl bg-[#0a0a0c] text-white">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)',
                backgroundSize: '22px 22px',
                WebkitMaskImage: 'radial-gradient(62% 82% at 50% 84%, #000 5%, transparent 68%)',
                maskImage: 'radial-gradient(62% 82% at 50% 84%, #000 5%, transparent 68%)',
              }}
            />
            <div className="relative px-5 py-5 sm:px-6">
              <div className="flex items-start justify-between gap-5">
                <div className="flex min-w-0 items-start gap-3.5">
                  <div className="grid h-[38px] w-[38px] flex-shrink-0 place-items-center rounded-[11px] border border-white/20 bg-white/10">
                    <Cpu className="h-[19px] w-[19px]" strokeWidth={1.6} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-[14.5px] font-semibold">Simulador 3D</h4>
                    <p className="mt-1 text-[12.5px] text-white/60">
                      {simulatorContent
                        ? 'Esta unidad incluye un acceso al simulador.'
                        : 'Agrega un acceso al simulador 3D para que los alumnos practiquen en esta unidad.'}
                    </p>
                  </div>
                </div>
                {simulatorContent ? (
                  <button
                    type="button"
                    onClick={onSimulatorToggle}
                    disabled={saving}
                    className="flex h-[34px] flex-shrink-0 items-center gap-2 rounded-[9px] border border-white/25 px-3.5 text-[12.5px] font-semibold text-white/85 transition-colors hover:bg-white/10 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Quitar
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onSimulatorToggle}
                    disabled={saving}
                    className="flex h-[34px] flex-shrink-0 items-center gap-2 rounded-[9px] bg-white px-3.5 text-[12.5px] font-semibold text-[#16151b] transition-colors hover:bg-white/90 disabled:opacity-50"
                  >
                    <Cpu className="h-3.5 w-3.5" /> Agregar simulador
                  </button>
                )}
              </div>

              {simulatorContent && (
                <div className="mt-4">
                  <label className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-white/40">
                    Instrucciones para el alumno
                  </label>
                  <div className="mt-2 flex items-start gap-2">
                    <textarea
                      value={simulatorDesc}
                      onChange={(e) => setSimulatorDesc(e.target.value)}
                      placeholder="Ej: Practica los movimientos del robot UR5 antes de continuar."
                      rows={2}
                      className="min-h-[44px] flex-1 rounded-[10px] border border-white/15 bg-white/[0.06] px-3 py-2.5 text-[13px] text-white/85 placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/30 resize-none"
                    />
                    {descChanged && (
                      <button
                        type="button"
                        onClick={() => onSimulatorDescriptionSave?.(simulatorDesc)}
                        disabled={saving}
                        className="h-[34px] flex-shrink-0 rounded-[9px] bg-white px-3.5 text-[12.5px] font-semibold text-[#16151b] transition-colors hover:bg-white/90 disabled:opacity-50"
                      >
                        Guardar
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Legacy content migration notice — tarjeta ámbar (canvas 2b.5) */}
          {hasLegacyContent && (
            <div className="space-y-4 rounded-2xl border border-[#f0e6c8] bg-[#fffdf6] p-5">
              <div className="flex items-start justify-between gap-5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0 text-[#b45309]" strokeWidth={1.9} />
                    <span className="text-[13.5px] font-semibold text-[#92400e]">
                      Contenido heredado · {legacyContents.length} {legacyContents.length === 1 ? 'bloque' : 'bloques'}
                    </span>
                  </div>
                  <p className="mt-2 text-[12.5px] leading-relaxed text-[#a16207]">
                    Vienen del sistema antiguo de bloques. Puedes moverlos al editor de arriba o borrarlos uno a uno.
                  </p>
                </div>
                <div className="flex flex-shrink-0 items-center gap-2">
                  {!showMigrateConfirm ? (
                    <button
                      type="button"
                      onClick={() => setShowMigrateConfirm(true)}
                      className="inline-flex h-9 items-center gap-2 rounded-[10px] bg-[#16151b] px-3.5 text-[12.5px] font-semibold text-white transition-colors hover:bg-[#2b2b26]"
                    >
                      <Wand2 className="h-3.5 w-3.5" />
                      Migrar al editor
                    </button>
                  ) : (
                    <>
                      <span className="text-xs text-[#a16207]">¿Seguro? Se combinará todo en el editor.</span>
                      <button
                        type="button"
                        onClick={() => { onMigrateLegacy?.(); setShowMigrateConfirm(false) }}
                        className="h-9 rounded-[10px] bg-[#16151b] px-3 text-xs font-semibold text-white"
                      >
                        Sí, migrar
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowMigrateConfirm(false)}
                        className="h-9 rounded-[10px] border border-[#f0e6c8] px-3 text-xs font-semibold text-[#a16207]"
                      >
                        Cancelar
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Legacy content list */}
              <div className="space-y-2">
                {legacyContents.map((content) => {
                  const typeConfig = LEGACY_TYPE_CONFIG[content.content_type] || LEGACY_TYPE_CONFIG.text
                  const TypeIcon = typeConfig.icon

                  return (
                    <div
                      key={content.id}
                      className="group flex items-center gap-3 rounded-[10px] border border-[#f0e6c8] bg-white p-2.5"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="mb-1.5 flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold ${typeConfig.color}`}>
                            <TypeIcon className="h-3 w-3" />
                            {typeConfig.label}
                          </span>
                        </div>
                        {content.content_type === 'image' ? (
                          <img
                            src={content.content_value?.startsWith('http') ? content.content_value : `${API_BASE}${content.content_value}`}
                            alt="Content"
                            className="h-20 w-32 rounded-lg border border-[#f0e6c8] object-cover"
                          />
                        ) : (
                          <p className="break-words text-[13px] leading-snug text-[#55545f] line-clamp-3">
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
                      <button
                        type="button"
                        onClick={() => onContentDelete(content.id)}
                        className="grid h-[30px] w-[30px] flex-shrink-0 place-items-center rounded-lg text-[#c4c3cd] transition-colors hover:bg-[#b4425a]/[0.07] hover:text-[#b4425a]"
                        title="Eliminar bloque"
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={1.8} />
                      </button>
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
