/**
 * Progress Service
 * 
 * Handles API calls for user progress tracking.
 * Manages content completion, last access updates, and progress retrieval.
 */

import { API_BASE } from '../config'

const parseError = async (response) => {
  try {
    const data = await response.json()
    return data?.detail || data?.error || 'Error en la solicitud'
  } catch {
    return 'Error en la solicitud'
  }
}

export const markContentComplete = async (userId, contentId) => {
  const response = await fetch(`${API_BASE}/api/progress/mark-complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, content_id: contentId }),
  })
  if (!response.ok) {
    throw new Error(await parseError(response))
  }
  return response.json()
}

export const updateLastAccessed = async (userId, contentId) => {
  const response = await fetch(`${API_BASE}/api/progress/update-access`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, content_id: contentId }),
  })
  if (!response.ok) {
    throw new Error(await parseError(response))
  }
  return response.json()
}

export const getUserProgress = async (userId, courseId = null) => {
  const url = courseId 
    ? `${API_BASE}/api/progress/${userId}?course_id=${courseId}`
    : `${API_BASE}/api/progress/${userId}`
  
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(await parseError(response))
  }
  return response.json()
}

export const getRoadmap = async (userId, courseId = null) => {
  if (!userId) throw new Error('userId required')
  const url = courseId 
    ? `${API_BASE}/api/progress/${userId}/roadmap?course_id=${courseId}`
    : `${API_BASE}/api/progress/${userId}/roadmap`

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(await parseError(response))
  }
  return response.json()
}


export const getLastAccessedContent = async (userId) => {
  const response = await fetch(`${API_BASE}/api/progress/${userId}/last-accessed`)
  if (!response.ok) {
    throw new Error(await parseError(response))
  }
  return response.json()
}
