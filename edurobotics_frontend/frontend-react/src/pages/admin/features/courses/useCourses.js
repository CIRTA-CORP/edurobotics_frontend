/**
 * useCourses Custom Hook
 * 
 * Manages course state and CRUD operations with the backend API.
 * Handles course form state, loading states, and user messages.
 * Includes confirmation dialogs before destructive operations.
 */

import { useState } from 'react'
import { createCourse, updateCourse, deleteCourse, setPrerequisites } from '../../../../services/courses'

export function useCourses(adminToken, refreshCourses, refreshSelectedCourse) {
  const [courseForm, setCourseForm] = useState({ title: '', description: '', level: 'beginner', version: 1, is_published: true })
  const [prereqIds, setPrereqIds] = useState([]) // number[]
  const [message, setMessage] = useState(null)
  const [messageType, setMessageType] = useState('success')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCourseCreate = async (event) => {
    event.preventDefault()
    if (isSubmitting) return // Prevent double submission
    setIsSubmitting(true)
    setMessage(null)
    try {
      await createCourse(adminToken, courseForm)
      await refreshCourses()
      setMessageType('success')
      setMessage('Curso creado')
      setCourseForm({ title: '', description: '', level: 'beginner', version: 1, is_published: true })
    } catch (error) {
      setMessageType('error')
      setMessage(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCourseUpdate = async (event, selectedCourse) => {
    event.preventDefault()
    if (!selectedCourse || isSubmitting) return
    setIsSubmitting(true)
    setMessage(null)
    try {
      await updateCourse(adminToken, selectedCourse.id, courseForm)
      await refreshSelectedCourse(selectedCourse.id)
      await refreshCourses()
      setMessageType('success')
      setMessage('Curso actualizado')
    } catch (error) {
      setMessageType('error')
      setMessage(error.message)
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

    setMessage(null)
    try {
      await deleteCourse(adminToken, selectedCourse.id)
      await refreshCourses()
      setMessageType('success')
      setMessage('Curso eliminado')
      return true // Indica que se eliminó
    } catch (error) {
      setMessageType('error')
      setMessage(error.message)
      return false
    }
  }

  const handlePrereqSave = async (selectedCourse) => {
    if (!selectedCourse) return
    setMessage(null)
    try {
      await setPrerequisites(adminToken, selectedCourse.id, prereqIds)
      await refreshSelectedCourse(selectedCourse.id)
      setMessageType('success')
      setMessage('Prerequisitos guardados')
    } catch (error) {
      setMessageType('error')
      setMessage(error.message)
    }
  }

  return {
    courseForm,
    setCourseForm,
    prereqIds,
    setPrereqIds,
    message,
    setMessage,
    messageType,
    isSubmitting,
    handleCourseCreate,
    handleCourseUpdate,
    handleCourseDelete,
    handlePrereqSave,
  }
}
