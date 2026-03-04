/**
 * Content Form Component
 *
 * Form for adding content to a unit (text, video, resource links, or images).
 * Displays existing content with type badges and allows deletion.
 * Supports file upload for image type content.
 */

import { useState, useRef } from 'react'
import { Card, CardContent } from '../../../../components/ui/card'
import { Button } from '../../../../components/ui/button'
import { Badge } from '../../../../components/ui/badge'
import {
  Plus, Trash2, ChevronDown, ChevronUp,
  FileText, Video, Link2, Package, ImageIcon, Upload, Loader2, X, FileDown,
  ArrowUp, ArrowDown, Edit3, Check
} from 'lucide-react'
import { apiUploadFile } from '../../../../services/api'
import { API_BASE } from '../../../../config'

const CONTENT_TYPES = {
  text: { label: 'Texto', icon: FileText, color: 'bg-blue-100 text-blue-700' },
  video: { label: 'Video', icon: Video, color: 'bg-purple-100 text-purple-700' },
  resource: { label: 'Recurso', icon: Link2, color: 'bg-amber-100 text-amber-700' },
  image: { label: 'Imagen', icon: ImageIcon, color: 'bg-emerald-100 text-emerald-700' },
  file: { label: 'Archivo', icon: FileDown, color: 'bg-rose-100 text-rose-700' },
}

