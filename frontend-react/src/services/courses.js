import { API_BASE } from '../config'

const parseError = async (response) => {
  try {
    const data = await response.json()
    return data?.detail || data?.error || 'Error en la solicitud'
  } catch {
    return 'Error en la solicitud'
  }
}

const adminHeaders = (token) => ({
  'Content-Type': 'application/json',
  'X-Admin-Token': token || '',
})

export const getCourses = async () => {
  const response = await fetch(`${API_BASE}/api/courses`)
  if (!response.ok) {
    throw new Error(await parseError(response))
  }
  return response.json()
}

export const getCourseDetail = async (courseId) => {
  const response = await fetch(`${API_BASE}/api/courses/${courseId}`)
  if (!response.ok) {
    throw new Error(await parseError(response))
  }
  return response.json()
}

export const createCourse = async (token, payload) => {
  const response = await fetch(`${API_BASE}/api/courses`, {
    method: 'POST',
    headers: adminHeaders(token),
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    throw new Error(await parseError(response))
  }
  return response.json()
}

export const updateCourse = async (token, courseId, payload) => {
  const response = await fetch(`${API_BASE}/api/courses/${courseId}`, {
    method: 'PUT',
    headers: adminHeaders(token),
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    throw new Error(await parseError(response))
  }
  return response.json()
}

export const deleteCourse = async (token, courseId) => {
  const response = await fetch(`${API_BASE}/api/courses/${courseId}`, {
    method: 'DELETE',
    headers: adminHeaders(token),
  })
  if (!response.ok) {
    throw new Error(await parseError(response))
  }
  return response.json()
}

export const setPrerequisites = async (token, courseId, prereqIds) => {
  const response = await fetch(`${API_BASE}/api/courses/${courseId}/prerequisites`, {
    method: 'POST',
    headers: adminHeaders(token),
    body: JSON.stringify({ prereq_ids: prereqIds }),
  })
  if (!response.ok) {
    throw new Error(await parseError(response))
  }
  return response.json()
}

export const createModule = async (token, courseId, payload) => {
  const response = await fetch(`${API_BASE}/api/courses/${courseId}/modules`, {
    method: 'POST',
    headers: adminHeaders(token),
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    throw new Error(await parseError(response))
  }
  return response.json()
}

export const deleteModule = async (token, moduleId) => {
  const response = await fetch(`${API_BASE}/api/modules/${moduleId}`, {
    method: 'DELETE',
    headers: adminHeaders(token),
  })
  if (!response.ok) {
    throw new Error(await parseError(response))
  }
  return response.json()
}

export const addModuleContent = async (token, moduleId, payload) => {
  const response = await fetch(`${API_BASE}/api/modules/${moduleId}/contents`, {
    method: 'POST',
    headers: adminHeaders(token),
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    throw new Error(await parseError(response))
  }
  return response.json()
}

export const deleteModuleContent = async (token, contentId) => {
  const response = await fetch(`${API_BASE}/api/contents/${contentId}`, {
    method: 'DELETE',
    headers: adminHeaders(token),
  })
  if (!response.ok) {
    throw new Error(await parseError(response))
  }
  return response.json()
}

export const createQuiz = async (token, moduleId, payload) => {
  const response = await fetch(`${API_BASE}/api/modules/${moduleId}/quizzes`, {
    method: 'POST',
    headers: adminHeaders(token),
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    throw new Error(await parseError(response))
  }
  return response.json()
}

export const deleteQuiz = async (token, quizId) => {
  const response = await fetch(`${API_BASE}/api/quizzes/${quizId}`, {
    method: 'DELETE',
    headers: adminHeaders(token),
  })
  if (!response.ok) {
    throw new Error(await parseError(response))
  }
  return response.json()
}

export const addQuizQuestion = async (token, quizId, payload) => {
  const response = await fetch(`${API_BASE}/api/quizzes/${quizId}/questions`, {
    method: 'POST',
    headers: adminHeaders(token),
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    throw new Error(await parseError(response))
  }
  return response.json()
}

export const addQuizAnswer = async (token, questionId, payload) => {
  const response = await fetch(`${API_BASE}/api/questions/${questionId}/answers`, {
    method: 'POST',
    headers: adminHeaders(token),
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    throw new Error(await parseError(response))
  }
  return response.json()
}