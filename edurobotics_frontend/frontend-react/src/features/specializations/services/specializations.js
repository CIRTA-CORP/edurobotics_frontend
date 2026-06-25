import { apiGetCached, apiPost, apiPut, apiDelete, apiRequest, invalidateApiCache } from '@/shared/services/api'

const invalidate = () => invalidateApiCache('/api/specializations')

/** Public: published specializations with their courses. */
export const getSpecializations = async () => {
  const res = await apiGetCached('/api/specializations', { ttl: 30_000 })
  return res?.specializations || []
}

/** Public: a single specialization with its ordered courses. */
export const getSpecialization = async (id) => {
  return apiGetCached(`/api/specializations/${id}`, { ttl: 30_000 })
}

/** Admin: all specializations (including unpublished). */
export const getAllSpecializations = async () => {
  const res = await apiGetCached('/api/specializations/admin/all', { ttl: 15_000 })
  return res?.specializations || []
}

export const createSpecialization = async (payload) => {
  const res = await apiPost('/api/specializations', payload)
  invalidate()
  return res
}

export const updateSpecialization = async (id, payload) => {
  const res = await apiPut(`/api/specializations/${id}`, payload)
  invalidate()
  return res
}

export const deleteSpecialization = async (id) => {
  const res = await apiDelete(`/api/specializations/${id}`)
  invalidate()
  return res
}

export const setSpecializationCourses = async (id, courseIds) => {
  const res = await apiRequest(`/api/specializations/${id}/courses`, {
    method: 'POST',
    body: JSON.stringify({ course_ids: courseIds }),
  })
  invalidate()
  return res
}
