/**
 * useUnits Custom Hook
 * 
 * Manages unit state and CRUD operations for a specific module.
 * Handles unit form state, loading, and deletion with confirmations.
 */

import { useState } from 'react'
import { createUnit, updateUnit, deleteUnit } from '../../../../services/courses'

export function useUnits(adminToken, refreshSelectedCourse) {
  const [unitForm, setUnitForm] = useState({ title: '', description: '', order_index: 1 })
  const [selectedUnitId, setSelectedUnitId] = useState('')
  const [message, setMessage] = useState(null)
  const [messageType, setMessageType] = useState('success')

  const handleUnitCreate = async (event, selectedModule, selectedCourse) => {
    event.preventDefault()
    if (!selectedModule || !selectedCourse) return
    setMessage(null)
    try {
      await createUnit(adminToken, selectedModule.id, unitForm)
      await refreshSelectedCourse(selectedCourse.id)
      setMessageType('success')
      setMessage('Unidad creada')
      setUnitForm({ title: '', description: '', order_index: 1 })
    } catch (error) {
      setMessageType('error')
      setMessage(error.message)
    }
  }

  const handleUnitUpdate = async (event, unitId, selectedCourse) => {
    event.preventDefault()
    if (!unitId || !selectedCourse) return
    setMessage(null)
    try {
      await updateUnit(adminToken, unitId, unitForm)
      await refreshSelectedCourse(selectedCourse.id)
      setMessageType('success')
      setMessage('Unidad actualizada')
    } catch (error) {
      setMessageType('error')
      setMessage(error.message)
    }
  }

  const handleUnitDelete = async (unitId, selectedCourse) => {
    if (!selectedCourse) return

    setMessage(null)
    try {
      await deleteUnit(adminToken, unitId)
      await refreshSelectedCourse(selectedCourse.id)
      setSelectedUnitId('')
      setMessageType('success')
      setMessage('Unidad eliminada')
    } catch (error) {
      setMessageType('error')
      setMessage(error.message)
    }
  }

  return {
    unitForm,
    setUnitForm,
    selectedUnitId,
    setSelectedUnitId,
    message,
    setMessage,
    messageType,
    handleUnitCreate,
    handleUnitUpdate,
    handleUnitDelete,
  }
}
