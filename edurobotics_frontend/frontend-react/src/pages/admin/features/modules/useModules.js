/**
 * useModules Custom Hook
 * 
 * Manages module state and CRUD operations for a specific course.
 * Handles module form state, loading, and deletion with confirmations.
 */

import { useState } from 'react'
import { createModule, updateModule, deleteModule } from '../../../../services/courses'

export function useModules(adminToken, refreshSelectedCourse) {
  const [moduleForm, setModuleForm] = useState({ title: '', description: '', order_index: 1 })
  const [selectedModuleId, setSelectedModuleId] = useState('')
  const [message, setMessage] = useState(null)
  const [messageType, setMessageType] = useState('success')

  const handleModuleCreate = async (event, selectedCourse) => {
    event.preventDefault()
    if (!selectedCourse) return
    setMessage(null)
    try {
      await createModule(adminToken, selectedCourse.id, moduleForm)
      await refreshSelectedCourse(selectedCourse.id)
      setMessageType('success')
      setMessage('Módulo creado')
      setModuleForm({ title: '', description: '', order_index: 1 })
    } catch (error) {
      setMessageType('error')
      setMessage(error.message)
    }
  }

  const handleModuleUpdate = async (event, moduleId, selectedCourse) => {
    event.preventDefault()
    if (!moduleId || !selectedCourse) return
    setMessage(null)
    try {
      await updateModule(adminToken, moduleId, moduleForm)
      await refreshSelectedCourse(selectedCourse.id)
      setMessageType('success')
      setMessage('Módulo actualizado')
    } catch (error) {
      setMessageType('error')
      setMessage(error.message)
    }
  }

  const handleModuleDelete = async (moduleId, selectedCourse) => {
    if (!selectedCourse) return

    // Confirmation handled in parent component

    setMessage(null)
    try {
      await deleteModule(adminToken, moduleId)
      await refreshSelectedCourse(selectedCourse.id)
      setSelectedModuleId('')
      setMessageType('success')
      setMessage('Módulo eliminado')
    } catch (error) {
      setMessageType('error')
      setMessage(error.message)
    }
  }

  return {
    moduleForm,
    setModuleForm,
    selectedModuleId,
    setSelectedModuleId,
    message,
    setMessage,
    messageType,
    handleModuleCreate,
    handleModuleUpdate,
    handleModuleDelete,
  }
}
