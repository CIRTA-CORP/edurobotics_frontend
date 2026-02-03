import { API_BASE } from '../config'

const parseError = async (response) => {
  try {
    const data = await response.json()
    return data?.detail || data?.error || 'Error en la solicitud'
  } catch {
    return 'Error en la solicitud'
  }
}

export const registerUser = async (payload) => {
  const response = await fetch(`${API_BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const message = await parseError(response)
    throw new Error(message)
  }

  return response.json()
}

export const loginUser = async (payload) => {
  const response = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const message = await parseError(response)
    throw new Error(message)
  }

  return response.json()
}

export const getStoredUser = () => {
  const raw = localStorage.getItem('user')
  return raw ? JSON.parse(raw) : null
}

export const clearStoredUser = () => {
  localStorage.removeItem('user')
}