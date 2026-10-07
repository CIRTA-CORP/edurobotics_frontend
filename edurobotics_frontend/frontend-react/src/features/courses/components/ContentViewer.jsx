/**
 * Content Viewer Component
 *
 * Renders a unit's content as a single, beautiful lesson page.
 * All content items flow together naturally: text as prose,
 * images centered inline, videos embedded, files as download cards.
 * Quiz section appears at the bottom.
 */

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import {
  FileText, FileDown,
  CheckCircle, ChevronRight, ExternalLink,
  ClipboardCheck, ChevronLeft, ArrowUp,
  ListTree, Cpu, Clock, Lock
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { CourseFeedbackModal } from './CourseFeedbackModal'
import { API_BASE } from '@/config'
import { sanitizeHtml } from '@/shared/lib/sanitizeHtml'
import { injectSimulatorButtons, readSimulatorBlock } from '@/features/courses/lib/simulatorBlocks'
import { sendHeartbeat } from '@/features/progress/services/progress'

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
  // Estable entre renders (ver `richHtml` en ContentViewer).
  const textHtml = useMemo(
    () => ({ __html: sanitizeHtml(content.content_value) }),
    [content.content_value]
  )

  if (content.content_type === 'video' && isVideoUrl(content.content_value)) {
    return (
      <div className="aspect-video bg-black rounded-xl overflow-hidden border border-gray-200">
        <iframe
          src={getYoutubeEmbedUrl(content.content_value)}
          className="w-full h-full"
          title="Video de la unidad"
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
          dangerouslySetInnerHTML={textHtml}
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
          className="max-w-full max-h-[500px] object-contain rounded-xl border border-gray-200"
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
        <div className="flex flex-col gap-2 w-full">
          {/* PDF header / download bar */}
          <div className="flex items-center justify-between gap-4 px-4 py-3 bg-white border border-gray-200 rounded-xl">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-[10px] bg-rose-50 flex items-center justify-center flex-shrink-0">
                <FileDown className="w-4 h-4 text-rose-500" />
              </div>
              <div className="min-w-0">
                <h3 className="text-[13.5px] font-semibold text-gray-800 truncate" title={fileName}>
                  {fileName}
                </h3>
                <p className="font-mono text-[10.5px] text-gray-400 mt-0.5">Documento PDF</p>
              </div>
            </div>
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 text-[12.5px] font-semibold text-gray-600 bg-white border border-gray-200 hover:border-gray-300 rounded-[9px] transition-colors"
              title="Descargar PDF"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Descargar</span>
            </a>
          </div>

          {/* PDF preview */}
          <div className="w-full bg-gray-50 rounded-xl border border-gray-200 overflow-hidden" style={{ height: '60vh', minHeight: '420px' }}>
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
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-[#16151b] hover:bg-[#2b2b26] rounded-xl transition-colors shadow-sm"
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
        className="flex items-center justify-between gap-4 px-4 py-3.5 rounded-xl border border-gray-200 bg-white hover:border-gray-300 transition-colors w-full"
      >
        <span className="flex items-center gap-3 min-w-0">
          <span className="w-9 h-9 rounded-[10px] bg-gray-100 grid place-items-center flex-shrink-0">
            <FileDown className="w-4 h-4 text-gray-500" />
          </span>
          <span className="min-w-0">
            <span className="block text-[13.5px] font-semibold text-gray-800 truncate">{fileName}</span>
            <span className="block font-mono text-[10.5px] text-gray-400 mt-0.5">{ext || 'Archivo'}</span>
          </span>
        </span>
        <span className="flex-shrink-0 text-[12.5px] font-semibold text-gray-600 px-3.5 py-1.5 rounded-[9px] border border-gray-200">
          Descargar
        </span>
      </a>
    )
  }

  // Resource / link
  return (
    <a
      href={content.content_value}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between gap-4 px-4 py-3.5 rounded-xl border border-gray-200 bg-white hover:border-gray-300 transition-colors"
    >
      <span className="flex items-center gap-3 min-w-0">
        <span className="w-9 h-9 rounded-[10px] bg-[#4b46d6]/[0.07] grid place-items-center flex-shrink-0">
          <ExternalLink className="w-4 h-4 text-[#4b46d6]" />
        </span>
        <span className="min-w-0">
          <span className="block text-[13.5px] font-semibold text-gray-800">Recurso externo</span>
          <span className="block font-mono text-[10.5px] text-gray-400 mt-0.5 truncate">{content.content_value}</span>
        </span>
      </span>
      <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
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
      // injectHeadingIds keeps an id the heading already has, so read it the same way.
      const id = el.getAttribute('id') || `heading-${i}`
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
 * Jump to a section of the lesson. Honours prefers-reduced-motion (no smooth
 * scroll) and moves focus to the heading, so the next Tab continues reading
 * from there instead of jumping back to the index.
 */
function goToHeading(id) {
  const el = document.getElementById(id)
  if (!el) return
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
  if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1')
  el.focus({ preventScroll: true })
}

/** Indentation for a heading relative to the shallowest one in the lesson. */
function headingIndent(level, minLevel) {
  const depth = level - minLevel
  return depth <= 0 ? 'pl-3' : depth === 1 ? 'pl-6' : 'pl-9'
}

/**
 * The section the reader is in: the last heading whose top has passed a line
 * near the top of the scrolling pane. Read from the rendered nodes — the HTML
 * itself is never rewritten for this.
 */
function useActiveHeading(scrollRef, ids) {
  const [activeId, setActiveId] = useState(null)
  const idsKey = ids.join('\n')

  useEffect(() => {
    const root = scrollRef?.current
    const list = idsKey ? idsKey.split('\n') : []
    if (!root || list.length < 2) return
    let frame = 0
    const update = () => {
      frame = 0
      const line = root.getBoundingClientRect().top + 96
      let current = list[0]
      for (const id of list) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top <= line) current = id
      }
      // A short last section can never reach the line: at the very bottom of a
      // pane that actually scrolls, it is the one being read.
      const scrolls = root.scrollHeight > root.clientHeight
      if (scrolls && root.scrollTop > 0 && root.scrollTop + root.clientHeight >= root.scrollHeight - 2) {
        current = list[list.length - 1]
      }
      setActiveId(current)
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    frame = requestAnimationFrame(update)
    root.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      root.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [scrollRef, idsKey])

  return activeId
}

/**
 * Inline section index — the fallback when the reading pane is too narrow for
 * the lateral rail (phones, tablets, or the index open on a mid-size screen).
 * Hidden by the same container query that shows the rail.
 */
function TableOfContents({ headings }) {
  if (headings.length < 2) return null
  const minLevel = Math.min(...headings.map(h => h.level))

  return (
    <nav
      aria-label="Secciones de la unidad"
      className="mb-8 px-5 py-4 bg-gray-50/80 rounded-xl border border-gray-100 @min-[960px]:hidden"
    >
      <div className="flex items-center gap-2 mb-3">
        <ListTree className="w-4 h-4 text-[#4b46d6]" aria-hidden="true" />
        <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">Contenido</span>
      </div>
      <ul className="space-y-1">
        {headings.map((h) => (
          <li key={h.id}>
            <button
              type="button"
              onClick={() => goToHeading(h.id)}
              className={`text-left w-full text-sm hover:text-[#4b46d6] transition-colors truncate ${
                headingIndent(h.level, minLevel)
              } ${h.level === minLevel ? 'font-semibold text-gray-800' : 'text-gray-600'}`}
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
 * Lateral section rail — sticky beside the reading column when the pane is
 * wide enough (canvas «Main»). Marks the section in view.
 */
function SectionRail({ headings, activeId }) {
  const minLevel = Math.min(...headings.map(h => h.level))

  return (
    <nav aria-label="Secciones de la unidad" className="text-[13px]">
      <div className="mb-3 pl-3 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">
        Contenido
      </div>
      <ul className="border-l border-gray-200">
        {headings.map((h) => {
          const isActive = h.id === activeId
          return (
            <li key={h.id}>
              <button
                type="button"
                onClick={() => goToHeading(h.id)}
                aria-current={isActive ? 'location' : undefined}
                className={`-ml-px block w-full border-l-2 py-1.5 pr-2 text-left leading-snug transition-colors ${
                  headingIndent(h.level, minLevel)
                } ${
                  isActive
                    ? 'border-[#4b46d6] font-medium text-[#4b46d6]'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-900'
                }`}
              >
                {h.text}
              </button>
            </li>
          )
        })}
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
      className="fixed bottom-6 right-6 z-40 w-10 h-10 bg-white border border-gray-200 rounded-full shadow-lg flex items-center justify-center text-gray-500 hover:text-[#4b46d6] hover:border-[#4b46d6]/30 transition-all animate-fade-in"
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
  //
  // Los botones «Probar en el simulador» van al revés: DESPUÉS de sanitizar, porque son
  // marcado nuestro y no del contenido (ver `simulatorBlocks.js`).
  const processedHtml = useMemo(
    () => injectSimulatorButtons(sanitizeHtml(injectHeadingIds(richContent?.content_value))),
    [richContent?.content_value]
  )
  // El mismo objeto mientras el HTML no cambie: React 19 compara `dangerouslySetInnerHTML`
  // por identidad, y con un objeto nuevo en cada render reinsertaba la lección entera en
  // cada cuadro de scroll (perdía el foco del índice y la selección del alumno).
  const richHtml = useMemo(() => ({ __html: processedHtml }), [processedHtml])

  // Un solo manejador para todos los botones del contenido, porque el HTML se pinta con
  // dangerouslySetInnerHTML y sus botones no pueden llevar el suyo.
  //
  // Da acceso al simulador igual que el bloque «Simulador 3D», y le pasa el código por el
  // estado de la navegación, no por la URL: un programa no cabe con comodidad en la URL,
  // quedaría en el historial y cualquiera podría fabricar un enlace con código ajeno.
  const handleRichContentClick = useCallback((event) => {
    const block = readSimulatorBlock(event.currentTarget, event.target)
    if (!block || !unit?.id) return
    sessionStorage.setItem('sim_access', '1')
    navigate('/simulator', {
      state: {
        lessonCode: { code: block.code, index: block.index, unitId: unit.id, unitTitle: unit.title },
      },
    })
  }, [navigate, unit?.id, unit?.title])
  const headings = useMemo(() => extractHeadings(richContent?.content_value), [richContent?.content_value])

  // Whether the rich editor actually has written content (an empty TipTap doc
  // serializes to '<p></p>'). Used to avoid rendering a blank white card.
  const hasRichBody = !!processedHtml && processedHtml !== '<p></p>'

  // Section rail: only with a written lesson and at least two headings.
  const showSectionRail = hasRichBody && headings.length >= 2
  const activeHeadingId = useActiveHeading(
    scrollRef,
    showSectionRail ? headings.map(h => h.id) : [],
  )

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

  const nextUnit = currentUnitIndex >= 0 ? allUnits?.[currentUnitIndex + 1] : null
  const nextModule = useMemo(
    () => (nextUnit ? modules?.find(m => m.units?.some(u => u.id === nextUnit.id)) : null),
    [modules, nextUnit],
  )
  const moduleIndex = modules?.findIndex(m => m.id === currentModule?.id) ?? -1

  // How many units of this module are still pending, counting the current one by
  // its live state so the button can offer to close the module on the last one.
  const pendingInModule = (currentModule?.units || []).filter(u => {
    if (u.id === unit?.id) return !allContentsCompleted
    const p = getUnitProgress?.(u.id)
    return !(p && p.total > 0 && p.percentage === 100)
  }).length

  // Estimated reading time: what the content declares, or a word-count estimate.
  const readingMinutes = useMemo(() => {
    const declared = contents.reduce((sum, c) => sum + (Number(c.duration_minutes) || 0), 0)
    if (declared > 0) return declared
    if (!hasRichBody) return null
    const words = processedHtml.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length
    return words > 0 ? Math.max(1, Math.round(words / 200)) : null
  }, [contents, hasRichBody, processedHtml])

  // "Video · Documento · Evaluación", or "Solo lectura" when there is none.
  const materialLabel = useMemo(() => {
    const labels = []
    const types = new Set(contents.map(c => c.content_type))
    if (types.has('video')) labels.push('Video')
    if (types.has('file')) labels.push('Documento')
    if (types.has('resource')) labels.push('Recurso')
    if (types.has('simulator')) labels.push('Simulador')
    if (hasQuiz) labels.push('Evaluación')
    return labels.length ? labels.join(' · ') : 'Solo lectura'
  }, [contents, hasQuiz])

  // Transition animation on unit change. Also scroll the content pane back to the
  // top for the new unit: doing it here (after the new unit renders) instead of in
  // the nav handlers means the content swap can't leave the reader stuck at the
  // bottom. Instant (not smooth) so you land at the top of the unit immediately.
  useEffect(() => {
    setVisible(false)
    scrollRef?.current?.scrollTo({ top: 0 })
    const timer = setTimeout(() => setVisible(true), 50)
    return () => clearTimeout(timer)
  }, [unit?.id, scrollRef])

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

  // Heartbeat: accrue real active time while the learner is on this unit and the
  // tab is visible. We credit a single content per tick (a unit's time is the sum
  // of its contents, so crediting one avoids multiplying by the block count) and
  // pause when the tab is hidden, so background tabs don't inflate the metric.
  const heartbeatContentId = contents[0]?.id
  useEffect(() => {
    if (!heartbeatContentId) return
    const HEARTBEAT_MS = 15_000
    const tick = () => {
      if (document.visibilityState === 'visible') {
        sendHeartbeat(heartbeatContentId, HEARTBEAT_MS / 1000).catch(() => {})
      }
    }
    const timer = setInterval(tick, HEARTBEAT_MS)
    return () => clearInterval(timer)
  }, [heartbeatContentId])

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

  // Demonstrated interaction completes the unit: passing the quiz is a stronger
  // signal than the "mark as read" click, so asking for it afterwards is just
  // paperwork. Guarded per unit so a slow write can't retrigger the loop.
  const autoCompletedUnitRef = useRef(null)
  useEffect(() => {
    if (!isQuizPassed || allContentsCompleted || contents.length === 0) return
    if (autoCompletedUnitRef.current === unit?.id) return
    autoCompletedUnitRef.current = unit?.id
    handleMarkAllComplete()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isQuizPassed, allContentsCompleted, unit?.id])

  // Scroll back to top is handled centrally by the unit-change effect above.
  const handleNextUnit = () => {
    if (currentUnitIndex !== -1 && currentUnitIndex < (allUnits?.length - 1)) {
      const nextUnit = allUnits[currentUnitIndex + 1]
      if (nextUnit && onUnitChange) onUnitChange(nextUnit.id)
    }
  }

  const handlePreviousUnit = () => {
    if (currentUnitIndex > 0) {
      const prevUnit = allUnits[currentUnitIndex - 1]
      if (prevUnit && onUnitChange) onUnitChange(prevUnit.id)
    }
  }

  const handleFinish = () => {
    if (isLastUnit) {
      setShowFeedbackModal(true)
    } else {
      handleNextUnit()
    }
  }

  // One primary action, five states. Order matters: closing the module wins over
  // the generic "mark as read", and opening the next module over "next unit".
  // Only this control moves the reader forward, so advancing always records.
  const primaryAction = (() => {
    if (!allContentsCompleted) {
      const closesModule = pendingInModule === 1 && moduleIndex >= 0
      return {
        label: closesModule ? `Completar módulo ${moduleIndex + 1}` : 'Marcar como leído',
        onClick: handleMarkAllComplete,
        leadingIcon: true,
      }
    }
    if (nextUnit && nextModule && nextModule.id !== currentModule?.id) {
      const nextModuleNumber = modules.findIndex(m => m.id === nextModule.id) + 1
      return { label: `Empezar módulo ${nextModuleNumber}`, onClick: handleNextUnit }
    }
    if (nextUnit) return { label: 'Siguiente unidad', onClick: handleNextUnit }
    return { label: 'Finalizar curso', onClick: handleFinish }
  })()

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
      {/* The reading column stays 704 px. When the pane (not the window: the
          index may be open or hidden) has room, the section rail takes a
          sticky column to its right; otherwise the inline index stands in. */}
      <div className="@container">
      <div className={showSectionRail
        ? '@min-[960px]:grid @min-[960px]:grid-cols-[minmax(0,704px)_13rem] @min-[960px]:justify-center @min-[960px]:gap-x-12'
        : undefined}>
      <div className={`max-w-[704px] mx-auto w-full space-y-5 transition-all duration-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
        {/* ── Breadcrumbs + status ── */}
        <div className="flex items-center justify-between px-1">
          <nav className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide font-mono text-gray-400 min-w-0">
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

        {/* ── Lesson title. Same typeface as the rest of the app: the redesign
             changes scale and structure, not the letter. ── */}
        <h1 className="px-1 text-3xl md:text-[2.6rem] font-bold tracking-tight leading-[1.1] text-gray-900">
          {unit.title}
        </h1>

        {/* ── Lesson meta: reading time · material ── */}
        <div className="px-1 flex items-center gap-3.5 text-[12.5px] text-gray-500">
          {readingMinutes && (
            <>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {readingMinutes} min de lectura
              </span>
              <span className="w-[3px] h-[3px] rounded-full bg-gray-300" aria-hidden="true" />
            </>
          )}
          <span>{materialLabel}</span>
        </div>

        <div className="mx-1 h-px bg-gray-200" />

        {/* ── Lesson content — de-boxed, flows on the page (no card) ── */}
        {(hasRichBody || legacyContents.length > 0) && (
          <div className="px-1 space-y-7">
            {/* Inline section index — only when the rail has no room */}
            {showSectionRail && <TableOfContents headings={headings} />}

            {/* Rich text content (new TipTap format) — single unified document */}
            {hasRichBody && (
              <div
                className="rich-content max-w-none w-full overflow-hidden break-words"
                onClick={handleRichContentClick}
                dangerouslySetInnerHTML={richHtml}
              />
            )}
            {/* Legacy content blocks (old multi-block format) */}
            {legacyContents.map((content) => (
              <ContentBlock key={content.id} content={content} />
            ))}
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

        {/* ── Simulator section (de-boxed, editorial) ── */}
        {simulatorContent && (
          <div className="flex items-start justify-between gap-5 flex-wrap rounded-xl bg-gray-950 p-6 text-white">
            <div className="flex items-start gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-[11px] bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0">
                <Cpu className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="text-[15px] font-semibold">Simulador 3D</h3>
                <p className="text-[13px] leading-relaxed text-white/60 mt-1">
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
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[11px] text-sm font-semibold text-gray-950 bg-white hover:bg-gray-100 transition-colors flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 focus-visible:ring-white"
            >
              Abrir simulador
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── Navigation (de-boxed, hairline top) ── */}
        <div className="flex items-center justify-between gap-3 border-t border-gray-200 pt-6 mt-2">
          {/* Previous unit */}
          <div className="flex-1">
            {!isFirstUnit && (
              <button
                onClick={handlePreviousUnit}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-800 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline truncate max-w-[140px]">
                  {allUnits[currentUnitIndex - 1]?.title || 'Anterior'}
                </span>
                <span className="sm:hidden">Anterior</span>
              </button>
            )}
          </div>

          {/* The only way forward — and the only one that records progress.
              Jumping to any other unit stays available from the index. */}
          <button
            onClick={primaryAction.onClick}
            disabled={navigating}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gray-900 hover:bg-gray-800 disabled:opacity-60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-900"
          >
            {navigating ? 'Guardando…' : (
              <>
                {primaryAction.leadingIcon && <CheckCircle className="w-4 h-4" />}
                {primaryAction.label}
                {!primaryAction.leadingIcon && <ChevronRight className="w-4 h-4" />}
              </>
            )}
          </button>

          {/* Balances the previous-unit link so the button stays centred. */}
          <div className="flex-1" aria-hidden="true" />
        </div>

        {/* Announced to screen readers when the unit becomes complete. */}
        <p className="sr-only" role="status" aria-live="polite">
          {allContentsCompleted ? 'Unidad completada' : ''}
        </p>

        {/* ── Quiz section ── */}
        {hasQuiz && (
          <div className={`rounded-xl border ${
            isQuizPassed ? 'bg-emerald-50/40 border-emerald-200' : 'bg-white border-gray-200'
          }`}>
            <div className="p-5 md:p-6">
              {/* Header row */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isQuizPassed ? 'bg-emerald-100' : 'bg-[#4b46d6]/[0.07]'
                  }`}>
                    <ClipboardCheck className={`w-5 h-5 ${isQuizPassed ? 'text-emerald-600' : 'text-[#4b46d6]'}`} />
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

              {/* Action area. Moving on afterwards is the footer's job — this
                  card only opens the assessment. */}
              {allContentsCompleted ? (
                <button
                  onClick={() => navigate(`/courses/${courseId}/quiz/${quiz.id}`)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-gray-900 hover:bg-gray-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-900"
                >
                  {isQuizPassed ? 'Repetir evaluación' : 'Comenzar evaluación'}
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg bg-gray-50 border border-gray-200">
                  <Lock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <p className="text-xs text-gray-600">
                    Bloqueada — completa el contenido de la unidad para abrir la evaluación.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showSectionRail && (
        <aside className="hidden @min-[960px]:block">
          <div className="sticky top-6 max-h-[calc(100dvh-8rem)] overflow-y-auto pb-2">
            <SectionRail headings={headings} activeId={activeHeadingId} />
          </div>
        </aside>
      )}
      </div>
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
