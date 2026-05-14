/**
 * useUnits Custom Hook
 * 
 * Manages unit state and CRUD operations for a specific module.
 * Uses sonner toast for notifications.
 */

import { useState } from 'react'
import { toast } from 'sonner'
import { createUnit, updateUnit, deleteUnit } from '@/features/courses/services/courses'

export function useUnits(adminToken, refreshSelectedCourse) {
  const [unitForm, setUnitForm] = useState({ title: '', description: '', order_index: 1 })
  const [selectedUnitId, setSelectedUnitId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleUnitCreate = async (event, selectedModule, selectedCourse) => {
    event.preventDefault()
    if (!selectedModule || !selectedCourse) return
    setIsSubmitting(true)
    try {
      const result = await createUnit(adminToken, selectedModule.id, unitForm)
      const refreshedCourse = await refreshSelectedCourse(selectedCourse.id)
      toast.success('Unidad creada')
      setUnitForm({ title: '', description: '', order_index: 1 })
      // Return the full unit object from refreshed data
      const updatedModule = refreshedCourse?.modules?.find(m => m.id === selectedModule.id)
      const newUnit = updatedModule?.units?.find(u => u.id === result.unit_id)
      return newUnit || null
    } catch (error) {
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUnitUpdate = async (event, unitId, selectedCourse) => {
    event.preventDefault()
    if (!unitId || !selectedCourse) return
    setIsSubmitting(true)
    try {
      await updateUnit(adminToken, unitId, unitForm)
      await refreshSelectedCourse(selectedCourse.id)
      toast.success('Unidad actualizada')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUnitDelete = async (unitId, selectedCourse) => {
    if (!selectedCourse) return
    try {
      await deleteUnit(adminToken, unitId)
      await refreshSelectedCourse(selectedCourse.id)
      setSelectedUnitId('')
      toast.success('Unidad eliminada')
    } catch (error) {
      toast.error(error.message)
    }
  }

  return {
    unitForm,
    setUnitForm,
    selectedUnitId,
    setSelectedUnitId,
    handleUnitCreate,
    handleUnitUpdate,
    handleUnitDelete,
    isSubmitting,
  }
}
