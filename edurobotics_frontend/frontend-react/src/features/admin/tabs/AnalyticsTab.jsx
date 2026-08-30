/**
 * AnalyticsTab — "Seguimiento" admin (#25): progress, interaction, performance
 * and content metrics for a course, computed on-demand by /api/analytics.
 *
 * Honesty rules (from the change spec):
 *  - every card shows "datos insuficientes" when the aggregate rests on n < 3
 *    students — never a 1-person average dressed as a trend;
 *  - per-question metrics disclose when data collection started;
 *  - "sin actividad reciente" = enrolled, not completed, no signal in 14 days
 *    (threshold explained in a tooltip).
 */
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart3, Loader2, Users, ClipboardCheck, Timer, AlertTriangle, MousePointerClick, Award, FileText, Info } from 'lucide-react'
import { useAdmin } from '@/features/admin/context/AdminContext'
import {
  getCourseProgressAnalytics,
  getInteractionAnalytics,
  getCoursePerformanceAnalytics,
  getCourseContentAnalytics,
} from '@/features/admin/services/analytics'

const fmtPct = (value) => (value == null ? '—' : `${value}%`)

const fmtDuration = (seconds) => {
  if (seconds == null) return '—'
  if (seconds < 60) return `${Math.round(seconds)} s`
  if (seconds < 3600) return `${Math.round(seconds / 60)} min`
  return `${(seconds / 3600).toFixed(1)} h`
}

const fmtDate = (iso) => {
  if (!iso) return null
  try {
    return new Date(iso).toLocaleDateString('es-CL', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return null
  }
}

const fmtHours = (h) => (h == null ? '—' : h < 24 ? `${h} h` : `${(h / 24).toFixed(1)} días`)

function Card({ icon, label, value, sub }) {
  const Icon = icon
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold text-gray-900">{value}</div>
      {sub && <div className="text-xs text-gray-400">{sub}</div>}
    </div>
  )
}

function InsufficientData({ note }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-[#b45309]/25 bg-[#fffbeb] px-3 py-2 text-xs text-[#b45309]">
      <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
      <span>
        Datos insuficientes: este curso tiene menos de 3 alumnos con señal, así que no mostramos
        promedios (serían números de una sola persona).{note ? ` ${note}` : ''}
      </span>
    </div>
  )
}

function SectionTitle({ icon, children }) {
  const Icon = icon
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-gray-700" />
      <h4 className="text-sm font-semibold text-gray-900">{children}</h4>
    </div>
  )
}

