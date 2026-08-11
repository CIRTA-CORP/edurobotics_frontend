/**
 * Teacher service (#26): read-only student progress.
 * Endpoints are gated by the backend to teacher/admin.
 */
import { apiGetCached } from '@/shared/services/api'

/** All students with their progress, quiz pass rate and activity flag. */
export const getTeacherStudents = () =>
  apiGetCached('/api/teacher/students', { ttl: 30_000 })

/** Drill-down of one student's progress across courses/modules/units. */
export const getTeacherStudentDetail = (userId) =>
  apiGetCached(`/api/teacher/students/${userId}`, { ttl: 30_000 })
