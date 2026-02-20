/**
 * Content Viewer Component
 *
 * Displays module content including videos (YouTube embeds), text, and resource links.
 * Handles different content types with appropriate rendering.
 * Tracks and displays content completion status.
 * Redesigned with modern navigation bar and cleaner content display.
 */

import { useState, useEffect } from 'react'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import {
  BookOpen, PlayCircle, FileText, Link2,
  CheckCircle, ChevronLeft, ChevronRight, ExternalLink
} from 'lucide-react'

const CONTENT_TYPES = {
  video: { label: 'Video', icon: PlayCircle, color: 'bg-purple-100 text-purple-700' },
  text: { label: 'Texto', icon: FileText, color: 'bg-blue-100 text-blue-700' },
  resource: { label: 'Recurso', icon: Link2, color: 'bg-amber-100 text-amber-700' },
}

const isVideoUrl = (url) => {
  return url?.includes('youtube.com') || url?.includes('youtu.be') || url?.includes('vimeo.com')
}

const getYoutubeEmbedUrl = (url) => {
  if (!url) return null
  const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/)?.[1]
  return videoId ? `https://www.youtube.com/embed/${videoId}` : null
}

export function ContentViewer({
  unit,
  allUnits,
  userId,
  isContentCompleted,
  markComplete,
  getUnitProgress,
  onUnitChange
}) {
  const [currentContentIndex, setCurrentContentIndex] = useState(0)
  const [navigating, setNavigating] = useState(false)

  const currentContent = unit?.contents?.[currentContentIndex]
  const hasPrevious = currentContentIndex > 0
  const hasNext = currentContentIndex < (unit?.contents?.length - 1 || 0)

  const currentUnitIndex = allUnits?.findIndex(u => u.id === unit?.id) ?? -1
  const isLastUnit = currentUnitIndex === (allUnits?.length - 1)
  const isLastContent = !hasNext
  const isCompleted = isContentCompleted?.(currentContent?.id)

  const handleNext = async () => {
    if (!currentContent || !userId) return
    setNavigating(true)
    await markComplete(currentContent.id)

    if (hasNext) {
      setCurrentContentIndex(prev => prev + 1)
    } else {
      const currentUnitIndex = allUnits?.findIndex(u => u.id === unit.id)
      if (currentUnitIndex !== -1 && currentUnitIndex < (allUnits?.length - 1)) {
        const nextUnit = allUnits[currentUnitIndex + 1]
        if (nextUnit && onUnitChange) {
          onUnitChange(nextUnit.id)
          setCurrentContentIndex(0)
        }
      }
    }
    setNavigating(false)
  }

  const handlePrevious = () => {
    if (hasPrevious) {
      setCurrentContentIndex(prev => prev - 1)
    } else {
      const currentUnitIndex = allUnits?.findIndex(u => u.id === unit.id)
      if (currentUnitIndex > 0) {
        const previousUnit = allUnits[currentUnitIndex - 1]
        if (previousUnit && onUnitChange) {
          onUnitChange(previousUnit.id)
          setCurrentContentIndex((previousUnit.contents?.length || 1) - 1)
        }
      }
    }
  }

  const handleComplete = async () => {
    if (!currentContent || !userId) return
    setNavigating(true)
    await markComplete(currentContent.id)
    setNavigating(false)
  }

  // Reset index cuando cambia la unidad
  useEffect(() => {
    if (unit && currentContentIndex >= (unit.contents?.length || 0)) {
      setCurrentContentIndex(0)
    }
  }, [unit?.id, currentContentIndex, unit?.contents?.length])

  // ── Empty state ──
  if (!unit || !unit.contents || unit.contents.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <FileText className="w-7 h-7 text-gray-300" />
          </div>
          <p className="text-gray-500 text-sm font-medium">Selecciona una unidad</p>
          <p className="text-gray-400 text-xs mt-1">El contenido aparecerá aquí</p>
        </div>
      </div>
    )
  }

  if (!currentContent) return null

  const typeConfig = CONTENT_TYPES[currentContent.content_type] || CONTENT_TYPES.text
  const TypeIcon = typeConfig.icon

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* ── Content header bar ── */}
      <div className={`flex items-center justify-between px-4 py-2.5 rounded-xl border ${isCompleted ? 'bg-emerald-50/80 border-emerald-200' : 'bg-white border-gray-200'
        }`}>
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isCompleted ? 'bg-emerald-100' : 'bg-gray-100'
            }`}>
            <TypeIcon className={`w-4 h-4 ${isCompleted ? 'text-emerald-600' : 'text-gray-500'}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${typeConfig.color}`}>
                {typeConfig.label}
              </span>
              <span className="text-xs text-gray-400">
                Contenido {currentContentIndex + 1} de {unit.contents.length}
              </span>
            </div>
            {isCompleted && (
              <div className="flex items-center gap-1 mt-0.5">
                <CheckCircle className="w-3 h-3 text-emerald-500" />
                <span className="text-[10px] text-emerald-600 font-medium">Completado</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Content body ── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {currentContent.content_type === 'video' && isVideoUrl(currentContent.content_value) ? (
          <div className="aspect-video bg-black">
            <iframe
              src={getYoutubeEmbedUrl(currentContent.content_value)}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : currentContent.content_type === 'text' ? (
          <div className="p-6 md:p-8">
            <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
              {currentContent.content_value}
            </div>
          </div>
        ) : (
          <div className="p-6">
            <a
              href={currentContent.content_value}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl transition-colors group"
            >
              <ExternalLink className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              <div>
                <div className="text-sm font-medium">Abrir recurso</div>
                <div className="text-xs text-blue-500 truncate max-w-md">{currentContent.content_value}</div>
              </div>
            </a>
          </div>
        )}
      </div>

      {/* ── Navigation bar ── */}
      <div className="flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-gray-200">
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePrevious}
          disabled={!hasPrevious && (!allUnits || allUnits.findIndex(u => u.id === unit.id) === 0)}
          className="gap-1.5 text-gray-600"
        >
          <ChevronLeft className="w-4 h-4" />
          Anterior
        </Button>

        {/* Progress dots */}
        <div className="flex items-center gap-1.5">
          {unit.contents.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentContentIndex(i)}
              className={`w-2 h-2 rounded-full transition-all ${i === currentContentIndex
                  ? 'bg-blue-500 w-5'
                  : isContentCompleted?.(unit.contents[i]?.id)
                    ? 'bg-emerald-400'
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
              title={`Contenido ${i + 1}`}
            />
          ))}
        </div>

        {isLastContent ? (
          <Button
            onClick={handleComplete}
            disabled={navigating || isCompleted}
            size="sm"
            className={`gap-1.5 ${isCompleted ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {navigating ? 'Guardando...' : (
              <>
                <CheckCircle className="w-4 h-4" />
                {isCompleted ? 'Completado' : isLastUnit ? 'Completar curso' : 'Completado'}
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            disabled={navigating}
            size="sm"
            className="gap-1.5 bg-blue-600 hover:bg-blue-700"
          >
            {navigating ? 'Guardando...' : (
              <>
                Siguiente
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
