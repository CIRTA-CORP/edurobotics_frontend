/**
 * Teacher service (#26 v2): the teacher's own courses + scoped student progress,
 * plus the admin-side assignment endpoints.
 * Endpoints are gated by the backend (teacher/admin for reads; admin for assignment).
 */
import { apiGetCached, apiPost, apiDelete } from '@/shared/services/api'

/** Courses assigned to the current teacher (the ones they may manage). */
export const getTeacherCourses = () =>
  apiGetCached('/api/teacher/courses', { ttl: 30_000 })

/** Students of the teacher's courses with progress, quiz pass rate and activity. */
export const getTeacherStudents = () =>
  apiGetCached('/api/teacher/students', { ttl: 30_000 })

/** Drill-down of one student's progress (scoped to the teacher's courses). */
export const getTeacherStudentDetail = (userId) =>
  apiGetCached(`/api/teacher/students/${userId}`, { ttl: 30_000 })

// ── Admin-only: course ↔ teacher assignment ──

/** Course ids assigned to a teacher (admin only). */
export const getUserAssignedCourses = (userId) =>
  apiGetCached(`/api/admin/users/${userId}/courses`, { ttl: 15_000 })

/** Assign a teacher to a course (admin only, idempotent). */
export const assignCourseTeacher = (courseId, userId) =>
  apiPost(`/api/admin/courses/${courseId}/teachers`, { user_id: userId })

/** Remove a teacher's assignment from a course (admin only). */
export const unassignCourseTeacher = (courseId, userId) =>
  apiDelete(`/api/admin/courses/${courseId}/teachers/${userId}`)
