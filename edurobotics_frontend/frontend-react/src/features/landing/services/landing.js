import { apiGetCached, apiPut, invalidateApiCache } from '@/shared/services/api'

/** Public: obtiene el contenido editable de la landing. */
export const getLandingContent = async () => {
  const res = await apiGetCached('/api/landing', { ttl: 30_000 })
  return res?.content || {}
}

/** Admin: guarda el contenido de la landing. */
export const saveLandingContent = async (content) => {
  const res = await apiPut('/api/landing', { content })
  invalidateApiCache('/api/landing')
  return res?.content || {}
}
