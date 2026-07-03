import { API_BASE } from '@/config'

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

  const data = await response.json()

  // Store JWT token
  if (data.token) {
    localStorage.setItem('token', data.token)
  }

  return data
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

  const data = await response.json()

  // Store JWT token
  if (data.token) {
    localStorage.setItem('token', data.token)
  }

  return data
}

/**
 * Request a password reset email. Always resolves (the backend returns the
 * same response whether or not the email exists, to avoid enumeration).
 */
export const forgotPassword = async (email) => {
  const response = await fetch(`${API_BASE}/api/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  if (!response.ok) throw new Error(await parseError(response))
  return response.json()
}

/** Complete a password reset with the token from the email link. */
export const resetPassword = async ({ token, new_password, new_password_confirm }) => {
  const response = await fetch(`${API_BASE}/api/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, new_password, new_password_confirm }),
  })
  if (!response.ok) throw new Error(await parseError(response))
  return response.json()
}

/**
 * Decode JWT token payload (without verification - just for reading data)
 */
const decodeToken = (token) => {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch (error) {
    console.error('Error decoding token:', error)
    return null
  }
}

/**
 * Check if token is expired
 */
const isTokenExpired = (token) => {
  const payload = decodeToken(token)
  if (!payload || !payload.exp) return true

  // exp is in seconds, Date.now() is in milliseconds
  return payload.exp * 1000 < Date.now()
}

/**
 * Get stored JWT token
 */
export const getToken = () => {
  const token = localStorage.getItem('token')
  if (!token || token === 'undefined' || token === 'null') {
    return null
  }

  // Check if expired
  if (isTokenExpired(token)) {
    localStorage.removeItem('token')
    return null
  }

  return token
}

/**
 * Get user data from stored JWT token
 */
export const getStoredUser = () => {
  const token = getToken()
  if (!token) return null

  const payload = decodeToken(token)
  if (!payload) return null

  return {
    id: payload.user_id,
    username: payload.username,
    role: payload.role,
    first_name: payload.first_name || '',
    last_name: payload.last_name || ''
  }
}

/**
 * Clear stored token (logout)
 */
export const clearStoredUser = () => {
  localStorage.removeItem('token')
}
