/**
 * useProgress Custom Hook
 * 
 * Manages user progress state and operations.
 * Handles marking content as complete and tracking progress.
 */

import { useState, useEffect, useCallback } from 'react'
import { markContentComplete, updateLastAccessed, getUserProgress } from '../services/progress'

export function useProgress(userId, courseId = null) {
  const [progress, setProgress] = useState({})
  const [passedQuizIds, setPassedQuizIds] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchProgress = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      const result = await getUserProgress(userId, courseId)
      if (result.success) {
        setProgress(result.progress)
        setPassedQuizIds(result.passed_quiz_ids || [])
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [userId, courseId])

  const refreshProgress = useCallback(() => fetchProgress(), [fetchProgress])

  useEffect(() => {
    fetchProgress()
  }, [fetchProgress])

  // Mark content as complete
  const markComplete = useCallback(async (contentId) => {
    if (!userId || !contentId) return { success: false }

    try {
      const result = await markContentComplete(userId, contentId)
      if (result.success) {
        // Refresh progress
        fetchProgress()
      }
      return result
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    }
  }, [userId, fetchProgress])

  // Update last accessed
  const updateAccess = useCallback(async (contentId) => {
    if (!userId || !contentId) return { success: false }

    try {
      const result = await updateLastAccessed(userId, contentId)
      return result
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [userId])

  // Check if content is completed
  const isContentCompleted = useCallback((contentId) => {
    try {
      if (Array.isArray(progress)) {
        const found = progress.find(p => p.content_id === contentId)
        return !!(found && (found.completed || found.is_completed))
      }

      for (const courseData of Object.values(progress)) {
        for (const moduleData of Object.values(courseData.modules || {})) {
          for (const unitData of Object.values(moduleData.units || {})) {
            const content = unitData.contents?.find(c => c.content_id === contentId)
            if (content) {
              return !!(content.completed || content.is_completed)
            }
          }
        }
      }
    } catch (e) {
      return false
    }
    return false
  }, [progress])

  // Check if quiz is completed
  const isQuizCompleted = useCallback((quizId) => {
    return passedQuizIds.includes(quizId)
  }, [passedQuizIds])

  // Get module progress
  const getModuleProgress = useCallback((moduleId) => {
    for (const courseData of Object.values(progress)) {
      const moduleData = courseData.modules?.[moduleId]
      if (moduleData) {
        return {
          total: moduleData.total || 0,
          completed: moduleData.completed || 0,
          percentage: moduleData.percentage || 0
        }
      }
    }
    return { total: 0, completed: 0, percentage: 0 }
  }, [progress])

  // Get unit progress
  const getUnitProgress = useCallback((unitId) => {
    for (const courseData of Object.values(progress)) {
      for (const moduleData of Object.values(courseData.modules || {})) {
        const unitData = moduleData.units?.[unitId]
        if (unitData) {
          return {
            total: unitData.total || 0,
            completed: unitData.completed || 0,
            percentage: unitData.percentage || 0
          }
        }
      }
    }
    return { total: 0, completed: 0, percentage: 0 }
  }, [progress])

  // Get course progress
  const getCourseProgress = useCallback((courseId) => {
    const courseData = progress[courseId]
    if (!courseData) {
      return { total: 0, completed: 0, percentage: 0 }
    }

    return {
      total: courseData.total_contents || 0,
      completed: courseData.completed_contents || 0,
      percentage: courseData.total_contents > 0
        ? Math.round((courseData.completed_contents / courseData.total_contents) * 100)
        : 0
    }
  }, [progress])

  return {
    progress,
    loading,
    error,
    markComplete,
    updateAccess,
    isContentCompleted,
    isQuizCompleted,
    getModuleProgress,
    getUnitProgress,
    getCourseProgress,
    refreshProgress,
  }
}
