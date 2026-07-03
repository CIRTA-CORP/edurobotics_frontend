import { apiRequest } from '@/shared/services/api'

/**
 * Update the current user's name. The backend returns a fresh JWT (the name is
 * embedded in the token), so we persist it for the UI to pick up immediately.
 */
export const updateProfile = async (payload) => {
  const res = await apiRequest('/api/profile', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
  if (res?.token) {
    localStorage.setItem('token', res.token)
  }
  return res
}

/** Change the current user's password (verifies the current one server-side). */
export const changePassword = async (payload) => {
  return apiRequest('/api/auth/change-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
