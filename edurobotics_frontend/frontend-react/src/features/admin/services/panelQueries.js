/**
 * Consultas del Dashboard y la Analítica, en un solo sitio (change `admin-analytics-v2`).
 *
 * Los componentes y la precarga usan estas mismas definiciones: si cada uno escribiera su
 * propia clave, la precarga llenaría una entrada que la pantalla no lee.
 *
 * Los datos viven en la memoria de React Query mientras la pestaña está abierta: volver a
 * una pantalla ya vista la muestra al instante y la refresca por detrás. No se guardan en el
 * navegador (localStorage), porque incluyen nombres de alumnos y la plataforma se usa en
 * computadores compartidos. El backend, además, guarda cada resultado 60 s.
 */
import { queryOptions } from '@tanstack/react-query'
import { apiGet } from '@/shared/services/api'
import { getAdminMetrics, getAdminSessions, getCoursesBasicMetrics } from '@/features/courses/services/courses'
import { getDailySessions, getInteractionAnalytics } from '@/features/admin/services/analytics'

// Igual que la caché del servidor: antes de un minuto no hay nada nuevo que pedir.
const STALE = 60_000

export const adminMetricsQuery = () =>
  queryOptions({ queryKey: ['admin-metrics'], queryFn: getAdminMetrics, staleTime: STALE })

export const coursesMetricsQuery = () =>
  queryOptions({ queryKey: ['admin-courses-metrics'], queryFn: getCoursesBasicMetrics, staleTime: STALE })

export const adminSessionsQuery = () =>
  queryOptions({ queryKey: ['admin-sessions'], queryFn: getAdminSessions, staleTime: STALE })

export const dailySessionsQuery = (days) =>
  queryOptions({ queryKey: ['analytics-sessions-daily', days], queryFn: () => getDailySessions(days), staleTime: STALE })

export const interactionQuery = () =>
  queryOptions({ queryKey: ['analytics-interaction'], queryFn: getInteractionAnalytics, staleTime: STALE })

/** Todo lo de un curso en una petición: progreso, rendimiento, contenidos y opiniones. */
export const courseOverviewQuery = (courseId) =>
  queryOptions({
    queryKey: ['analytics-overview', courseId],
    queryFn: () => apiGet(`/api/analytics/courses/${courseId}/overview`),
    enabled: !!courseId,
    staleTime: STALE,
  })

/**
 * Pide por adelantado lo que el panel va a mostrar, al entrar: cuando se abra el Dashboard
 * o la Analítica, los datos ya están (o ya vienen en camino). Lo que ya está fresco no se
 * vuelve a pedir.
 */
export function prefetchPanel(queryClient, { isTeacher, courseId }) {
  if (!isTeacher) {
    queryClient.prefetchQuery(adminSessionsQuery())
    queryClient.prefetchQuery(adminMetricsQuery())
    queryClient.prefetchQuery(coursesMetricsQuery())
    queryClient.prefetchQuery(dailySessionsQuery(14))
    queryClient.prefetchQuery(interactionQuery())
  }
  if (courseId) queryClient.prefetchQuery(courseOverviewQuery(courseId))
}

/** «hace un momento», «hace 3 min», «hace 2 h», a partir de `computed_at`. */
export function updatedAgo(iso, now = Date.now()) {
  if (!iso) return null
  const minutes = Math.floor((now - new Date(iso).getTime()) / 60000)
  if (minutes < 1) return 'hace un momento'
  if (minutes < 60) return `hace ${minutes} min`
  return `hace ${Math.floor(minutes / 60)} h`
}
