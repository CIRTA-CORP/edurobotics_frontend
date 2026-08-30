/**
 * AnalyticsTab — the consolidated analytics screen (canvas AdminAnalitica, §8.5).
 *
 * One screen, ordered by question, combining what used to live in Dashboard, the
 * Cursos metrics/feedback tabs and the old three-section analytics:
 *   1. figure cards → 2. sessions per day → 3. dedication + who opens/finishes
 *   → 4. quiz performance + most-failed questions → 5. inactivity + feedback.
 *
 * Honesty rules (from learning-analytics): aggregates under 3 students read
 * "datos insuficientes"; per-question metrics disclose their data start date;
 * green/amber only as state and always labelled.
 *
 * Admin sees the platform-wide chart (sessions per day) and the course feedback;
 * a teacher sees the same screen scoped to their own courses without those two.
 */
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, BarChart3, Clock, Info } from 'lucide-react'
import { useAdmin } from '@/features/admin/context/AdminContext'
import { getCourseFeedbackSummary } from '@/features/courses/services/courses'
import {
  getCourseProgressAnalytics,
  getCoursePerformanceAnalytics,
  getCourseContentAnalytics,
  getDailySessions,
  getInteractionAnalytics,
} from '@/features/admin/services/analytics'

const fmtPct = (value) => (value == null ? '—' : `${Math.round(value)}%`)

const fmtHours = (seconds) => {
  if (seconds == null) return '—'
  if (seconds < 3600) return `${Math.round(seconds / 60)} min`
  return `${Math.round(seconds / 3600)} h`
}

const fmtMin = (minutes) => (minutes == null ? '—' : `${Math.round(minutes)} min`)

