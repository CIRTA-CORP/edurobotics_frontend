/**
 * useContent Custom Hook
 * 
 * Manages content state and operations for a specific unit.
 * Handles content addition and deletion with confirmation dialogs.
 * Supports text, video (YouTube), and resource link content types.
 */

import { useState } from 'react'
import { addUnitContent, updateUnitContent, deleteUnitContent } from '../../../../services/courses'

export function useContent(adminToken, refreshSelectedCourse) {
  const [contentForm, setContentForm] = useState({ content_type: 'text', content_value: '', order_index: 1 })
  const [message, setMessage] = useState(null)
  const [messageType, setMessageType] = useState('success')

  const handleAddContent = async (event, selectedUnitId, selectedCourse) => {
    event.preventDefault()
    if (!selectedUnitId) return
    setMessage(null)
    try {
      await addUnitContent(adminToken, selectedUnitId, contentForm)
      setMessageType('success')
      setMessage('Contenido agregado')
      setContentForm({ content_type: 'text', content_value: '', order_index: 1 })
      await refreshSelectedCourse(selectedCourse?.id)
    } catch (error) {
      setMessageType('error')
      setMessage(error.message)
    }
  }

  const handleContentUpdate = async (event, contentId, selectedCourse) => {
    event.preventDefault()
    if (!contentId || !selectedCourse) return
    setMessage(null)
    try {
      await updateUnitContent(adminToken, contentId, contentForm)
      await refreshSelectedCourse(selectedCourse.id)
      setMessageType('success')
      setMessage('Contenido actualizado')
    } catch (error) {
      setMessageType('error')
      setMessage(error.message)
    }
  }

  const handleContentDelete = async (contentId, selectedCourse) => {
    if (!selectedCourse) return

    // Confirmation handled in parent component

    setMessage(null)
    try {
      await deleteUnitContent(adminToken, contentId)
      await refreshSelectedCourse(selectedCourse.id)
      setMessageType('success')
      setMessage('Contenido eliminado')
    } catch (error) {
      setMessageType('error')
      setMessage(error.message)
    }
  }

  return {
    contentForm,
    setContentForm,
    message,
    setMessage,
    messageType,
    handleAddContent,
    handleContentCreate: handleAddContent, // Alias for compatibility
    handleContentUpdate,
    handleContentDelete,
  }
}
