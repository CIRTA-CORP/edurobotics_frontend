/**
 * Content Viewer Component
 *
 * Renders a unit's content as a single, beautiful lesson page.
 * All content items flow together naturally: text as prose,
 * images centered inline, videos embedded, files as download cards.
 * Quiz section appears at the bottom.
 */

import { useState, useEffect } from 'react'
import { Button } from '../../../components/ui/button'
import {
  BookOpen, FileText, FileDown,
  CheckCircle, ChevronRight, ExternalLink,
  ClipboardCheck, Target
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { CourseFeedbackModal } from './CourseFeedbackModal'
import { API_BASE } from '../../../config'

const isVideoUrl = (url) => {
  return url?.includes('youtube.com') || url?.includes('youtu.be') || url?.includes('vimeo.com')
}

const getYoutubeEmbedUrl = (url) => {
  if (!url) return null
  const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/)?.[1]
  return videoId ? `https://www.youtube.com/embed/${videoId}` : null
}

const buildUrl = (value) => {
  if (!value) return ''
  return value.startsWith('http') ? value : `${API_BASE}${value}`
}

/**
 * Renders a single content block seamlessly within the lesson flow
 */
function ContentBlock({ content }) {
  if (content.content_type === 'video' && isVideoUrl(content.content_value)) {
    return (
      <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-sm">
        <iframe
          src={getYoutubeEmbedUrl(content.content_value)}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    )
  }

  if (content.content_type === 'text') {
    return (
      <div className="prose prose-sm md:prose-base max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
        {content.content_value}
      </div>
    )
  }

  if (content.content_type === 'image') {
    return (
      <figure className="flex flex-col items-center">
        <img
          src={buildUrl(content.content_value)}
          alt="Contenido visual"
          className="max-w-full max-h-[500px] object-contain rounded-xl shadow-sm border border-gray-100"
        />
      </figure>
    )
  }

  if (content.content_type === 'file') {
    const fileName = content.content_value?.split('/').pop() || 'archivo'
    const ext = fileName.split('.').pop()?.toUpperCase() || ''
    return (
      <a
        href={buildUrl(content.content_value)}
        target="_blank"
        rel="noopener noreferrer"
        download
        className="flex items-center gap-4 px-5 py-4 bg-gradient-to-r from-rose-50 to-orange-50 hover:from-rose-100 hover:to-orange-100 rounded-xl border border-rose-200/60 transition-all group"
      >
        <div className="w-11 h-11 rounded-lg bg-white shadow-sm flex items-center justify-center border border-rose-200/50 flex-shrink-0">
          <FileDown className="w-5 h-5 text-rose-500 group-hover:scale-110 transition-transform" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-gray-800">Descargar archivo</div>
          <div className="text-xs text-gray-500 truncate">{fileName} <span className="text-rose-500 font-medium">{ext}</span></div>
        </div>
      </a>
    )
  }

  // Resource / link
  return (
    <a
      href={content.content_value}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-4 px-5 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 rounded-xl border border-blue-200/60 transition-all group"
    >
      <div className="w-11 h-11 rounded-lg bg-white shadow-sm flex items-center justify-center border border-blue-200/50 flex-shrink-0">
        <ExternalLink className="w-5 h-5 text-blue-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold text-gray-800">Abrir recurso externo</div>
        <div className="text-xs text-blue-500 truncate">{content.content_value}</div>
      </div>
    </a>
  )
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
  const [navigating, setNavigating] = useState(false)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)

  const hasQuiz = unit?.quizzes && unit.quizzes.length > 0
  const quiz = hasQuiz ? unit.quizzes[0] : null
  const contents = [...(unit?.contents || [])].sort((a, b) => a.order_index - b.order_index)
  const allContentsCompleted = contents.every(c => isContentCompleted?.(c.id))

  const currentUnitIndex = allUnits?.findIndex(u => u.id === unit?.id) ?? -1
  const isLastUnit = currentUnitIndex === (allUnits?.length - 1)
  const isQuizPassed = hasQuiz && isQuizCompleted?.(quiz?.id)

  useEffect(() => {
    const handleFocus = () => {
      if (refreshProgress) refreshProgress()
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [refreshProgress])

  const handleMarkAllComplete = async () => {
    if (navigating) return
    setNavigating(true)
    for (const content of contents) {
      if (!isContentCompleted?.(content.id)) {
        await markComplete(content.id)
      }
    }
    setNavigating(false)
  }

  const handleNextUnit = () => {
    if (currentUnitIndex !== -1 && currentUnitIndex < (allUnits?.length - 1)) {
      const nextUnit = allUnits[currentUnitIndex + 1]
      if (nextUnit && onUnitChange) {
        onUnitChange(nextUnit.id)
      }
    }
  }

  const handleFinish = () => {
    if (isLastUnit) {
      setShowFeedbackModal(true)
    } else {
      handleNextUnit()
    }
  }

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

  return (
    <>
      <div className="max-w-4xl mx-auto space-y-4">
        {/* ── Unit title header ── */}
        <div className={`flex items-center justify-between px-5 py-3 rounded-xl border ${allContentsCompleted ? 'bg-emerald-50/80 border-emerald-200' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${allContentsCompleted ? 'bg-emerald-100' : 'bg-indigo-50'}`}>
              <BookOpen className={`w-4.5 h-4.5 ${allContentsCompleted ? 'text-emerald-600' : 'text-indigo-500'}`} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">{unit.title}</h2>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {contents.length} contenido{contents.length !== 1 ? 's' : ''}
                {hasQuiz ? ' • Evaluación incluida' : ''}
              </p>
            </div>
          </div>
          {allContentsCompleted && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-[11px] text-emerald-700 font-semibold">Completado</span>
            </div>
          )}
        </div>

        {/* ── Lesson content card — everything flows together ── */}
        {contents.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 md:p-8 lg:p-10 space-y-6">
              {contents.map((content) => (
                <ContentBlock key={content.id} content={content} />
              ))}
            </div>
          </div>
        )}

        {/* ── Progress + navigation bar ── */}
        <div className="flex items-center justify-between px-5 py-3 bg-white rounded-xl border border-gray-200">
          <p className="text-xs text-gray-400">
            {contents.filter(c => isContentCompleted?.(c.id)).length} / {contents.length} completados
          </p>

          <div className="flex items-center gap-2">
            {!allContentsCompleted ? (
              <Button
                onClick={handleMarkAllComplete}
                disabled={navigating}
                size="sm"
                className="gap-1.5 bg-blue-600 hover:bg-blue-700"
              >
                {navigating ? 'Guardando...' : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Marcar como leído
                  </>
                )}
              </Button>
            ) : !hasQuiz ? (
              <Button
                onClick={handleFinish}
                size="sm"
                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
              >
                {isLastUnit ? 'Finalizar curso' : 'Siguiente unidad'}
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : null}
          </div>
        </div>

        {/* ── Quiz section ── */}
        {hasQuiz && (
          <div className="bg-white rounded-3xl border border-blue-100 p-8 md:p-12 shadow-sm shadow-blue-50 text-center">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-6">
              <ClipboardCheck className="w-7 h-7" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-3">Evaluación Final de Unidad</h2>
            <p className="text-gray-500 max-w-sm mx-auto mb-8">
              {allContentsCompleted
                ? 'Has completado todos los contenidos. Es momento de poner a prueba tus conocimientos en:'
                : 'Completa todo el contenido antes de realizar la evaluación:'}
              <span className="block font-semibold text-gray-800 mt-1 italic">"{quiz?.title}"</span>
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto mb-8 text-left">
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center border border-gray-100 flex-shrink-0">
                  <Target className="w-4 h-4 text-emerald-500" />
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-900">Objetivo</div>
                  <div className="text-[10px] text-gray-500">Aprobar el cuestionario</div>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center border border-gray-100 flex-shrink-0">
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
              disabled={!allContentsCompleted}
              className={`${isQuizPassed ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'} h-12 px-8 rounded-xl shadow-lg gap-2 disabled:opacity-50`}
            >
              {isQuizPassed ? 'Repetir evaluación (opcional)' : 'Comenzar evaluación ahora'}
              <ChevronRight className="w-4 h-4" />
            </Button>

            {!allContentsCompleted && (
              <p className="mt-4 text-[11px] text-amber-600">
                Debes completar todo el contenido antes de acceder a la evaluación.
              </p>
            )}

            {isQuizPassed && (
              <div className="mt-6">
                <Button
                  onClick={handleFinish}
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                >
                  {isLastUnit ? 'Finalizar curso' : 'Siguiente unidad'}
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}

            <p className="mt-6 text-[11px] text-gray-400">
              Al iniciar, se abrirá una nueva ventana dedicada para la evaluación.
            </p>
          </div>
        )}
      </div>

      {showFeedbackModal && (
        <CourseFeedbackModal
          courseId={courseId}
          userId={userId}
          onComplete={() => {
            setShowFeedbackModal(false)
            navigate(`/courses/${courseId}`)
          }}
          onSkip={() => {
            setShowFeedbackModal(false)
            navigate(`/courses/${courseId}`)
          }}
        />
      )}
    </>
  )
}