function ProgressSection({ courseId }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['analytics-progress', courseId],
    queryFn: () => getCourseProgressAnalytics(courseId),
    enabled: !!courseId,
    staleTime: 30_000,
  })

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></div>
  if (isError || !data?.success) return <p className="text-sm text-gray-400">No se pudo cargar el progreso.</p>

  const insufficient = data.insufficient_data
  const steps = data.funnel?.steps || []
  const dropIndex = data.funnel?.biggest_drop_index
  const courseTime = data.time_metrics?.course || {}

  return (
    <div className="space-y-3">
      {insufficient && <InsufficientData />}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card icon={Users} label="Inscritos" value={insufficient ? '…' : data.enrolled} />
        <Card icon={ClipboardCheck} label="Completaron" value={insufficient ? '…' : data.completed} />
        <Card icon={Award} label="Finalización" value={insufficient ? '…' : fmtPct(data.completion_rate)} />
        <Card
          icon={Timer}
          label="Tiempo activo (mediana)"
          value={insufficient ? '…' : courseTime.median_minutes != null ? `${courseTime.median_minutes} min` : '—'}
        />
      </div>

      {/* Dropout funnel — bar per content in course order */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
          Embudo de contenidos (% de inscritos que completó cada uno)
        </p>
        {steps.length === 0 ? (
          <p className="text-sm text-gray-400">Este curso aún no tiene contenidos.</p>
        ) : (
          <div className="space-y-2">
            {steps.map((step, i) => {
              const afterDrop = dropIndex != null && i === dropIndex + 1
              return (
                <div key={step.content_id}>
                  <div className="mb-0.5 flex items-center justify-between text-xs">
                    <span className="flex min-w-0 items-center gap-2 pr-2">
                      <span className={`truncate ${afterDrop ? 'font-semibold text-[#b45309]' : 'text-[#55545f]'}`} title={step.title}>
                        {step.title}
                      </span>
                      {/* El color nunca va solo: el estado se dice. */}
                      {afterDrop && (
                        <span className="flex-shrink-0 rounded-full bg-[#b45309]/[0.12] px-2 py-0.5 text-[10px] font-semibold text-[#b45309]">
                          Mayor caída
                        </span>
                      )}
                    </span>
                    <span className={`flex-shrink-0 font-mono tabular-nums ${afterDrop ? 'font-semibold text-[#b45309]' : 'text-[#a9a8b4]'}`}>
                      {insufficient ? '…' : step.pct == null ? '—' : `${step.pct}% · ${step.completed}`}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={`h-full rounded-full ${afterDrop ? 'bg-[#b45309]' : 'bg-[#4b46d6]'}`}
                      style={{ width: `${insufficient ? 0 : Math.max(step.pct || 0, 3)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* At-risk learners — 14-day inactivity, single definition */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Sin actividad reciente</p>
          <span
            className="flex cursor-help items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500"
            title={`Inscritos que no han completado el curso y no registran ninguna señal (clase, quiz o inicio de sesión) en ${data.inactivity_days ?? 14} días. Umbral de piloto, no una verdad científica.`}
          >
            <Info className="h-3 w-3" />
            {data.inactivity_days ?? 14} días
          </span>
        </div>
        {(data.at_risk || []).length === 0 ? (
          <p className="mt-2 text-sm text-gray-400">Nadie está sin actividad reciente.</p>
        ) : (
          <ul className="mt-2 space-y-1">
            {data.at_risk.map((r) => (
              <li key={r.user_id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
                <span className="flex items-center gap-2 text-gray-700">
                  <AlertTriangle className="h-3.5 w-3.5 text-[#b45309]" />
                  {r.name || `Usuario ${r.user_id}`}
                </span>
                <span className="text-xs text-gray-400">{r.last_activity ? `última: ${fmtDate(r.last_activity)}` : 'sin señal'}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function InteractionSection() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['analytics-interaction'],
    queryFn: getInteractionAnalytics,
    staleTime: 30_000,
  })

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></div>
  if (isError || !data?.success) return <p className="text-sm text-gray-400">No se pudo cargar la interacción.</p>

  const insufficient = data.insufficient_data
  const value = (metric) => (insufficient ? '…' : metric?.avg != null ? String(metric.avg) : '—')

  return (
    <div className="space-y-3">
      {insufficient && <InsufficientData note="Mismo umbral en toda la plataforma." />}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Card icon={MousePointerClick} label="Días activos / semana" value={value(data.active_days_per_week)} sub="promedio, últimos 28 días" />
        <Card icon={Timer} label="Tiempo entre sesiones" value={insufficient ? '…' : fmtHours(data.time_between_sessions_hours?.avg)} sub="promedio entre inicios de sesión" />
        <Card icon={FileText} label="Avance por login" value={value(data.progress_per_login)} sub="contenidos completados entre logins" />
      </div>
      <p className="text-[11px] text-gray-400">
        Aproximación honesta: una "sesión" equivale a un inicio de sesión (si alguien deja la pestaña
        abierta días, cuenta como una sola). La sesionización real por heartbeats queda diferida.
      </p>
    </div>
  )
}

function PerformanceSection({ courseId }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['analytics-performance', courseId],
    queryFn: () => getCoursePerformanceAnalytics(courseId),
    enabled: !!courseId,
    staleTime: 30_000,
  })

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></div>
  if (isError || !data?.success) return <p className="text-sm text-gray-400">No se pudo cargar el rendimiento.</p>

  const insufficient = data.insufficient_data
  const quizzes = data.quizzes || []
  const questions = data.top_failed_questions || []

  return (
    <div className="space-y-3">
      {insufficient && <InsufficientData />}
      {quizzes.length === 0 ? (
        <p className="text-sm text-gray-400">Este curso aún no tiene evaluaciones.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                  <th className="px-4 py-3">Evaluación</th>
                  <th className="px-4 py-3 text-center">Intentos</th>
                  <th className="px-4 py-3 text-center">Promedio</th>
                  <th className="px-4 py-3 text-center">Aprobación</th>
                  <th className="px-4 py-3 text-center">Intentos hasta aprobar</th>
                </tr>
              </thead>
              <tbody>
                {quizzes.map((q) => (
                  <tr key={q.quiz_id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60">
                    <td className="px-4 py-3 font-medium text-gray-800">{q.title}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{insufficient ? '…' : q.attempts}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{insufficient ? '…' : q.avg_score ?? '—'}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{insufficient ? '…' : fmtPct(q.pass_rate)}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{insufficient ? '…' : q.attempts_until_pass ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {questions.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Preguntas más falladas</p>
          {data.per_question_data_start && (
            <p className="mb-2 text-[11px] text-gray-400">
              Solo se registran respuestas desde {fmtDate(data.per_question_data_start)} (fecha en que empezó la recolección).
            </p>
          )}
          <ul className="space-y-2">
            {questions.map((q) => (
              <li key={q.question_id} className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 px-3 py-2">
                <span className="truncate text-sm text-gray-700" title={q.question_text}>{q.question_text}</span>
                <span className="flex-shrink-0 rounded-full bg-[#b45309]/[0.12] px-2 py-0.5 font-mono text-xs font-semibold tabular-nums text-[#b45309]">
                  {insufficient ? '…' : `${q.error_rate}% error`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function ContentSection({ courseId }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['analytics-content', courseId],
    queryFn: () => getCourseContentAnalytics(courseId),
    enabled: !!courseId,
    staleTime: 30_000,
  })

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></div>
  if (isError || !data?.success) return <p className="text-sm text-gray-400">No se pudo cargar el contenido.</p>

  const insufficient = data.insufficient_data
  const top = (data.by_active_time || []).slice(0, 10)

  return (
    <div className="space-y-3">
      {insufficient && <InsufficientData />}
      {top.length === 0 ? (
        <p className="text-sm text-gray-400">Aún no hay actividad sobre los contenidos.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                  <th className="px-4 py-3">Contenido</th>
                  <th className="px-4 py-3 text-center">Abrieron</th>
                  <th className="px-4 py-3 text-center">Completaron</th>
                  <th className="px-4 py-3 text-center">Ratio</th>
                  <th className="px-4 py-3 text-right">Tiempo activo</th>
                </tr>
              </thead>
              <tbody>
                {top.map((c) => (
                  <tr key={c.content_id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60">
                    <td className="max-w-[220px] truncate px-4 py-3 font-medium text-gray-800" title={c.title}>{c.title}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{insufficient ? '…' : c.opened}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{insufficient ? '…' : c.completed}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{insufficient ? '…' : fmtPct(c.completion_ratio)}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{insufficient ? '…' : fmtDuration(c.active_seconds)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export function AnalyticsTab() {
  const { courses, selectedCourseId, setSelectedCourseId, isTeacher } = useAdmin()
  const [localCourseId, setLocalCourseId] = useState(selectedCourseId)

  const courseId = localCourseId ?? selectedCourseId ?? courses?.[0]?.id ?? null
  const current = courses?.find((c) => c.id === courseId)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <BarChart3 className="h-5 w-5 text-gray-700" />
        <h2 className="text-[24px] font-bold tracking-[-0.012em] text-[#16151b]">Analítica</h2>
        <select
          value={courseId ?? ''}
          onChange={(e) => {
            const id = e.target.value ? parseInt(e.target.value) : null
            setLocalCourseId(id)
            setSelectedCourseId(id)
          }}
          className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4b46d6]"
          aria-label="Curso a analizar"
        >
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
        {!courseId && <span className="text-sm text-gray-400">Selecciona un curso para ver sus métricas.</span>}
      </div>

      {courseId ? (
        <div className="space-y-6">
          <div>
            <div className="mb-2"><SectionTitle icon={BarChart3}>Progreso · {current?.title ?? ''}</SectionTitle></div>
            <ProgressSection courseId={courseId} />
          </div>
          <div>
            <div className="mb-2"><SectionTitle icon={Award}>Rendimiento</SectionTitle></div>
            <PerformanceSection courseId={courseId} />
          </div>
          <div>
            <div className="mb-2"><SectionTitle icon={FileText}>Contenidos</SectionTitle></div>
            <ContentSection courseId={courseId} />
          </div>
          {/* The interaction summary is platform-wide (LoginEvent) → admin-only. */}
          {!isTeacher && (
            <div>
              <div className="mb-2"><SectionTitle icon={MousePointerClick}>Interacción (toda la plataforma)</SectionTitle></div>
              <InteractionSection />
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-400">Aún no hay cursos para analizar.</p>
      )}
    </div>
  )
}

export default AnalyticsTab
