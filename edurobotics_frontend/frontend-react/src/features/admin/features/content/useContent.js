/**
 * useContent Custom Hook
 *
 * Manages TipTap rich content and legacy content operations for a unit.
 * Supports saving a single rich_text content per unit, migrating old
 * multi-block content into the rich editor, and deleting legacy blocks.
 */

import { useState } from 'react'
import { toast } from 'sonner'
import { addUnitContent, updateUnitContent, deleteUnitContent } from '@/features/courses/services/courses'

export function useContent(adminToken, refreshSelectedCourse) {
  const [saving, setSaving] = useState(false)

  /**
   * Save rich_text content for a unit.
   * Creates a new rich_text content if none exists, or updates the existing one.
   */
  const handleRichContentSave = async (html, selectedUnit, selectedCourse) => {
    if (!selectedUnit || !selectedCourse) return

    setSaving(true)
    try {
      // Find existing rich_text content for this unit
      const existingRich = selectedUnit.contents?.find(c => c.content_type === 'rich_text')

      if (existingRich) {
        // Update existing
        await updateUnitContent(adminToken, existingRich.id, { content_value: html })
      } else {
        // Create new
        await addUnitContent(adminToken, selectedUnit.id, {
          content_type: 'rich_text',
          content_value: html,
          order_index: 0 // rich_text always comes first
        })
      }

      await refreshSelectedCourse(selectedCourse.id)
      toast.success('Contenido guardado')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSaving(false)
    }
  }

  /**
   * Migrate legacy multi-block content into the rich_text editor.
   * Concatenates all legacy content (text, images, videos, files) into a single
   * HTML document, saves it as rich_text, then deletes the old blocks.
   */
  const handleMigrateLegacy = async (selectedUnit, selectedCourse) => {
    if (!selectedUnit || !selectedCourse) return

    const legacyContents = [...(selectedUnit.contents || [])]
      .filter(c => c.content_type !== 'rich_text')
      .sort((a, b) => a.order_index - b.order_index)

    if (legacyContents.length === 0) return

    setSaving(true)
    try {
      // Build combined HTML from legacy blocks
      const htmlParts = legacyContents.map(c => {
        switch (c.content_type) {
          case 'text':
            return c.content_value || ''
          case 'image': {
            const imgUrl = c.content_value?.startsWith('http')
              ? c.content_value
              : `${window.location.origin}${c.content_value}`
            return `<img src="${imgUrl}" alt="Contenido visual" />`
          }
          case 'video': {
            const videoId = c.content_value?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/)?.[1]
            if (videoId) {
              return `<div data-youtube-video><iframe src="https://www.youtube.com/embed/${videoId}" width="640" height="360" allowfullscreen></iframe></div>`
            }
            return `<p><a href="${c.content_value}" target="_blank" rel="noopener noreferrer">${c.content_value}</a></p>`
          }
          case 'file': {
            const fileUrl = c.content_value?.startsWith('http')
              ? c.content_value
              : `${window.location.origin}${c.content_value}`
            const fileName = c.content_value?.split('/').pop() || 'archivo'
            return `<div data-file-attachment="true" style="margin: 1rem 0;"><a href="${fileUrl}" target="_blank" rel="noopener noreferrer" download style="display: flex; align-items: center; gap: 12px; padding: 16px; background: linear-gradient(135deg, #fff1f2, #fff7ed); border: 1px solid rgba(244,63,94,.2); border-radius: 12px; text-decoration: none; color: inherit;"><span style="width: 44px; height: 44px; border-radius: 8px; background: white; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(244,63,94,.15); flex-shrink: 0; font-size: 18px;">📄</span><span><span style="display: block; font-size: 14px; font-weight: 600; color: #1f2937;">Descargar ${fileName}</span></span></a></div>`
          }
          case 'resource':
            return `<p><a href="${c.content_value}" target="_blank" rel="noopener noreferrer">${c.content_value}</a></p>`
          default:
            return c.content_value || ''
        }
      })

      const combinedHtml = htmlParts.join('\n')

      // Get existing rich_text or combine with it
      const existingRich = selectedUnit.contents?.find(c => c.content_type === 'rich_text')
      const finalHtml = existingRich
        ? existingRich.content_value + '\n' + combinedHtml
        : combinedHtml

      // Save as rich_text
      if (existingRich) {
        await updateUnitContent(adminToken, existingRich.id, { content_value: finalHtml })
      } else {
        await addUnitContent(adminToken, selectedUnit.id, {
          content_type: 'rich_text',
          content_value: finalHtml,
          order_index: 0
        })
      }

      // Delete legacy blocks
      for (const content of legacyContents) {
        await deleteUnitContent(adminToken, content.id)
      }

      await refreshSelectedCourse(selectedCourse.id)
      toast.success(`${legacyContents.length} contenidos migrados al editor`)
    } catch (error) {
      toast.error(`Error al migrar: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  /**
   * Delete a specific content block (used for legacy content cleanup)
   */
  const handleContentDelete = async (contentId, selectedCourse) => {
    if (!selectedCourse) return
    try {
      await deleteUnitContent(adminToken, contentId)
      await refreshSelectedCourse(selectedCourse.id)
      toast.success('Contenido eliminado')
    } catch (error) {
      toast.error(error.message)
    }
  }

  return {
    saving,
    handleRichContentSave,
    handleMigrateLegacy,
    handleContentDelete,
  }
}
