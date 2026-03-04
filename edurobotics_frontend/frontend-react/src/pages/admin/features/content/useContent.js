/**
 * useContent Custom Hook
 * 
 * Manages content state and operations for a specific unit.
 * Handles content addition, update, deletion, and reordering.
 */

import { useState } from 'react'
import { addUnitContent, updateUnitContent, deleteUnitContent, reorderContent } from '../../../../services/courses'

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

  const handleContentUpdate = async (contentId, payload, selectedCourse) => {
    if (!contentId || !selectedCourse) return
    setMessage(null)
    try {
      await updateUnitContent(adminToken, contentId, payload)
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

  const handleContentReorder = async (contentId, direction, selectedCourse) => {
    if (!selectedCourse) return
    try {
      await reorderContent(contentId, direction)
      await refreshSelectedCourse(selectedCourse.id)
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
    handleContentCreate: handleAddContent,
    handleContentUpdate,
    handleContentDelete,
    handleContentReorder,
  }
}
