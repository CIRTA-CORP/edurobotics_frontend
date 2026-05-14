/**
 * Progress Service
 * 
 * Handles API calls for user progress tracking.
 * Manages content completion, last access updates, and progress retrieval.
 */

import { apiPost, apiGetCached } from '@/shared/services/api'

export const markContentComplete = async (userId, contentId) => {
  return apiPost('/api/progress/mark-complete', { user_id: userId, content_id: contentId })
}

export const updateLastAccessed = async (userId, contentId) => {
  return apiPost('/api/progress/update-access', { user_id: userId, content_id: contentId })
}

export const getUserProgress = async (userId, courseId = null) => {
  const url = courseId 
    ? `/api/progress/${userId}?course_id=${courseId}`
    : `/api/progress/${userId}`

  return apiGetCached(url, { ttl: 15_000 })
}

export const getRoadmap = async (userId, courseId = null) => {
  if (!userId) throw new Error('userId required')
  const url = courseId 
    ? `/api/progress/${userId}/roadmap?course_id=${courseId}`
    : `/api/progress/${userId}/roadmap`

  return apiGetCached(url, { ttl: 20_000 })
}


export const getLastAccessedContent = async (userId) => {
  return apiGetCached(`/api/progress/${userId}/last-accessed`, { ttl: 15_000 })
}