const fmtDate = (iso) => {
  if (!iso) return null
  try {
    return new Date(iso).toLocaleDateString('es-CL', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return null
  }
}

const daysAgo = (iso) => {
  if (!iso) return null
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.max(0, Math.floor(diff / 86400000))
  if (days === 0) return 'hoy'
  if (days === 1) return 'hace 1 día'
  return `hace ${days} días`
}

const SERIF = { fontFamily: "'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif" }

function SectionLabel({ children }) {
  return <span className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-[#a9a8b4]">{children}</span>
}

function CardTitle({ children }) {
  return <h3 className="mt-2 text-[16px] font-semibold text-[#16151b]">{children}</h3>
}

function Card({ children, className = '' }) {
  return <div className={`rounded-[14px] border border-[#e9e9ee] bg-white p-[22px] ${className}`}>{children}</div>
}

function InsufficientBanner() {
  return (
    <div className="flex items-start gap-2 rounded-[10px] border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[12px] text-amber-700">
      <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
      <span>Datos insuficientes: menos de 3 alumnos con señal, así que no mostramos promedios.</span>
    </div>
  )
}

/** Horizontal bar row: label + bar + mono value (+ optional sub value). */
function BarRow({ label, widthPct, value, sub, barClass = 'bg-[#4b46d6]' }) {
  return (
    <div className="flex items-center gap-3.5">
      <span className="w-[190px] flex-shrink-0 truncate text-[13px] text-[#33323b]">{label}</span>
      <span className="h-[9px] flex-1 overflow-hidden rounded-[4px] bg-[#f2f1f6]">
        <span className={`block h-full rounded-[4px] ${barClass}`} style={{ width: `${Math.max(0, Math.min(100, widthPct))}%` }} />
      </span>
      {value !== undefined && <span className="w-[52px] flex-shrink-0 font-mono text-[12px] font-semibold text-[#16151b]">{value}</span>}
      {sub !== undefined && <span className="flex-shrink-0 font-mono text-[10.5px] text-[#a9a8b4]">{sub}</span>}
    </div>
  )
}

function StatCard({ label, value, unit, sub }) {
  return (
    <Card className="p-[18px_20px]">
      <SectionLabel>{label}</SectionLabel>
      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="font-mono text-[30px] font-bold leading-none tracking-[-0.025em]">{value}</span>
        {unit && <span className="text-[13px] text-[#8b8a95]">{unit}</span>}
      </div>
      {sub && <div className="mt-2.5 text-[12px] text-[#a9a8b4]">{sub}</div>}
    </Card>
  )
}

export function AnalyticsTab() {
  const { courses, selectedCourseId, setSelectedCourseId, isTeacher } = useAdmin()
  const [localCourseId, setLocalCourseId] = useState(selectedCourseId)
  const [periodDays, setPeriodDays] = useState(14)

  const courseId = localCourseId ?? selectedCourseId ?? courses?.[0]?.id ?? null

  const progressQ = useQuery({
    queryKey: ['analytics-progress', courseId],
    queryFn: () => getCourseProgressAnalytics(courseId),
    enabled: !!courseId,
    staleTime: 30_000,
  })
  const performanceQ = useQuery({
    queryKey: ['analytics-performance', courseId],
    queryFn: () => getCoursePerformanceAnalytics(courseId),
    enabled: !!courseId,
    staleTime: 30_000,
  })
  const contentQ = useQuery({
    queryKey: ['analytics-content', courseId],
    queryFn: () => getCourseContentAnalytics(courseId),
    enabled: !!courseId,
    staleTime: 30_000,
  })
  const sessionsQ = useQuery({
    queryKey: ['analytics-sessions-daily', periodDays],
    queryFn: () => getDailySessions(periodDays),
    enabled: !isTeacher,
    staleTime: 30_000,
  })
  // Días activos, tiempo entre sesiones y avance por login: existían en la
  // pantalla anterior y la consolidación los había dejado fuera.
  const interactionQ = useQuery({
    queryKey: ['analytics-interaction'],
    queryFn: getInteractionAnalytics,
    enabled: !isTeacher,
    staleTime: 30_000,
  })
  const feedbackQ = useQuery({
    queryKey: ['course-feedback-summary', courseId],
    queryFn: () => getCourseFeedbackSummary(courseId),
    enabled: !isTeacher && !!courseId,
    staleTime: 30_000,
  })

  const progress = progressQ.data?.success ? progressQ.data : null
  const performance = performanceQ.data?.success ? performanceQ.data : null
  const content = contentQ.data?.success ? contentQ.data : null
  const sessions = sessionsQ.data?.success ? sessionsQ.data : null
  const feedback = feedbackQ.data?.success ? feedbackQ.data : null
  const interaction = interactionQ.data?.success ? interactionQ.data : null

  const insufficient =
    (progress?.insufficient_data ?? false) ||
    (performance?.insufficient_data ?? false) ||
    (content?.insufficient_data ?? false)

  // ── 1. Figure cards (course-scoped, honest about missing data) ──
  const courseTime = progress?.time_metrics?.course || {}
  const totalActiveSeconds = (content?.by_active_time || []).reduce((acc, c) => acc + (c.active_seconds || 0), 0)
  const totalCompleted = (content?.by_active_time || []).reduce((acc, c) => acc + (c.completed || 0), 0)
  const totalOpened = (content?.by_active_time || []).reduce((acc, c) => acc + (c.opened || 0), 0)
  const avgQuizScore = performance?.quizzes?.length
    ? performance.quizzes.reduce((acc, q) => acc + (q.avg_score || 0), 0) / performance.quizzes.length
    : null

  const withValue = (v) => (insufficient ? '…' : v ?? '—')

  // ── 2. Sessions per day chart (platform-wide, admin only) ──
  const series = sessions?.series || []
  const maxCount = Math.max(1, ...series.map((s) => s.count))
  const DAY_LETTERS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

  // ── 3. Dedication: time per module with min–max range ──
  const modules = progress?.time_metrics?.modules || []
  const maxModuleMedian = Math.max(1, ...modules.map((m) => m.median_minutes || 0))
  const topContents = (content?.by_openers || []).slice(0, 5)

  // ── 4. Performance ──
  const quizzes = performance?.quizzes || []
  const failedQuestions = performance?.top_failed_questions || []

  // ── 5. Inactivity + feedback ──
  const atRisk = progress?.at_risk || []
  const feedbackCount = feedback?.total
  const usefulness = feedback?.avg_usefulness
  const difficulty = feedback?.avg_difficulty

  return (
    <div className="space-y-5">
      {/* Header: título + selector de curso + período */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <SectionLabel>Panel</SectionLabel>
          <h1 className="mt-2 text-[28px] font-bold leading-[1.16] tracking-[-0.014em] text-[#16151b]" style={SERIF}>
            Analítica
          </h1>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#a9a8b4]"><path d="M6 9l6 6 6-6" /></svg>
            </span>
            <select
              value={courseId ?? ''}
              onChange={(e) => {
                const id = e.target.value ? parseInt(e.target.value) : null
                setLocalCourseId(id)
                setSelectedCourseId(id)
              }}
              aria-label="Curso a analizar"
              className="h-10 cursor-pointer appearance-none rounded-[10px] border border-[#e3e2ea] bg-white pl-3.5 pr-9 text-[12.5px] font-semibold text-[#55545f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4b46d6]"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>
          {!isTeacher && (
            <div className="flex items-center gap-[3px] rounded-[10px] bg-[#f4f3f8] p-[3px]">
              {[7, 14, 90].map((d) => (
                <button
                  key={d}
                  onClick={() => setPeriodDays(d)}
                  className={`h-8 rounded-lg px-3 text-[12.5px] font-semibold transition-colors ${
                    periodDays === d
                      ? 'bg-white text-[#16151b] shadow-[0_1px_3px_rgba(22,21,27,0.09)]'
                      : 'text-[#8b8a95] hover:text-[#16151b]'
                  }`}
                >
                  {d} días
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {insufficient && <InsufficientBanner />}

      {/* 1 ── Figure cards */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard
          label="Alumnos activos"
          value={withValue(courseTime.learners ?? 0)}
          unit={!insufficient && progress?.enrolled ? `de ${progress.enrolled}` : undefined}
          sub={insufficient ? undefined : 'con actividad en el curso'}
        />
        <StatCard
          label="Tiempo activo"
          value={withValue(fmtHours(totalActiveSeconds))}
          sub={insufficient ? undefined : 'suma del tiempo real en el curso'}
        />
        <StatCard
          label="Contenidos completados"
          value={withValue(totalCompleted)}
          sub={insufficient || totalOpened === 0 ? undefined : `${Math.round((totalCompleted / totalOpened) * 100)} % de los que se abrieron`}
        />
        <StatCard
          label="Aprobación media"
          value={withValue(avgQuizScore != null ? Math.round(avgQuizScore) : '—')}
          unit={!insufficient && avgQuizScore != null ? '%' : undefined}
          sub={insufficient ? undefined : `${quizzes.length} evaluación${quizzes.length === 1 ? '' : 'es'}`}
        />
      </div>

      {/* 2 ── Sesiones por día (toda la plataforma · admin) */}
      {!isTeacher && (
        <Card>
          <div className="flex items-baseline justify-between gap-5">
            <div>
              <SectionLabel>Interacción</SectionLabel>
              <CardTitle>Sesiones por día</CardTitle>
            </div>
            <span className="text-[12.5px] text-[#8b8a95]">Toda la plataforma · últimos {periodDays} días</span>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-4 border-b border-[#f2f1f6] pb-5 sm:grid-cols-3">
            {[
              // El backend devuelve {avg, median} en los tres: se toma el promedio.
              {
                label: 'Días activos / semana',
                value: interaction?.insufficient_data
                  ? '…'
                  : (interaction?.active_days_per_week?.avg ?? '—'),
                sub: 'promedio, últimos 28 días',
              },
              {
                label: 'Tiempo entre sesiones',
                value: interaction?.insufficient_data
                  ? '…'
                  : fmtHours(
                      interaction?.time_between_sessions_hours?.avg != null
                        ? interaction.time_between_sessions_hours.avg * 3600
                        : null
                    ),
                sub: 'promedio entre inicios de sesión',
              },
              {
                label: 'Avance por login',
                value: interaction?.insufficient_data
                  ? '…'
                  : (interaction?.progress_per_login?.avg ?? '—'),
                sub: 'contenidos completados entre logins',
              },
            ].map((m) => (
              <div key={m.label}>
                <SectionLabel>{m.label}</SectionLabel>
                <div className="mt-2 font-mono text-[22px] font-bold leading-none tracking-[-0.02em] text-[#16151b]">
                  {m.value}
                </div>
                <div className="mt-1.5 text-[11.5px] text-[#a9a8b4]">{m.sub}</div>
              </div>
            ))}
          </div>

          <div className="mt-5 flex h-[140px] items-end gap-1.5">
            {series.map((s) => {
              const d = new Date(s.date)
              const label = periodDays <= 7 ? DAY_LETTERS[d.getDay() === 0 ? 6 : d.getDay() - 1] : `${d.getDate()}`
              return (
                <div key={s.date} className="flex flex-1 flex-col items-center gap-1.5" title={`${s.date} · ${s.count} sesiones`}>
                  <span className="font-mono text-[9.5px] text-[#c4c3cd]">{s.count > 0 ? s.count : ''}</span>
                  <div className="flex w-full flex-1 items-end">
                    <div
                      className="w-full rounded-[4px] bg-[#7d79e3]"
                      style={{ height: `${Math.max(2, (s.count / maxCount) * 100)}%` }}
                    />
                  </div>
                  <span className="font-mono text-[10px] text-[#b3b2be]">{label}</span>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* 3 ── Dedicación + Contenidos */}
      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-2">
        <Card>
          <SectionLabel>Dedicación</SectionLabel>
          <CardTitle>Tiempo por módulo</CardTitle>
          <p className="mt-2 text-[12.5px] text-[#8b8a95]">Mediana del tiempo activo; a la derecha el rango mín – máx.</p>
          <div className="mt-4 flex flex-col gap-3.5">
            {modules.length === 0 && <p className="text-[13px] text-[#a9a8b4]">Sin actividad por módulo todavía.</p>}
            {modules.map((m, i) => (
              <BarRow
                key={m.id}
                label={`${i + 1} · ${m.title}`}
                widthPct={insufficient ? 0 : ((m.median_minutes || 0) / maxModuleMedian) * 100}
                value={insufficient ? '…' : fmtMin(m.median_minutes)}
                sub={insufficient || m.min_minutes == null ? undefined : `${Math.round(m.min_minutes)} – ${Math.round(m.max_minutes)} min`}
              />
            ))}
          </div>
        </Card>

        <Card>
          <SectionLabel>Contenidos</SectionLabel>
          <CardTitle>Quién abre y quién termina</CardTitle>
          <p className="mt-2 text-[12.5px] text-[#8b8a95]">Proporción de quienes lo abrieron y llegaron a completarlo.</p>
          <div className="mt-4 flex flex-col gap-3.5">
            {topContents.length === 0 && <p className="text-[13px] text-[#a9a8b4]">Aún no hay actividad sobre los contenidos.</p>}
            {topContents.map((c) => (
              <BarRow
                key={c.content_id}
                label={c.title}
                widthPct={insufficient ? 0 : c.completion_ratio || 0}
                value={insufficient ? '…' : fmtPct(c.completion_ratio)}
                sub={insufficient ? undefined : `${c.completed} de ${c.opened}`}
              />
            ))}
          </div>
        </Card>
      </div>

      {/* 4 ── Rendimiento + Preguntas más falladas */}
      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-2">
        <Card>
          <SectionLabel>Evaluaciones</SectionLabel>
          <CardTitle>Rendimiento</CardTitle>
          {quizzes.length === 0 ? (
            <p className="mt-3 text-[13px] text-[#a9a8b4]">Este curso aún no tiene evaluaciones.</p>
          ) : (
            <table className="mt-3.5 w-full border-collapse">
              <thead>
                <tr>
                  <th className="pb-2.5 pr-3 text-left font-mono text-[9.5px] font-semibold uppercase tracking-[0.12em] text-[#a9a8b4]">Evaluación</th>
                  <th className="pb-2.5 pr-3 text-right font-mono text-[9.5px] font-semibold uppercase tracking-[0.12em] text-[#a9a8b4]">Intentos</th>
                  <th className="pb-2.5 pr-3 text-right font-mono text-[9.5px] font-semibold uppercase tracking-[0.12em] text-[#a9a8b4]">Promedio</th>
                  <th className="pb-2.5 pr-3 text-right font-mono text-[9.5px] font-semibold uppercase tracking-[0.12em] text-[#a9a8b4]">Aprobación</th>
                  <th className="pb-2.5 text-right font-mono text-[9.5px] font-semibold uppercase tracking-[0.12em] text-[#a9a8b4]">Hasta aprobar</th>
                </tr>
              </thead>
              <tbody>
                {quizzes.map((q) => {
                  const healthy = (q.pass_rate ?? 0) >= 80
                  return (
                    <tr key={q.quiz_id} className="border-t border-[#f2f1f6]">
                      <td className="py-3 pr-3 text-[13.5px] font-semibold text-[#16151b]">{q.title}</td>
                      <td className="py-3 pr-3 text-right font-mono text-[13.5px]">{insufficient ? '…' : q.attempts}</td>
                      <td className="py-3 pr-3 text-right font-mono text-[13.5px]">{insufficient ? '…' : fmtPct(q.avg_score)}</td>
                      <td className="py-3 pr-3 text-right">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="font-mono text-[13.5px] font-semibold">{insufficient ? '…' : fmtPct(q.pass_rate)}</span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              healthy ? 'bg-[#ecfdf5] text-[#047857]' : 'bg-[#fffbeb] text-[#b45309]'
                            }`}
                          >
                            {healthy ? 'Sano' : 'Revisar'}
                          </span>
                        </span>
                      </td>
                      <td className="py-3 text-right font-mono text-[13.5px]">{insufficient ? '…' : q.attempts_until_pass ?? '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </Card>

        <Card>
          <SectionLabel>Evaluaciones</SectionLabel>
          <CardTitle>Preguntas más falladas</CardTitle>
          <p className="mt-2 text-[12.5px] text-[#8b8a95]">Porcentaje de respuestas incorrectas.</p>
          {performance?.per_question_data_start && (
            <p className="mt-1.5 text-[11px] text-[#a9a8b4]">Desde {fmtDate(performance.per_question_data_start)} (inicio de la recolección).</p>
          )}
          <div className="mt-4 flex flex-col gap-3.5">
            {failedQuestions.length === 0 && <p className="text-[13px] text-[#a9a8b4]">Aún sin intentos registrados.</p>}
            {failedQuestions.map((q) => (
              <BarRow
                key={q.question_id}
                label={q.question_text}
                widthPct={insufficient ? 0 : q.error_rate || 0}
                value={insufficient ? '…' : `${Math.round(q.error_rate)}%`}
              />
            ))}
          </div>
        </Card>
      </div>

      {/* 5 ── Sin actividad reciente + Feedback */}
      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-2">
        <Card>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#b45309]" strokeWidth={1.8} />
            <SectionLabel>Sin actividad reciente</SectionLabel>
          </div>
          <p className="mt-2.5 text-[12.5px] text-[#8b8a95]">
            Alumnos que empezaron y llevan más de {progress?.inactivity_days ?? 14} días sin entrar.
          </p>
          <div className="mt-4 flex flex-col gap-2.5">
            {atRisk.length === 0 && <p className="text-[13px] text-[#a9a8b4]">Nadie está sin actividad reciente.</p>}
            {atRisk.map((r) => (
              <div key={r.user_id} className="flex items-center gap-3 rounded-[10px] border border-[#f2f1f6] px-3 py-2.5">
                <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-full bg-[#16151b] font-mono text-[10px] font-bold text-white">
                  {((r.name || '?').trim().split(/\s+/)[0]?.[0] || '') + ((r.name || '').trim().split(/\s+/)[1]?.[0] || '')}
                </span>
                <span className="min-w-0 flex-1 truncate text-[13px] text-[#33323b]">{r.name || `Usuario ${r.user_id}`}</span>
                <span className="flex-shrink-0 font-mono text-[11px] text-[#b45309]">
                  {r.last_activity ? daysAgo(r.last_activity) : 'sin señal'}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {!isTeacher && (
          <Card>
            <SectionLabel>Feedback del curso</SectionLabel>
            <CardTitle>Lo que responden al terminar</CardTitle>
            <p className="mt-2 text-[12.5px] text-[#8b8a95]">
              {feedbackCount ? `${feedbackCount} respuestas.` : 'Aún no hay respuestas.'}
            </p>
            <div className="mt-5 flex flex-col gap-5">
              {[
                { label: 'Dificultad percibida', value: difficulty },
                { label: 'Utilidad percibida', value: usefulness },
              ].map((f) => (
                <div key={f.label}>
                  <div className="flex items-baseline justify-between">
                    <span className="text-[13px] text-[#33323b]">{f.label}</span>
                    <span className="font-mono text-[13px] font-bold">
                      {f.value != null ? f.value.toFixed(1) : '—'}<span className="font-normal text-[#b3b2be]"> / 5</span>
                    </span>
                  </div>
                  <div className="mt-2.5 flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <span
                        key={n}
                        className={`h-2 w-[26px] rounded-[4px] ${
                          f.value != null && n <= Math.round(f.value) ? 'bg-[#4b46d6]' : 'bg-[#eceaf2]'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

export default AnalyticsTab
