/**
 * useCourses Custom Hook
 * 
 * Manages course state and CRUD operations with the backend API.
 * Uses sonner toast for notifications instead of inline message state.
 */

import { useState } from 'react'
import { toast } from 'sonner'
import { createCourse, updateCourse, deleteCourse, setPrerequisites } from '../../../../services/courses'

export function useCourses(adminToken, refreshCourses, refreshSelectedCourse) {
  const [courseForm, setCourseForm] = useState({ title: '', description: '', level: 'beginner', version: 1, is_published: true })
  const [prereqIds, setPrereqIds] = useState([]) // number[]
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCourseCreate = async (event) => {
    event.preventDefault()
    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      await createCourse(adminToken, courseForm)
      await refreshCourses()
      toast.success('Curso creado')
      setCourseForm({ title: '', description: '', level: 'beginner', version: 1, is_published: true })
    } catch (error) {
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCourseUpdate = async (event, selectedCourse) => {
    event.preventDefault()
    if (!selectedCourse || isSubmitting) return
    setIsSubmitting(true)
    try {
      await updateCourse(adminToken, selectedCourse.id, courseForm)
      await refreshSelectedCourse(selectedCourse.id)
      await refreshCourses()
      toast.success('Curso actualizado')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCourseDelete = async (selectedCourse) => {
    if (!selectedCourse) return

    const confirmDelete = window.confirm(
      `¿Estás seguro de que deseas eliminar el curso "${selectedCourse.title}"? Esta acción no se puede deshacer.`
    )
    if (!confirmDelete) return

    try {
      await deleteCourse(adminToken, selectedCourse.id)
      await refreshCourses()
      toast.success('Curso eliminado')
      return true
    } catch (error) {
      toast.error(error.message)
      return false
    }
  }

  const handlePrereqSave = async (selectedCourse) => {
    if (!selectedCourse) return
    try {
      await setPrerequisites(adminToken, selectedCourse.id, prereqIds)
      await refreshSelectedCourse(selectedCourse.id)
      toast.success('Prerequisitos guardados')
    } catch (error) {
      toast.error(error.message)
    }
  }

  return {
    courseForm,
    setCourseForm,
    prereqIds,
    setPrereqIds,
    isSubmitting,
    handleCourseCreate,
    handleCourseUpdate,
    handleCourseDelete,
    handlePrereqSave,
  }
}
