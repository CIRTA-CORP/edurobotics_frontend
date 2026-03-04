import { API_BASE } from '../config'
import { getToken } from './auth'

/**
 * Centralized API client with automatic JWT token injection
 */

/**
 * Make an authenticated API request
 * @param {string} endpoint - API endpoint (e.g., '/api/courses')
 * @param {object} options - Fetch options
 * @returns {Promise<any>} Response data
 */
export const apiRequest = async (endpoint, options = {}) => {
    const token = getToken()

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    }

    // Add Authorization header if token exists
    if (token) {
        headers['Authorization'] = `Bearer ${token}`
    }

    const config = {
        ...options,
        headers,
    }

    const response = await fetch(`${API_BASE}${endpoint}`, config)

    // Handle 401 Unauthorized (expired/invalid token)
    if (response.status === 401) {
        // Clear invalid token
        localStorage.removeItem('token')
        // Redirect to login
        window.location.href = '/login'
        throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.')
    }

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Error en la solicitud' }))
        throw new Error(error.detail || error.message || 'Error en la solicitud')
    }

    return response.json()
}

/**
 * GET request
 */
export const apiGet = (endpoint) => {
    return apiRequest(endpoint, { method: 'GET' })
}

/**
 * POST request
 */
export const apiPost = (endpoint, data) => {
    return apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(data),
    })
}

/**
 * PUT request
 */
export const apiPut = (endpoint, data) => {
    return apiRequest(endpoint, {
        method: 'PUT',
        body: JSON.stringify(data),
    })
}

/**
 * DELETE request
 */
export const apiDelete = (endpoint) => {
    return apiRequest(endpoint, { method: 'DELETE' })
}

/**
 * Upload a file (multipart/form-data)
 */
export const apiUploadFile = async (endpoint, file) => {
    const token = getToken()
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData,
    })

    if (response.status === 401) {
        localStorage.removeItem('token')
        window.location.href = '/login'
        throw new Error('Sesión expirada.')
    }

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Error al subir archivo' }))
        throw new Error(error.detail || 'Error al subir archivo')
    }

    return response.json()
}
