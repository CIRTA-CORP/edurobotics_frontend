/**
 * ModuleSidebar Component
 *
 * Coursera-style sidebar navigation with collapsible modules and their units.
 * Shows mini progress bar per module and completion indicators per unit.
 */

import { useState } from 'react'
import { CheckCircle, ChevronDown, ChevronRight, PlayCircle, FileText, Link2, BookOpen } from 'lucide-react'

const getUnitIcon = (unit) => {
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
      <div className="py-6 text-center text-sm text-gray-400">
        Sin módulos aún
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-100">
      {/* Section header */}
      <div className="px-4 py-3">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Material del Curso
        </h3>
      </div>

      {/* Modules list */}
      <div>
        {modules.map((module, moduleIndex) => {
          const progress = computeModuleProgress(module)
          const isCompleted = progress && progress.percentage === 100 && progress.total > 0
          const isExpanded = expandedModules[module.id]
          const percentage = progress?.percentage ?? 0

          return (
            <div key={module.id} className="border-b border-gray-100 last:border-b-0">
              {/* Module header */}
              <button
                className="w-full text-left px-4 py-3 flex items-start gap-2 hover:bg-gray-50 transition-colors group"
                onClick={() => toggleModule(module.id)}
              >
                <div className="mt-0.5 flex-shrink-0">
                  {isExpanded
                    ? <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                    : <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-gray-800 leading-snug">
                      {module.title}
                    </span>
                    {isCompleted && (
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    )}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    Módulo {moduleIndex + 1} · {module.units?.length || 0} unidades
                    {progress && progress.total > 0 && (
                      <span className="ml-1">· {progress.completed}/{progress.total} completados</span>
                    )}
                  </div>
                  {/* Mini progress bar */}
                  {progress && progress.total > 0 && (
                    <div className="mt-1.5 w-full bg-gray-200 rounded-full h-1">
                      <div
                        className={`h-1 rounded-full transition-all duration-300 ${isCompleted ? 'bg-green-500' : 'bg-blue-400'}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  )}
                </div>
              </button>

              {/* Units list */}
              {isExpanded && module.units && module.units.length > 0 && (
                <div className="bg-gray-50/50">
                  {module.units.map((unit, unitIndex) => {
                    const unitProgress = computeUnitProgress(unit)
                    const isUnitCompleted = unitProgress && unitProgress.percentage === 100 && unitProgress.total > 0
                    const isSelected = selectedUnitId === unit.id

                    return (
                      <button
                        key={unit.id}
                        className={`w-full text-left px-4 py-2.5 pl-10 flex items-start gap-2.5 transition-colors border-l-2 ${isSelected
                            ? 'bg-blue-50 border-l-blue-500'
                            : 'border-l-transparent hover:bg-gray-100'
                          }`}
                        onClick={() => onUnitClick(unit.id)}
                      >
                        {/* Icon */}
                        <div className={`mt-0.5 ${isSelected ? 'text-blue-600' : isUnitCompleted ? 'text-green-500' : 'text-gray-400'}`}>
                          {isUnitCompleted
                            ? <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                            : getUnitIcon(unit)
                          }
                        </div>

                        {/* Text */}
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm leading-snug truncate ${isSelected ? 'text-blue-700 font-medium' : 'text-gray-700'
                            }`}>
                            {unit.title}
                          </div>
                          <div className={`text-xs mt-0.5 ${isSelected ? 'text-blue-500' : 'text-gray-400'}`}>
                            Unidad {moduleIndex + 1}.{unitIndex + 1}
                            {unit.contents?.length > 0 && (
                              <span> · {unit.contents.length} contenido{unit.contents.length !== 1 ? 's' : ''}</span>
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
    </div>
  )
}
