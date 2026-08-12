/**
 * Analytics API clients (#25) — admin-only endpoints.
 * Read-only aggregates; cached 30s like the other admin reads.
 */
import { apiGetCached } from '@/shared/services/api'

export const getCourseProgressAnalytics = (courseId) =>
  apiGetCached(`/api/analytics/courses/${courseId}/progress`)

export const getInteractionAnalytics = () =>
  apiGetCached('/api/analytics/interaction')

export const getCoursePerformanceAnalytics = (courseId) =>
  apiGetCached(`/api/analytics/courses/${courseId}/performance`)

export const getCourseContentAnalytics = (courseId) =>
  apiGetCached(`/api/analytics/courses/${courseId}/content`)
