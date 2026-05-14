import { apiRequest, apiPost, apiPut, apiDelete, apiGet, apiGetCached, invalidateApiCache } from '@/shared/services/api'

/** Clear cache for a specific course (call after admin edits) */
export function invalidateCourseCache(courseId) {
  if (courseId) {
    invalidateApiCache(`/api/courses/${courseId}`)
  } else {
    invalidateApiCache('/api/courses')
  }
}

// === COURSES (Public) ===

export const getCourses = async () => {
  return apiGetCached('/api/courses', { ttl: 45_000 })
}

export const getCourseDetail = async (courseId) => {
  return apiGetCached(`/api/courses/${courseId}`, { ttl: 60_000 })
}

// === COURSES (Admin - JWT Protected) ===

/**
 * Get all courses including unpublished (admin only).
 * Uses apiGet pattern with auth header.
 */
export const getAllCourses = async () => {
  return apiGetCached('/api/courses/admin/all', { ttl: 30_000 })
}

export const createCourse = async (_, payload) => {
  return apiPost('/api/courses', payload)
}

export const updateCourse = async (_, courseId, payload) => {
  return apiPut(`/api/courses/${courseId}`, payload)
}

export const deleteCourse = async (_, courseId) => {
  return apiDelete(`/api/courses/${courseId}`)
}

export const setPrerequisites = async (_, courseId, prereqIds) => {
  return apiPost(`/api/courses/${courseId}/prerequisites`, { prereq_ids: prereqIds })
}

/**
 * Check if a user meets the prerequisites for a course.
 * Returns: { allowed: bool, details: [{ prereq_id, title, state, percentage }], missing: [] }
 */
export const checkPrerequisites = async (courseId, userId) => {
  return apiGetCached(`/api/courses/${courseId}/prerequisites/check?user_id=${userId}`, { ttl: 10_000 })
}

/**
 * Get all courses with prerequisite IDs for the roadmap graph.
 * Returns: { courses: [{ id, title, description, level, version, prerequisites: [ids] }] }
 */
export const getCoursesRoadmap = async () => {
  return apiGetCached('/api/courses/roadmap', { ttl: 60_000 })
}


// === MODULES (Admin - JWT Protected) ===

export const createModule = async (_, courseId, payload) => {
  return apiPost(`/api/courses/${courseId}/modules`, payload)
}

export const deleteModule = async (_, moduleId) => {
  return apiDelete(`/api/modules/${moduleId}`)
}

export const updateModule = async (_, moduleId, payload) => {
  return apiPut(`/api/modules/${moduleId}`, payload)
}

// === UNITS (Public) ===

export const getModuleUnits = async (moduleId) => {
  return apiGetCached(`/api/modules/${moduleId}/units`, { ttl: 30_000 })
}

// === UNITS (Admin - JWT Protected) ===

export const createUnit = async (_, moduleId, payload) => {
  return apiPost(`/api/modules/${moduleId}/units`, payload)
}

export const updateUnit = async (_, unitId, payload) => {
  return apiPut(`/api/units/${unitId}`, payload)
}

export const deleteUnit = async (_, unitId) => {
  return apiDelete(`/api/units/${unitId}`)
}

// === UNIT CONTENTS (Public) ===

export const getUnitContents = async (unitId) => {
  return apiGetCached(`/api/units/${unitId}/contents`, { ttl: 30_000 })
}

// === UNIT CONTENTS (Admin - JWT Protected) ===

export const addUnitContent = async (_, unitId, payload) => {
  return apiPost(`/api/units/${unitId}/contents`, payload)
}

export const updateUnitContent = async (_, contentId, payload) => {
  return apiPut(`/api/contents/${contentId}`, payload)
}

export const deleteUnitContent = async (_, contentId) => {
  return apiDelete(`/api/contents/${contentId}`)
}

export const reorderContent = async (contentId, direction) => {
  return apiRequest(`/api/contents/${contentId}/reorder?direction=${direction}`, { method: 'PATCH' })
}
// === LEGACY MODULE CONTENT (for compatibility) ===

export const addModuleContent = async (_, moduleId, payload) => {
  return apiPost(`/api/modules/${moduleId}/contents`, payload)
}

export const deleteModuleContent = async (_, contentId) => {
  return apiDelete(`/api/contents/${contentId}`)
}

// === QUIZZES (Admin - JWT Protected) ===

export const createQuiz = async (_, moduleId, payload) => {
  return apiPost(`/api/modules/${moduleId}/quizzes`, payload)
}

export const deleteQuiz = async (_, quizId) => {
  return apiDelete(`/api/quizzes/${quizId}`)
}

export const addQuizQuestion = async (_, quizId, payload) => {
  return apiPost(`/api/quizzes/${quizId}/questions`, payload)
}

export const addQuizAnswer = async (_, questionId, payload) => {
  return apiPost(`/api/questions/${questionId}/answers`, payload)
}

// Aliases for consistency
export const createContent = addUnitContent
export const deleteContent = deleteUnitContent

// === COURSE FEEDBACK ===

export const submitCourseFeedback = async (courseId, userId, data) => {
  return apiPost(`/api/courses/${courseId}/feedback?user_id=${userId}`, data)
}

export const getCourseFeedback = async (courseId, userId) => {
  const response = await fetch(`${API_BASE}/api/courses/${courseId}/feedback?user_id=${userId}`)
  if (!response.ok) throw new Error(await parseError(response))
  return response.json()
}

export const getCourseFeedbackSummary = async (courseId) => {
  return apiGet(`/api/courses/${courseId}/feedback/summary`)
}

// === ADMIN METRICS ===

export const getAdminMetrics = async () => {
  return apiGet('/api/admin/metrics')
}

// === USER PROFILE ===

export const getUserProfile = async (userId) => {
  return apiGet(`/api/profile?user_id=${userId}`)
}
