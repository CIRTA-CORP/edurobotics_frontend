/**
 * ModuleSidebar Component
 *
 * Coursera-style sidebar navigation with collapsible modules and their units.
 * Shows mini progress bar per module and completion indicators per unit.
 * Redesigned with modern visual hierarchy, better spacing, and subtle animations.
 */

import { useState } from 'react'
import { CheckCircle, ChevronDown, ChevronRight, PlayCircle, FileText, Link2, BookOpen, ClipboardCheck } from 'lucide-react'

const getUnitIcon = (unit) => {
  // If unit has a quiz, show quiz icon
  if (unit.quizzes?.length > 0 && (!unit.contents || unit.contents.length === 0)) {
    return <ClipboardCheck className="w-3.5 h-3.5 flex-shrink-0" />
  }
  const type = unit.contents?.[0]?.content_type
  switch (type) {
    case 'video': return <PlayCircle className="w-3.5 h-3.5 flex-shrink-0" />
    case 'text': return <FileText className="w-3.5 h-3.5 flex-shrink-0" />
    case 'resource': return <Link2 className="w-3.5 h-3.5 flex-shrink-0" />
    default: return <BookOpen className="w-3.5 h-3.5 flex-shrink-0" />
  }
}

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
    <div>
      {/* Modules list */}
      {modules.map((module, moduleIndex) => {
        const progress = computeModuleProgress(module)
        const isCompleted = progress && progress.percentage === 100 && progress.total > 0
        const isExpanded = expandedModules[module.id]
        const percentage = progress?.percentage ?? 0

        return (
          <div key={module.id} className="border-b border-gray-100 last:border-b-0">
            {/* Module header */}
            <button
              className="w-full text-left px-4 py-3 flex items-start gap-2.5 hover:bg-gray-50/80 transition-colors group"
              onClick={() => toggleModule(module.id)}
            >
              <div className="mt-0.5 flex-shrink-0">
                {isExpanded
                  ? <ChevronDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                  : <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-gray-800 leading-snug">
                    {module.title}
                  </span>
                  {isCompleted && (
                    <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  )}
                </div>
                <div className="text-[11px] text-gray-400 mt-0.5">
                  Módulo {moduleIndex + 1} · {module.units?.length || 0} unidades
                  {progress && progress.total > 0 && (
                    <span className="ml-1">· {progress.completed}/{progress.total}</span>
                  )}
                </div>
                {/* Mini progress bar */}
                {progress && progress.total > 0 && (
                  <div className="mt-1.5 w-full bg-gray-100 rounded-full h-1 overflow-hidden">
                    <div
                      className={`h-1 rounded-full transition-all duration-500 ${isCompleted ? 'bg-emerald-500' : 'bg-blue-400'}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                )}
              </div>
            </button>

            {/* Units list */}
            {isExpanded && module.units && module.units.length > 0 && (
              <div className="pb-1">
                {module.units.map((unit, unitIndex) => {
                  const unitProgress = computeUnitProgress(unit)
                  const isUnitCompleted = unitProgress && unitProgress.percentage === 100 && unitProgress.total > 0
                  const isSelected = selectedUnitId === unit.id

                  return (
                    <button
                      key={unit.id}
                      className={`w-full text-left px-4 py-2 pl-9 flex items-center gap-2.5 transition-all border-l-[3px] ${isSelected
                        ? 'bg-blue-50 border-l-blue-500'
                        : 'border-l-transparent hover:bg-gray-50'
                        }`}
                      onClick={() => onUnitClick(unit.id)}
                    >
                      {/* Icon */}
                      <div className={`${isSelected ? 'text-blue-600' : isUnitCompleted ? 'text-emerald-500' : 'text-gray-400'
                        }`}>
                        {isUnitCompleted
                          ? <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                          : getUnitIcon(unit)
                        }
                      </div>

                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <div className={`text-[13px] leading-snug truncate ${isSelected ? 'text-blue-700 font-medium' : 'text-gray-700'
                          }`}>
                          {unit.title}
                        </div>
                        <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-blue-400' : 'text-gray-400'}`}>
                          {moduleIndex + 1}.{unitIndex + 1}
                          {unit.contents?.length > 0 && (
                            <span> · {unit.contents.length} contenido{unit.contents.length !== 1 ? 's' : ''}</span>
                          )}
                          {unit.quizzes?.length > 0 && (
                            <span> · {unit.quizzes.length} eval.</span>
                          )}
                        </div>
                      </div>
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
