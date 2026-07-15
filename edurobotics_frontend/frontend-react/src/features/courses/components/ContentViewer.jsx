/**
 * Content Viewer Component
 *
 * Renders a unit's content as a single, beautiful lesson page.
 * All content items flow together naturally: text as prose,
 * images centered inline, videos embedded, files as download cards.
 * Quiz section appears at the bottom.
 */

import { useState, useEffect, useMemo, useRef } from 'react'
import { Button } from '@/shared/components/button'
import {
  FileText, FileDown,
  CheckCircle, ChevronRight, ExternalLink,
  ClipboardCheck, ChevronLeft, ArrowUp,
  ListTree, Cpu
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { CourseFeedbackModal } from './CourseFeedbackModal'
import { API_BASE } from '@/config'
import { sanitizeHtml } from '@/shared/lib/sanitizeHtml'

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
    // Check if content contains HTML tags (from rich text editor)
    const isHtml = /<[a-z][\s\S]*>/i.test(content.content_value)
    if (isHtml) {
      return (
        <div
          className="rich-content prose prose-sm md:prose-base max-w-none w-full overflow-hidden text-gray-700 leading-relaxed break-words"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(content.content_value) }}
        />
      )
    }
    // Fallback for plain text (old content)
    return (
      <div className="prose prose-sm md:prose-base max-w-none w-full overflow-hidden text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
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
    const fileUrl = buildUrl(content.content_value)

    if (ext === 'PDF') {
      return (
        <div className="flex flex-col gap-3 w-full">
          {/* PDF Header / Download Bar */}
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center flex-shrink-0">
                <FileDown className="w-4 h-4 text-rose-600" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-gray-800 truncate" title={fileName}>
                  {fileName}
                </h3>
                <p className="text-[11px] font-medium text-gray-500">Documento PDF</p>
              </div>
            </div>
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 hover:text-blue-600 rounded-lg transition-colors shadow-sm"
              title="Descargar PDF"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Descargar</span>
            </a>
          </div>

          {/* PDF Embed */}
          <div className="w-full bg-gray-100 rounded-xl border border-gray-200 overflow-hidden shadow-inner" style={{ height: '75vh', minHeight: '600px' }}>
            <object
              data={fileUrl}
              type="application/pdf"
              className="w-full h-full"
            >
              <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-gray-50">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                  <FileDown className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600 mb-5 font-medium">Tu navegador de internet no soporta la previsualización de PDFs integrados.</p>
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm"
                >
                  Descargar el archivo PDF directamente
                </a>
              </div>
            </object>
          </div>
        </div>
      )
    }

    // Default download card for non-PDF files (Word, Excel, etc)
    return (
      <a
        href={fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        download
        className="flex items-center gap-4 px-5 py-4 bg-gradient-to-r from-rose-50 to-orange-50 hover:from-rose-100 hover:to-orange-100 rounded-xl border border-rose-200/60 transition-all group w-full"
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
      className="flex items-center gap-4 px-5 py-4 bg-gradient-to-r from-blue-50 to-blue-50 hover:from-blue-100 hover:to-blue-100 rounded-xl border border-blue-200/60 transition-all group"
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

/**
 * Parse heading elements from HTML string for table of contents
 */
function extractHeadings(html) {
  if (!html) return []
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const headings = []
  doc.querySelectorAll('h1, h2, h3').forEach((el, i) => {
    const text = el.textContent.trim()
    if (text) {
      const id = `heading-${i}`
      headings.push({
        id,
        text,
        level: parseInt(el.tagName[1]),
      })
    }
  })
  return headings
}

/**
 * Table of Contents — rendered inside the content card
 */
function TableOfContents({ headings }) {
  if (headings.length < 2) return null

  const scrollToHeading = (id) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <nav className="mb-8 px-5 py-4 bg-gray-50/80 rounded-xl border border-gray-100">
      <div className="flex items-center gap-2 mb-3">
        <ListTree className="w-4 h-4 text-blue-500" />
        <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">Contenido</span>
      </div>
      <ul className="space-y-1">
        {headings.map((h) => (
          <li key={h.id}>
            <button
              onClick={() => scrollToHeading(h.id)}
              className={`text-left w-full text-sm hover:text-blue-600 transition-colors truncate ${
                h.level === 1 ? 'font-semibold text-gray-800' :
                h.level === 2 ? 'pl-4 text-gray-600' :
                'pl-8 text-gray-500 text-xs'
              }`}
            >
              {h.text}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}

/**
 * Inject id attributes into rendered rich HTML so ToC links work
 */
function injectHeadingIds(html) {
  if (!html) return html
  let counter = 0
  return html.replace(/<(h[123])([^>]*)>/gi, (match, tag, attrs) => {
    const id = `heading-${counter++}`
    if (attrs.includes('id=')) return match
    return `<${tag}${attrs} id="${id}">`
  })
}

/**
 * Scroll to top floating button
 */
function ScrollToTop({ scrollRef }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = scrollRef?.current
    if (!el) return
    const onScroll = () => setVisible(el.scrollTop > 400)
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [scrollRef])

  if (!visible) return null

  return (
    <button
      onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-6 right-6 z-40 w-10 h-10 bg-white border border-gray-200 rounded-full shadow-lg flex items-center justify-center text-gray-500 hover:text-blue-600 hover:border-blue-200 transition-all animate-fade-in"
      title="Volver arriba"
    >
      <ArrowUp className="w-4 h-4" />
    </button>
  )
}

export function ContentViewer({
  unit,
  allUnits,
  modules,
  userId,
  isContentCompleted,
  isQuizCompleted,
  markComplete,
  updateAccess,
  refreshProgress,
  getUnitProgress,
  onUnitChange,
  scrollRef,
}) {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const [navigating, setNavigating] = useState(false)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [visible, setVisible] = useState(true) // for transition animation

  const hasQuiz = unit?.quizzes && unit.quizzes.length > 0
  const quiz = hasQuiz ? unit.quizzes[0] : null
  const contents = [...(unit?.contents || [])].sort((a, b) => a.order_index - b.order_index)

  // Separate rich_text, simulator and legacy blocks
  const richContent = contents.find(c => c.content_type === 'rich_text')
  const simulatorContent = contents.find(c => c.content_type === 'simulator')
  const legacyContents = contents.filter(c =>
    c.content_type !== 'rich_text' && c.content_type !== 'simulator'
  )

  // Prepare HTML with heading IDs for ToC anchors. Sanitize AFTER injecting
  // ids so any malicious markup is stripped before it reaches the DOM.
  const processedHtml = useMemo(
    () => sanitizeHtml(injectHeadingIds(richContent?.content_value)),
    [richContent?.content_value]
  )
  const headings = useMemo(() => extractHeadings(richContent?.content_value), [richContent?.content_value])

  // Whether the rich editor actually has written content (an empty TipTap doc
  // serializes to '<p></p>'). Used to avoid rendering a blank white card.
  const hasRichBody = !!processedHtml && processedHtml !== '<p></p>'

  // Find current module for breadcrumbs
  const currentModule = useMemo(() => {
    if (!modules || !unit) return null
    return modules.find(m => m.units?.some(u => u.id === unit.id))
  }, [modules, unit])

  const allContentsCompleted = contents.every(c => isContentCompleted?.(c.id))

  const currentUnitIndex = allUnits?.findIndex(u => u.id === unit?.id) ?? -1
  const isFirstUnit = currentUnitIndex === 0
  const isLastUnit = currentUnitIndex === (allUnits?.length - 1)
  const isQuizPassed = hasQuiz && isQuizCompleted?.(quiz?.id)

  // Transition animation on unit change
  useEffect(() => {
    setVisible(false)
    const timer = setTimeout(() => setVisible(true), 50)
    return () => clearTimeout(timer)
  }, [unit?.id])

  // Stamp an "opened" time for this unit's contents so the time-spent metrics
  // measure from opening the unit to completing it — not just the completion
  // instant (which made every unit read as "1 s"). The backend sets started_at
  // only on first touch; re-opening just bumps last_accessed, so calling this
  // again is harmless. Only pending contents are stamped.
  useEffect(() => {
    if (!updateAccess || !unit) return
    for (const content of unit.contents || []) {
      if (!isContentCompleted?.(content.id)) updateAccess(content.id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unit?.id])

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
        scrollRef?.current?.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }
  }

  const handlePreviousUnit = () => {
    if (currentUnitIndex > 0) {
      const prevUnit = allUnits[currentUnitIndex - 1]
      if (prevUnit && onUnitChange) {
        onUnitChange(prevUnit.id)
        scrollRef?.current?.scrollTo({ top: 0, behavior: 'smooth' })
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
      <div className={`max-w-4xl mx-auto space-y-4 transition-all duration-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
        {/* ── Breadcrumbs + status ── */}
        <div className="flex items-center justify-between px-1">
          <nav className="flex items-center gap-1.5 text-xs text-gray-400 min-w-0">
            {currentModule && (
              <>
                <span className="truncate max-w-[160px]" title={currentModule.title}>{currentModule.title}</span>
                <ChevronRight className="w-3 h-3 flex-shrink-0" />
              </>
            )}
            <span className="text-gray-700 font-medium truncate max-w-[220px]" title={unit.title}>{unit.title}</span>
          </nav>
          {allContentsCompleted && (
            <div className="flex items-center gap-1 text-emerald-600 flex-shrink-0 ml-3">
              <CheckCircle className="w-3.5 h-3.5" />
              <span className="text-[11px] font-semibold">Completado</span>
            </div>
          )}
        </div>

        {/* ── Lesson title ── */}
        <h1 className="px-1 text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
          {unit.title}
        </h1>

        {/* ── Lesson content card — everything flows together ── */}
        {(hasRichBody || legacyContents.length > 0) && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 md:p-8 lg:p-12 space-y-8 max-w-[800px] mx-auto">
              {/* Table of Contents */}
              {hasRichBody && <TableOfContents headings={headings} />}

              {/* Rich text content (new TipTap format) — single unified document */}
              {hasRichBody && (
                <div
                  className="rich-content prose prose-sm md:prose-base max-w-none w-full overflow-hidden text-gray-700 leading-relaxed break-words"
                  dangerouslySetInnerHTML={{ __html: processedHtml }}
                />
              )}
              {/* Legacy content blocks (old multi-block format) */}
              {legacyContents.map((content) => (
                <ContentBlock key={content.id} content={content} />
              ))}
            </div>
          </div>
        )}

        {/* ── Empty state — nothing to show in this unit ── */}
        {!hasRichBody && legacyContents.length === 0 && !simulatorContent && !hasQuiz && (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
              <FileText className="h-6 w-6 text-gray-400" />
            </div>
            <p className="font-medium text-gray-600">Esta unidad aún no tiene contenido</p>
            <p className="mt-1 text-sm text-gray-400">El material aparecerá aquí cuando se agregue.</p>
          </div>
        )}

        {/* ── Simulator section ── */}
        {simulatorContent && (
          <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-50 overflow-hidden">
            <div className="h-1 bg-blue-500" />
            <div className="p-5 md:p-6">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Cpu className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-gray-900">Simulador 3D</h3>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {simulatorContent.content_value?.trim()
                        || 'Practica con el robot en el simulador antes de continuar.'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (!isContentCompleted?.(simulatorContent.id)) {
                      markComplete?.(simulatorContent.id)
                    }
                    // Grant simulator access for this session: the /simulator
                    // route only opens when entered from a unit that includes it.
                    sessionStorage.setItem('sim_access', '1')
                    navigate('/simulator')
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors flex-shrink-0"
                >
                  Abrir simulador
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Progress + navigation bar ── */}
        <div className="flex items-center justify-between px-5 py-3 bg-white rounded-xl border border-gray-200">
          {/* Previous unit */}
          <div className="flex-1">
            {!isFirstUnit && (
              <button
                onClick={handlePreviousUnit}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-blue-600 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline truncate max-w-[120px]">
                  {allUnits[currentUnitIndex - 1]?.title || 'Anterior'}
                </span>
                <span className="sm:hidden">Anterior</span>
              </button>
            )}
          </div>

          {/* Center: actions */}
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

          {/* Next unit */}
          <div className="flex-1 flex justify-end">
            {!isLastUnit && (
              <button
                onClick={handleNextUnit}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-blue-600 transition-colors"
              >
                <span className="hidden sm:inline truncate max-w-[120px]">
                  {allUnits[currentUnitIndex + 1]?.title || 'Siguiente'}
                </span>
                <span className="sm:hidden">Siguiente</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* ── Quiz section ── */}
        {hasQuiz && (
          <div className={`rounded-2xl border overflow-hidden ${
            isQuizPassed
              ? 'bg-emerald-50/50 border-emerald-200'
              : allContentsCompleted
                ? 'bg-white border-gray-200' 
                : 'bg-gray-50/50 border-gray-200'
          }`}>
            {/* Top accent line */}
            <div className={`h-1 ${isQuizPassed ? 'bg-emerald-500' : 'bg-blue-500'}`} />

            <div className="p-5 md:p-6">
              {/* Header row */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isQuizPassed ? 'bg-emerald-100' : 'bg-blue-50'
                  }`}>
                    <ClipboardCheck className={`w-5 h-5 ${isQuizPassed ? 'text-emerald-600' : 'text-blue-600'}`} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-gray-900">Evaluación</h3>
                    <p className="text-xs text-gray-500 mt-0.5 truncate" title={quiz?.title}>{quiz?.title}</p>
                  </div>
                </div>
                {isQuizPassed && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-semibold flex-shrink-0">
                    <CheckCircle className="w-3 h-3" />
                    Aprobado
                  </span>
                )}
              </div>

              {/* Action area */}
              {allContentsCompleted ? (
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={() => navigate(`/courses/${courseId}/quiz/${quiz.id}`)}
                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors ${
                      isQuizPassed
                        ? 'bg-gray-700 hover:bg-gray-800'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {isQuizPassed ? 'Repetir evaluación' : 'Comenzar evaluación'}
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  {isQuizPassed && !isLastUnit && (
                    <button
                      onClick={handleFinish}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                    >
                      Siguiente unidad
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {isQuizPassed && isLastUnit && (
                    <button
                      onClick={handleFinish}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                    >
                      Finalizar curso
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-100">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                  <p className="text-xs text-amber-700">
                    Completa el contenido de la unidad para desbloquear la evaluación.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <ScrollToTop scrollRef={scrollRef} />

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
