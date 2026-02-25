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
  CheckCircle, ChevronLeft, ChevronRight, ExternalLink,
  ClipboardCheck, Target
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { QuizView } from './QuizView'

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
  isQuizCompleted,
  markComplete,
  refreshProgress,
  getUnitProgress,
  onUnitChange
}) {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const [currentContentIndex, setCurrentContentIndex] = useState(0)
  const [navigating, setNavigating] = useState(false)

  const hasQuiz = unit?.quizzes && unit.quizzes.length > 0
  const quiz = hasQuiz ? unit.quizzes[0] : null

  const totalSteps = (unit?.contents?.length || 0) + (hasQuiz ? 1 : 0)
  const isQuizStep = hasQuiz && currentContentIndex === (unit?.contents?.length || 0)

  const currentContent = !isQuizStep ? unit?.contents?.[currentContentIndex] : null
  const hasPrevious = currentContentIndex > 0
  const hasNext = currentContentIndex < totalSteps - 1

  const currentUnitIndex = allUnits?.findIndex(u => u.id === unit?.id) ?? -1
  const isLastUnit = currentUnitIndex === (allUnits?.length - 1)
  const isLastContent = !hasNext

  const isQuizPassed = isQuizStep && isQuizCompleted?.(quiz?.id)
  const isCompleted = isQuizStep ? isQuizPassed : isContentCompleted?.(currentContent?.id)

  const handleNext = async () => {
    if (navigating) return

    // Si estamos en contenido normal, marcamos como completo antes de avanzar
    if (!isQuizStep && currentContent) {
      setNavigating(true)
      await markComplete(currentContent.id)
      setNavigating(false)
    }

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
    if (navigating) return

    // Si es quiz step y ya está aprobado, navegar
    if (isQuizStep) {
      if (isQuizPassed) {
        if (isLastUnit) {
          // Último quiz del curso — ir al preview del curso
          navigate(`/courses/${courseId}`)
          return
        }
        // Ir a la siguiente unidad
        const idx = allUnits?.findIndex(u => u.id === unit.id)
        if (idx !== -1 && idx < (allUnits?.length - 1)) {
          const nextUnit = allUnits[idx + 1]
          if (nextUnit && onUnitChange) {
            onUnitChange(nextUnit.id)
            setCurrentContentIndex(0)
          }
        }
      }
      return
    }

    // Si es contenido normal
    if (!currentContent || !userId) return
    setNavigating(true)
    await markComplete(currentContent.id)
    setNavigating(false)

    // Si es el último contenido
    if (isLastContent) {
      if (isLastUnit) {
        // Último contenido del curso — ir al preview del curso
        navigate(`/courses/${courseId}`)
      } else {
        // Ir a la siguiente unidad
        const idx = allUnits?.findIndex(u => u.id === unit.id)
        if (idx !== -1 && idx < (allUnits?.length - 1)) {
          const nextUnit = allUnits[idx + 1]
          if (nextUnit && onUnitChange) {
            onUnitChange(nextUnit.id)
            setCurrentContentIndex(0)
          }
        }
      }
    }
  }

  // Reset index cuando cambia la unidad
  useEffect(() => {
    setCurrentContentIndex(0)
  }, [unit?.id])

  // Refrescar progreso al ganar foco (útil al volver del quiz)
  useEffect(() => {
    const handleFocus = () => {
      if (refreshProgress) refreshProgress()
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [refreshProgress])

  // ── Empty state ──
  if (!unit || (!unit.contents?.length && !hasQuiz)) {
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

  if (!currentContent && !isQuizStep) return null

  const typeConfig = isQuizStep
    ? { label: 'Evaluación', icon: ClipboardCheck, color: 'bg-indigo-100 text-indigo-700' }
    : (CONTENT_TYPES[currentContent?.content_type] || CONTENT_TYPES.text)
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
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${isQuizStep ? 'bg-indigo-100 text-indigo-700' : typeConfig.color}`}>
                {isQuizStep ? 'Evaluación' : typeConfig.label}
              </span>
              <span className="text-xs text-gray-400">
                Paso {currentContentIndex + 1} de {totalSteps}
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

      {/* ── Quiz View Landing ── */}
      {isQuizStep && (
        <div className="bg-white rounded-3xl border border-blue-100 p-8 md:p-12 shadow-sm shadow-blue-50 text-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-6">
            <ClipboardCheck className="w-7 h-7" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-3">Evaluación Final de Unidad</h2>
          <p className="text-gray-500 max-w-sm mx-auto mb-8">
            Has completado todos los contenidos. Es momento de poner a prueba tus conocimientos en:
            <span className="block font-semibold text-gray-800 mt-1 italic">"{quiz?.title}"</span>
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto mb-8 text-left">
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center border border-gray-100 flex-shrink-0">
                <Target className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <div className="text-xs font-bold text-gray-900">Objetivo</div>
                <div className="text-[10px] text-gray-500 line-clamp-1">Aprobar el cuestionario</div>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-start gap-3">
              <div className={`w-8 h-8 rounded-lg bg-white flex items-center justify-center border border-gray-100 flex-shrink-0`}>
                <ClipboardCheck className={`w-4 h-4 ${isQuizPassed ? 'text-emerald-500' : 'text-blue-500'}`} />
              </div>
              <div>
                <div className="text-xs font-bold text-gray-900">Estado</div>
                <div className={`text-[10px] ${isQuizPassed ? 'text-emerald-600 font-bold' : 'text-gray-500'}`}>
                  {isQuizPassed ? '¡Aprobado!' : 'Pendiente de realizar'}
                </div>
              </div>
            </div>
          </div>

          <Button
            onClick={() => navigate(`/courses/${courseId}/quiz/${quiz.id}`)}
            className={`${isQuizPassed ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'} h-12 px-8 rounded-xl shadow-lg gap-2`}
          >
            {isQuizPassed ? 'Repetir evaluación (opcional)' : 'Comenzar evaluación ahora'}
            <ChevronRight className="w-4 h-4" />
          </Button>

          <p className="mt-6 text-[11px] text-gray-400">
            Al iniciar, se abrirá una nueva ventana dedicada para la evaluación.
          </p>
        </div>
      )}

      {/* ── Content body ── */}
      {!isQuizStep && (
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
      )}

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
          {Array.from({ length: totalSteps }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentContentIndex(i)}
              className={`w-2 h-2 rounded-full transition-all ${i === currentContentIndex
                ? 'bg-blue-500 w-5'
                : i < unit.contents.length && isContentCompleted?.(unit.contents[i]?.id)
                  ? 'bg-emerald-400'
                  : i === unit.contents.length && isQuizCompleted?.(quiz?.id)
                    ? 'bg-emerald-400'
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
              title={i === unit.contents.length ? 'Evaluación' : `Contenido ${i + 1}`}
            />
          ))}
        </div>

        {isLastContent ? (
          <Button
            onClick={handleComplete}
            disabled={navigating}
            size="sm"
            className={`gap-1.5 ${isCompleted ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {navigating ? 'Guardando...' : (
              <>
                {isCompleted ? <ChevronRight className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                {isCompleted
                  ? (isLastUnit ? 'Finalizar curso' : 'Siguiente unidad')
                  : (isLastUnit ? 'Completar curso' : 'Completado')
                }
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
