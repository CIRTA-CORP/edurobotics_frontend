/**
 * PrintCoursePage — printable view of a whole course (admin export to PDF).
 *
 * Renders every module → unit → lesson using the same sanitized rich-text
 * rendering students see, in a clean print layout. The "Descargar PDF" button
 * opens the browser print dialog (Save as PDF). Videos appear as links.
 */
import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Printer, ArrowLeft, Loader2 } from 'lucide-react'
import { getCourseDetail } from '@/features/courses/services/courses'
import { sanitizeHtml } from '@/shared/lib/sanitizeHtml'
import { API_BASE } from '@/config'

function ContentBlock({ content }) {
  const { content_type, content_value } = content
  if (!content_value) return null

  if (content_type === 'rich_text' || (content_type === 'text' && /<[a-z][\s\S]*>/i.test(content_value))) {
    return (
      <div
        className="rich-content prose prose-sm max-w-none break-words text-gray-800"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(content_value) }}
      />
    )
  }
  if (content_type === 'text') {
    return <p className="whitespace-pre-wrap text-gray-800">{content_value}</p>
  }
  if (content_type === 'video') {
    return <p className="text-sm text-blue-700">🎥 Video: {content_value}</p>
  }
  if (content_type === 'simulator') {
    return <p className="text-sm text-gray-600">🤖 Esta unidad incluye acceso al Simulador 3D.</p>
  }
  // image / file / resource
  const url = content_value.startsWith('http') ? content_value : `${API_BASE}${content_value}`
  if (content_type === 'image') {
    return <img src={url} alt="" className="max-w-full rounded-lg" />
  }
  return <p className="text-sm text-blue-700">📎 {url}</p>
}

function PrintCoursePage() {
  const { courseId } = useParams()
  const navigate = useNavigate()

  const { data: course, isLoading, error } = useQuery({
    queryKey: ['course-detail', Number(courseId)],
    queryFn: () => getCourseDetail(Number(courseId)),
    enabled: Number.isFinite(Number(courseId)),
    staleTime: 60_000,
  })

  // Make the browser's print header show the course title (not the marketing
  // <title>). Restored on unmount.
  useEffect(() => {
    if (!course?.title) return
    const prev = document.title
    document.title = `${course.title} — EduRobotics`
    return () => { document.title = prev }
  }, [course?.title])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }
  if (error || !course) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3">
        <p className="text-gray-600">No se pudo cargar el curso.</p>
        <button onClick={() => navigate(-1)} className="text-blue-600 hover:underline">Volver</button>
      </div>
    )
  }

  const modules = course.modules || []
  const totalUnits = modules.reduce((a, m) => a + (m.units?.length || 0), 0)
  const today = new Date().toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="min-h-screen bg-white">
      {/* Print tuning: margins + ensure colors/images print. */}
      <style>{`
        @page { margin: 18mm 16mm; }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      {/* Toolbar (hidden when printing) */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3 print:hidden">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800">
          <ArrowLeft className="h-4 w-4" /> Volver
        </button>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Printer className="h-4 w-4" /> Descargar PDF
        </button>
      </div>

      <p className="bg-blue-50 px-6 py-2 text-center text-xs text-blue-700 print:hidden">
        Se abrirá el diálogo de impresión → destino <strong>“Guardar como PDF”</strong>. Para un resultado más limpio,
        <strong> destilda “Encabezados y pies de página”</strong> en el diálogo.
      </p>

      {/* ── Cover page ── */}
      <section className="mx-auto flex min-h-[80vh] max-w-3xl flex-col justify-center px-10 py-16 break-after-page">
        <img src="/cirtanitido.svg" alt="CIRTA" className="mb-10 h-10 self-start" />
        <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">Material del curso</p>
        <h1 className="mt-3 text-5xl font-bold leading-tight text-gray-900">{course.title}</h1>
        {course.description && <p className="mt-4 max-w-xl text-lg text-gray-600">{course.description}</p>}
        <div className="mt-10 border-t border-gray-200 pt-5 text-sm text-gray-500">
          <p>{modules.length} módulos · {totalUnits} unidades</p>
          <p className="mt-1">EduRobotics · CIRTA · {today}</p>
        </div>
      </section>

      {/* ── Modules (each starts on a new page) ── */}
      <article className="mx-auto max-w-3xl px-10 pb-12">
        {modules.map((m, mi) => (
          <section key={m.id} className="break-before-page pt-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Módulo {mi + 1}</p>
            <h2 className="mb-1 mt-1 border-b border-gray-200 pb-3 text-3xl font-bold text-gray-900">
              {m.title}
            </h2>
            {m.description && <p className="mb-6 mt-3 text-gray-600">{m.description}</p>}

            {(m.units || []).map((u, ui) => (
              <div key={u.id} className="mb-8 break-inside-avoid">
                <h3 className="mb-2 text-xl font-semibold text-gray-800">
                  {mi + 1}.{ui + 1} {u.title}
                </h3>
                {u.description && <p className="mb-2 text-sm text-gray-500">{u.description}</p>}
                <div className="space-y-3 pl-1">
                  {(u.contents || [])
                    .slice()
                    .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
                    .map((c) => <ContentBlock key={c.id} content={c} />)}
                  {(u.contents || []).length === 0 && (
                    <p className="text-sm italic text-gray-400">Sin contenido.</p>
                  )}
                </div>
              </div>
            ))}
          </section>
        ))}
      </article>
    </div>
  )
}

export default PrintCoursePage
