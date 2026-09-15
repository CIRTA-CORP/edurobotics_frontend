/**
 * Shared "is this unit complete?" reading of the progress payload.
 *
 * The progress hook returns either a flat array of progress rows or its own
 * per-unit summary, depending on the endpoint that answered. Both the index and
 * the course top bar need the same answer, so the branching lives here instead
 * of being re-derived in each component.
 *
 * A unit counts as complete when it has contents and every one of them is done —
 * the same rule the lesson footer uses to decide whether to offer "mark as read".
 */

/** Set of completed content ids, or null when progress isn't the array shape. */
export function completedContentIdSet(progressData) {
  if (!Array.isArray(progressData)) return null
  return new Set(
    progressData.filter(p => p.completed || p.is_completed).map(p => p.content_id),
  )
}

/** Progress `{ total, completed, percentage }` for a unit, or null if unknown. */
export function unitProgressOf(unit, completedIds, getUnitProgress) {
  if (completedIds) {
    const ids = unit.contents?.map(c => c.id) || []
    const completed = ids.filter(id => completedIds.has(id)).length
    return {
      total: ids.length,
      completed,
      percentage: ids.length > 0 ? Math.round((completed / ids.length) * 100) : 0,
    }
  }
  return getUnitProgress?.(unit.id) ?? null
}

export function isUnitComplete(unit, completedIds, getUnitProgress) {
  const p = unitProgressOf(unit, completedIds, getUnitProgress)
  return !!p && p.total > 0 && p.percentage === 100
}

/** How many of `units` are complete. */
export function countCompletedUnits(units, progressData, getUnitProgress) {
  const completedIds = completedContentIdSet(progressData)
  return units.filter(u => isUnitComplete(u, completedIds, getUnitProgress)).length
}
