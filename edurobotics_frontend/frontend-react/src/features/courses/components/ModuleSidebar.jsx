/**
 * ModuleSidebar — the course index as a line of modules.
 *
 * Each module is a node on a vertical line: the current one is open and shows
 * its units with a progress rule, finished ones collapse with a green node, and
 * the ones still ahead stay dimmed. Units carry an icon for their material type
 * and their estimated duration when the content declares one.
 */

import { useState } from 'react'
import {
  BookOpen, Check, ChevronDown, ClipboardCheck, Cpu,
  FileDown, FileText, Link2, PlayCircle,
} from 'lucide-react'
import { completedContentIdSet, unitProgressOf } from '@/features/courses/lib/unitCompletion'

/** Icon for a unit, picked from the material it holds. */
function unitIcon(unit) {
  const types = new Set((unit.contents || []).map(c => c.content_type))
  if (types.has('simulator')) return Cpu
  if (types.has('video')) return PlayCircle
  if (types.has('file')) return FileDown
  if (types.has('resource')) return Link2
  if (types.has('rich_text') || types.has('text')) return FileText
  if (unit.quizzes?.length > 0) return ClipboardCheck
  return BookOpen
}

/** Minutes declared by the unit's contents, or null when none declare any. */
function unitMinutes(unit) {
  const total = (unit.contents || [])
    .reduce((sum, c) => sum + (Number(c.duration_minutes) || 0), 0)
  return total > 0 ? total : null
}

export function ModuleSidebar({ modules, selectedUnitId, onUnitClick, getModuleProgress, getUnitProgress, progressData }) {
  const currentModule = modules.find(m => m.units?.some(u => u.id === selectedUnitId))

  // The module being studied is open by default; state only records the modules
  // the reader opened or closed by hand, so following the course never fights
  // with a stored value.
  const [overrides, setOverrides] = useState({})
  const toggleModule = (moduleId, isOpen) => {
    setOverrides(prev => ({ ...prev, [moduleId]: !isOpen }))
  }

  const completedIds = completedContentIdSet(progressData)

  const computeModuleProgress = (module) => {
    if (!completedIds) return getModuleProgress?.(module.id) ?? null
    const ids = (module.units || []).flatMap(u => u.contents?.map(c => c.id) || [])
    const completed = ids.filter(id => completedIds.has(id)).length
    return {
      total: ids.length,
      completed,
      percentage: ids.length > 0 ? Math.round((completed / ids.length) * 100) : 0,
    }
  }

  const computeUnitProgress = (unit) => unitProgressOf(unit, completedIds, getUnitProgress)

  if (modules.length === 0) {
    return (
      <div className="py-8 text-center">
        <BookOpen className="w-8 h-8 text-gray-200 mx-auto mb-2" />
        <p className="text-sm text-gray-400">Sin módulos aún</p>
      </div>
    )
  }

  return (
    <nav className="px-3" aria-label="Índice del curso">
      {modules.map((module, moduleIndex) => {
        const progress = computeModuleProgress(module)
        const isCompleted = progress && progress.total > 0 && progress.percentage === 100
        const isCurrent = currentModule?.id === module.id
        const isExpanded = overrides[module.id] ?? isCurrent
        const isAhead = !isCurrent && !isCompleted
        const hasLine = moduleIndex < modules.length - 1

        return (
          <div key={module.id} className="relative pl-9">
            {/* Line joining this module's node with the next one */}
            {hasLine && (
              <div className="absolute left-[11px] top-8 -bottom-3 w-px bg-gray-200" aria-hidden="true" />
            )}

            <button
              onClick={() => toggleModule(module.id, isExpanded)}
              aria-expanded={isExpanded}
              className="w-full text-left block py-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg"
            >
              {/* Node */}
              <span
                className={`absolute left-0 w-[23px] h-[23px] rounded-full grid place-items-center text-[10px] font-semibold border transition-colors ${
                  isCompleted
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : isCurrent
                      ? 'bg-white border-indigo-500 text-indigo-600'
                      : 'bg-white border-gray-200 text-gray-400'
                }`}
                aria-hidden="true"
              >
                {isCompleted ? <Check className="w-3 h-3" strokeWidth={3} /> : moduleIndex + 1}
              </span>

              <span className="flex items-center gap-2 min-h-[24px]">
                <span className={`flex-1 text-[13.5px] leading-snug font-semibold ${
                  isAhead ? 'text-gray-500' : 'text-gray-800'
                }`}>
                  {module.title}
                </span>
                {isCompleted ? (
                  <span className="font-mono text-[9.5px] font-semibold tracking-wider text-emerald-600 flex-shrink-0">
                    LISTO
                  </span>
                ) : progress && progress.total > 0 && (
                  <span className="font-mono text-[10.5px] text-gray-400 tabular-nums flex-shrink-0">
                    {progress.completed}/{progress.total}
                  </span>
                )}
                <ChevronDown
                  className={`w-3.5 h-3.5 text-gray-300 flex-shrink-0 transition-transform ${isExpanded ? '' : '-rotate-90'}`}
                  aria-hidden="true"
                />
              </span>
            </button>

            {isExpanded && module.units?.length > 0 && (
              <div className="pb-4">
                {/* Module progress rule */}
                {progress && progress.total > 0 && (
                  <div className="h-[3px] rounded-full bg-gray-200/70 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-emerald-500' : 'bg-emerald-400'}`}
                      style={{ width: `${progress.percentage}%` }}
                    />
                  </div>
                )}

                <ul className="mt-2.5 space-y-0.5">
                  {module.units.map((unit) => {
                    const unitProgress = computeUnitProgress(unit)
                    const isUnitCompleted = unitProgress && unitProgress.total > 0 && unitProgress.percentage === 100
                    const isSelected = selectedUnitId === unit.id
                    const Icon = unitIcon(unit)
                    const minutes = unitMinutes(unit)

                    return (
                      <li key={unit.id}>
                        <button
                          onClick={() => onUnitClick(unit.id)}
                          aria-current={isSelected ? 'true' : undefined}
                          className={`w-full text-left flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13.5px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                            isSelected
                              ? 'bg-indigo-50 text-indigo-700 font-medium shadow-[inset_2.5px_0_0_0_#6366f1]'
                              : isUnitCompleted
                                ? 'text-gray-700 hover:bg-gray-100/70'
                                : 'text-gray-500 hover:bg-gray-100/70'
                          }`}
                        >
                          <span
                            className={`w-[18px] h-[18px] rounded-full grid place-items-center flex-shrink-0 border ${
                              isUnitCompleted
                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                : isSelected
                                  ? 'border-indigo-300 text-indigo-500'
                                  : 'border-gray-200 text-gray-400'
                            }`}
                            aria-hidden="true"
                          >
                            {isUnitCompleted
                              ? <Check className="w-2.5 h-2.5" strokeWidth={3} />
                              : <Icon className="w-2.5 h-2.5" />}
                          </span>
                          <span className="flex-1 truncate">{unit.title}</span>
                          {minutes && (
                            <span className="font-mono text-[10px] text-gray-400 tabular-nums flex-shrink-0">
                              {minutes} min
                            </span>
                          )}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
          </div>
        )
      })}
    </nav>
  )
}
