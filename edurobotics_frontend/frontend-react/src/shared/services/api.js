/**
 * Centralized API client.
 *
 * Every request injects the JWT (when present) and, on a 401, clears the token
 * and redirects to /login — so expired sessions are handled in one place, not
 * per caller. `apiGetCached` adds a short in-memory cache plus in-flight
 * deduplication (concurrent callers of the same endpoint share one request).
 * Any write (POST/PUT/DELETE) invalidates the cache, since a mutation can stale
 * any cached read.
 */
import { API_BASE } from '@/config'
import { getStoredUser, getToken } from '@/features/auth/services/auth'

const DEFAULT_CACHE_TTL = 30_000
const responseCache = new Map()
const inflightRequests = new Map()

function buildCacheKey(endpoint, token, cacheKey) {
    if (cacheKey) return cacheKey
    // El scope se deriva del user_id, NO de un prefijo del token: los primeros
    // caracteres de un JWT son su header en base64 (`eyJhbGciOiJI…`), idéntico
    // para todo el mundo. Con `token.slice(0, 12)` todos los usuarios compartían
    // la misma clave, así que cambiar de cuenta sin recargar servía datos del
    // usuario anterior.
    let authScope = 'public'
    if (token) {
        const userId = getStoredUser()?.id
        // Si hay token pero no se puede leer el id, NO se cae a 'public': eso
        // mezclaría una respuesta autenticada con la caché anónima.
        authScope = userId ? `user:${userId}` : 'auth:unknown'
    }
    return `${authScope}:${endpoint}`
}

function getCachedResponse(key, ttl) {
    const entry = responseCache.get(key)
    if (!entry) return null
    if (Date.now() - entry.timestamp > ttl) {
        responseCache.delete(key)
        return null
    }
    return entry.data
}

// Al cerrar sesión se vacía todo: las entradas del usuario que se va no deben
// sobrevivir en memoria. `clearStoredUser` emite este evento en lugar de importar
// esta función, para no cerrar un ciclo de imports con auth.js.
if (typeof window !== 'undefined') {
    window.addEventListener('auth:signed-out', () => invalidateApiCache())
}

export function invalidateApiCache(prefix = '') {
    if (!prefix) {
        responseCache.clear()
        inflightRequests.clear()
        return
    }

    for (const key of responseCache.keys()) {
        if (key.includes(prefix)) {
            responseCache.delete(key)
        }
    }

    for (const key of inflightRequests.keys()) {
        if (key.includes(prefix)) {
            inflightRequests.delete(key)
        }
    }
}

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
 * GET request with global in-memory cache and in-flight deduplication.
 */
export const apiGetCached = async (
    endpoint,
    { ttl = DEFAULT_CACHE_TTL, forceRefresh = false, cacheKey } = {}
) => {
    const token = getToken()
    const key = buildCacheKey(endpoint, token, cacheKey)

    if (!forceRefresh) {
        const cached = getCachedResponse(key, ttl)
        if (cached !== null) return cached

        const inflight = inflightRequests.get(key)
        if (inflight) return inflight
    }

    const requestPromise = apiGet(endpoint)
        .then((data) => {
            responseCache.set(key, { data, timestamp: Date.now() })
            return data
        })
        .finally(() => {
            inflightRequests.delete(key)
        })

    inflightRequests.set(key, requestPromise)
    return requestPromise
}

/**
 * POST request
 */
export const apiPost = (endpoint, data) => {
    return apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(data),
    }).then((result) => {
        // Writes can stale any cached read endpoint.
        invalidateApiCache()
        return result
    })
}

/**
 * PUT request
 */
export const apiPut = (endpoint, data) => {
    return apiRequest(endpoint, {
        method: 'PUT',
        body: JSON.stringify(data),
    }).then((result) => {
        invalidateApiCache()
        return result
    })
}

/**
 * DELETE request
 */
export const apiDelete = (endpoint) => {
    return apiRequest(endpoint, { method: 'DELETE' }).then((result) => {
        invalidateApiCache()
        return result
    })
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
