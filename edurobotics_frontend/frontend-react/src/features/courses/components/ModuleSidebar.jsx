/**
 * ModuleSidebar Component
 *
 * Coursera-style sidebar navigation with collapsible modules and their units.
 * Shows mini progress bar per module and completion indicators per unit.
 * Redesigned with modern visual hierarchy, better spacing, and subtle animations.
 */

import { useState } from 'react'
import { BookOpen } from 'lucide-react'

export function ModuleSidebar({ modules, selectedUnitId, onUnitClick, getModuleProgress, getUnitProgress, progressData }) {
  const [expandedModules, setExpandedModules] = useState(
    modules.length > 0 ? { [modules[0].id]: true } : {}
  )

  const toggleModule = (moduleId) => {
    setExpandedModules(prev => ({ ...prev, [moduleId]: !prev[moduleId] }))
  }

  // Compute progress for a module
  const computeModuleProgress = (module) => {
    if (Array.isArray(progressData)) {
      const completedSet = new Set(
        progressData.filter(p => p.completed || p.is_completed).map(p => p.content_id)
      )
      const allContents = (module.units || []).flatMap(u => u.contents?.map(c => c.id) || [])
      const total = allContents.length
      const completed = allContents.filter(cid => completedSet.has(cid)).length
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
      return { total, completed, percentage }
    }
    return getModuleProgress ? getModuleProgress(module.id) : null
  }

  // Compute progress for a unit
  const computeUnitProgress = (unit) => {
    if (Array.isArray(progressData)) {
      const completedSet = new Set(
        progressData.filter(p => p.completed || p.is_completed).map(p => p.content_id)
      )
      const unitContents = unit.contents?.map(c => c.id) || []
      const total = unitContents.length
      const completed = unitContents.filter(cid => completedSet.has(cid)).length
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
      return { total, completed, percentage }
    }
    return getUnitProgress ? getUnitProgress(unit.id) : null
  }

  if (modules.length === 0) {
    return (
      <div className="py-8 text-center">
        <BookOpen className="w-8 h-8 text-gray-200 mx-auto mb-2" />
        <p className="text-sm text-gray-400">Sin módulos aún</p>
      </div>
    )
  }

  return (
    <div className="px-3">
      {modules.map((module) => {
        const progress = computeModuleProgress(module)
        const isCompleted = progress && progress.percentage === 100 && progress.total > 0
        const isExpanded = expandedModules[module.id]
        const percentage = progress?.percentage ?? 0

        return (
          <div key={module.id} className="mb-5">
            {/* Module: name + mono count + thin progress rule (no verbose subtitle) */}
            <button className="w-full text-left px-1 group" onClick={() => toggleModule(module.id)}>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[13.5px] font-semibold text-gray-800 leading-snug">
                  {module.title}
                </span>
                {progress && progress.total > 0 && (
                  <span className="font-mono text-[10.5px] text-gray-400 flex-shrink-0 tabular-nums">
                    {progress.completed}/{progress.total}
                  </span>
                )}
              </div>
              <div className="mt-1.5 h-[3px] rounded-full bg-gray-200/70 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-emerald-500' : 'bg-emerald-400'}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </button>

            {/* Units: clean rows, check circle, indigo accent on current */}
            {isExpanded && module.units && module.units.length > 0 && (
              <div className="mt-2.5 space-y-0.5">
                {module.units.map((unit) => {
                  const unitProgress = computeUnitProgress(unit)
                  const isUnitCompleted = unitProgress && unitProgress.percentage === 100 && unitProgress.total > 0
                  const isSelected = selectedUnitId === unit.id

                  return (
                    <button
                      key={unit.id}
                      onClick={() => onUnitClick(unit.id)}
                      className={`w-full text-left flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13.5px] transition-colors ${isSelected
                        ? 'bg-indigo-50 text-indigo-700 font-medium shadow-[inset_2.5px_0_0_0_#6366f1]'
                        : isUnitCompleted ? 'text-gray-700 hover:bg-gray-100/70' : 'text-gray-500 hover:bg-gray-100/70'
                        }`}
                    >
                      <span className={`w-[16px] h-[16px] rounded-full flex-shrink-0 grid place-items-center text-[9px] border ${isUnitCompleted
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : isSelected ? 'border-indigo-400 text-indigo-500' : 'border-gray-300 text-transparent'
                        }`}>
                        {isUnitCompleted ? '✓' : '•'}
                      </span>
                      <span className="truncate">{unit.title}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