export function ContentForm({
  contentForm,
  setContentForm,
  onSubmit,
  selectedUnit,
  onContentDelete,
  onContentReorder,
  onContentUpdate,
  expanded,
  onToggle
}) {
  const contentCount = selectedUnit?.contents?.length || 0
  const sortedContents = [...(selectedUnit?.contents || [])].sort((a, b) => a.order_index - b.order_index)
  const [editingId, setEditingId] = useState(null)
  const [editValue, setEditValue] = useState('')
  const fileInputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadError(null)
    setUploading(true)

    try {
      // Show local preview immediately
      const localPreview = URL.createObjectURL(file)
      setPreviewUrl(localPreview)

      // Upload to server
      const result = await apiUploadFile('/api/uploads', file)
      setContentForm({ ...contentForm, content_value: result.url })
    } catch (err) {
      setUploadError(err.message)
      setPreviewUrl(null)
      setContentForm({ ...contentForm, content_value: '' })
    } finally {
      setUploading(false)
    }
  }

  const clearImage = () => {
    setPreviewUrl(null)
    setContentForm({ ...contentForm, content_value: '' })
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const isUploadType = contentForm.content_type === 'image' || contentForm.content_type === 'file'
  const acceptTypes = contentForm.content_type === 'image'
    ? 'image/png,image/jpeg,image/gif,image/webp,image/svg+xml'
    : '.pdf,.doc,.docx'

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
              <div className="grid grid-cols-5 gap-2">
                {Object.entries(CONTENT_TYPES).map(([value, config]) => {
                  const TypeIcon = config.icon
                  const isActive = contentForm.content_type === value
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        setContentForm({ ...contentForm, content_type: value, content_value: (value === 'image' || value === 'file') ? '' : contentForm.content_value })
                        if (value !== 'image' && value !== 'file') { setPreviewUrl(null); setUploadError(null) }
                      }}
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

            {/* Content value — textarea for text/video/resource, file picker for image */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                {isUploadType ? 'Archivo *' : 'Contenido *'}
              </label>

              {isUploadType ? (
                <div className="space-y-3">
                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={acceptTypes}
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  {/* Upload area / Preview */}
                  {previewUrl || contentForm.content_value ? (
                    <div className="relative rounded-xl border border-gray-200 overflow-hidden bg-gray-50">
                      {contentForm.content_type === 'image' && (previewUrl || contentForm.content_value) ? (
                        <img
                          src={previewUrl || `${API_BASE}${contentForm.content_value}`}
                          alt="Preview"
                          className="w-full max-h-60 object-contain"
                        />
                      ) : (
                        <div className="flex items-center gap-3 p-4">
                          <FileDown className="w-8 h-8 text-rose-500" />
                          <div>
                            <p className="text-sm font-medium text-gray-700">Archivo subido</p>
                            <p className="text-xs text-gray-400 truncate">{contentForm.content_value}</p>
                          </div>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={clearImage}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      {uploading && (
                        <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="w-full flex flex-col items-center justify-center gap-2 px-4 py-8 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/50 transition-all cursor-pointer"
                    >
                      {uploading ? (
                        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-gray-400" />
                          <div className="text-center">
                            <span className="text-sm font-medium text-gray-600">
                              {contentForm.content_type === 'image' ? 'Click para subir imagen' : 'Click para subir archivo'}
                            </span>
                            <p className="text-[10px] text-gray-400 mt-0.5">
                              {contentForm.content_type === 'image' ? 'PNG, JPG, GIF, WebP • Máx. 5 MB' : 'PDF, DOC, DOCX • Máx. 5 MB'}
                            </p>
                          </div>
                        </>
                      )}
                    </button>
                  )}

                  {uploadError && (
                    <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{uploadError}</p>
                  )}
                </div>
              ) : (
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
              )}
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

            <Button
              type="submit"
              className="w-full gap-1.5 bg-blue-600 hover:bg-blue-700"
              disabled={uploading || (isUploadType && !contentForm.content_value)}
            >
              <Plus className="w-4 h-4" />
              Agregar Contenido
            </Button>
          </form>

          {contentCount > 0 && (
            <div className="border-t border-gray-100 pt-5">
              <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
                Contenidos existentes ({contentCount})
              </h4>
              <div className="space-y-2">
                {sortedContents.map((content, index) => {
                  const typeConfig = CONTENT_TYPES[content.content_type] || CONTENT_TYPES.text
                  const TypeIcon = typeConfig.icon
                  const isEditing = editingId === content.id

                  return (
                    <div
                      key={content.id}
                      className="flex items-start gap-2 p-3 rounded-xl border border-gray-100 bg-gray-50/80 group hover:border-gray-200 transition-colors"
                    >
                      {/* Up/Down arrows */}
                      <div className="flex flex-col gap-0.5 pt-0.5">
                        <button
                          type="button"
                          onClick={() => onContentReorder?.(content.id, 'up')}
                          disabled={index === 0}
                          className="p-0.5 rounded hover:bg-gray-200 disabled:opacity-20 disabled:cursor-not-allowed text-gray-400 hover:text-gray-700 transition-colors"
                          title="Mover arriba"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onContentReorder?.(content.id, 'down')}
                          disabled={index === sortedContents.length - 1}
                          className="p-0.5 rounded hover:bg-gray-200 disabled:opacity-20 disabled:cursor-not-allowed text-gray-400 hover:text-gray-700 transition-colors"
                          title="Mover abajo"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Content body */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${typeConfig.color}`}>
                            <TypeIcon className="w-3 h-3" />
                            {typeConfig.label}
                          </span>
                          <span className="text-[10px] text-gray-400">Pos. {index + 1}</span>
                        </div>
                        {isEditing && content.content_type === 'text' ? (
                          <div className="flex gap-2">
                            <textarea
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="flex-1 min-h-[60px] rounded-lg border border-blue-300 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                            />
                            <div className="flex flex-col gap-1">
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => {
                                  onContentUpdate?.(content.id, { content_value: editValue })
                                  setEditingId(null)
                                }}
                                className="h-7 px-2 bg-blue-600 hover:bg-blue-700"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingId(null)}
                                className="h-7 px-2"
                              >
                                <X className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        ) : content.content_type === 'image' ? (
                          <img
                            src={`${API_BASE}${content.content_value}`}
                            alt="Content"
                            className="w-32 h-20 object-cover rounded-lg border border-gray-200"
                          />
                        ) : (
                          <p className="text-sm text-gray-700 break-words line-clamp-3">{content.content_value}</p>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-1 flex-shrink-0">
                        {content.content_type === 'text' && !isEditing && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingId(content.id)
                              setEditValue(content.content_value)
                            }}
                            className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 p-1.5 h-auto"
                            title="Editar"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onContentDelete(content.id)}
                          className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-1.5 h-auto"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
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
