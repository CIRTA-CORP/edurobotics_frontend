/**
 * useModules Custom Hook
 * 
 * Manages module state and CRUD operations for a specific course.
 * Uses sonner toast for notifications.
 */

import { useState } from 'react'
import { toast } from 'sonner'
import { createModule, updateModule, deleteModule } from '@/features/courses/services/courses'

export function useModules(adminToken, refreshSelectedCourse) {
  const [moduleForm, setModuleForm] = useState({ title: '', description: '', order_index: 1 })
  const [selectedModuleId, setSelectedModuleId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleModuleCreate = async (event, selectedCourse) => {
    event.preventDefault()
    if (!selectedCourse) return
    setIsSubmitting(true)
    try {
      const result = await createModule(adminToken, selectedCourse.id, moduleForm)
      const refreshedCourse = await refreshSelectedCourse(selectedCourse.id)
      toast.success('Módulo creado')
      setModuleForm({ title: '', description: '', order_index: 1 })
      // Return the full module object from refreshed data
      const newModule = refreshedCourse?.modules?.find(m => m.id === result.module_id)
      return newModule || null
    } catch (error) {
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleModuleUpdate = async (event, moduleId, selectedCourse) => {
    event.preventDefault()
    if (!moduleId || !selectedCourse) return
    setIsSubmitting(true)
    try {
      await updateModule(adminToken, moduleId, moduleForm)
      await refreshSelectedCourse(selectedCourse.id)
      toast.success('Módulo actualizado')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleModuleDelete = async (moduleId, selectedCourse) => {
    if (!selectedCourse) return
    try {
      await deleteModule(adminToken, moduleId)
      await refreshSelectedCourse(selectedCourse.id)
      setSelectedModuleId('')
      toast.success('Módulo eliminado')
    } catch (error) {
      toast.error(error.message)
    }
  }

  return {
    moduleForm,
    setModuleForm,
    selectedModuleId,
    setSelectedModuleId,
    handleModuleCreate,
    handleModuleUpdate,
    handleModuleDelete,
    isSubmitting,
  }
}
