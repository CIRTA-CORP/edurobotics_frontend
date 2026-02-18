/**
 * Module Sidebar Component
 * 
 * Sidebar navigation displaying collapsible modules with their units.
 * Modules can be expanded/collapsed, units can be selected to view content.
 */

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card'
import { BookOpen, CheckCircle, ChevronRight, ChevronDown } from 'lucide-react'

export function ModuleSidebar({ modules, selectedUnitId, onUnitClick, getModuleProgress, getUnitProgress, progressData }) {
  const [expandedModules, setExpandedModules] = useState(
    // Expandir el primer módulo por defecto
    modules.length > 0 ? { [modules[0].id]: true } : {}
  )

  const toggleModule = (moduleId) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Módulos del curso
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {modules.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">Sin módulos aún</p>
          ) : (
            modules.map((module, moduleIndex) => {
              // Compute progress info, supporting two shapes:
              // - progressData as array of { content_id, completed }
              // - progress provided by getModuleProgress/getUnitProgress (nested)
              let moduleProgress = null
              let isModuleCompleted = false
              if (Array.isArray(progressData)) {
                const completedSet = new Set(progressData.filter(p => p.completed || p.is_completed).map(p => p.content_id))
                const moduleContents = (module.units || []).flatMap(u => u.contents?.map(c => c.id) || [])
                const total = moduleContents.length
                const completed = moduleContents.filter(cid => completedSet.has(cid)).length
                const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
                moduleProgress = { total, completed, percentage }
                isModuleCompleted = percentage === 100 && total > 0
              } else {
                moduleProgress = getModuleProgress ? getModuleProgress(module.id) : null
                isModuleCompleted = moduleProgress && moduleProgress.percentage === 100
              }
              const isExpanded = expandedModules[module.id]

              return (
                <div key={module.id} className="border rounded-lg overflow-hidden">
                  {/* Módulo Header - Colapsable */}
                  <button
                    className={`w-full text-left p-3 transition-all flex items-center justify-between ${
                      isModuleCompleted 
                        ? 'bg-green-50 hover:bg-green-100 border-green-200'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                    onClick={() => toggleModule(module.id)}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-600" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-600" />
                      )}
                      <div className="flex-1">
                        <div className="font-medium text-sm">{module.title}</div>
                        <div className={`text-xs ${isModuleCompleted ? 'text-green-700' : 'text-gray-500'}`}>
                          Módulo {moduleIndex + 1} · {module.units?.length || 0} unidades
                          {moduleProgress && moduleProgress.total > 0 && (
                              <span className="ml-1">({moduleProgress.completed}/{moduleProgress.total})</span>
                            )}
                        </div>
                      </div>
                      {isModuleCompleted && (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                  </button>

                  {/* Unidades - Solo visible cuando el módulo está expandido */}
                  {isExpanded && module.units && module.units.length > 0 && (
                    <div className="bg-white">
                      {module.units.map((unit, unitIndex) => {
                        let unitProgress = null
                        let isUnitCompleted = false
                        if (Array.isArray(progressData)) {
                          const completedSet = new Set(progressData.filter(p => p.completed || p.is_completed).map(p => p.content_id))
                          const unitContents = unit.contents?.map(c => c.id) || []
                          const totalU = unitContents.length
                          const completedU = unitContents.filter(cid => completedSet.has(cid)).length
                          const percentageU = totalU > 0 ? Math.round((completedU / totalU) * 100) : 0
                          unitProgress = { total: totalU, completed: completedU, percentage: percentageU }
                          isUnitCompleted = percentageU === 100 && totalU > 0
                        } else {
                          unitProgress = getUnitProgress ? getUnitProgress(unit.id) : null
                          isUnitCompleted = unitProgress && unitProgress.percentage === 100
                        }
                        const isSelected = selectedUnitId === unit.id

                        return (
                          <button
                            key={unit.id}
                            className={`w-full text-left p-3 pl-8 border-t transition-all flex items-center justify-between ${
                              isSelected
                                ? 'bg-black text-white'
                                : isUnitCompleted
                                  ? 'bg-green-50/50 hover:bg-green-100'
                                  : 'hover:bg-gray-50'
                            }`}
                            onClick={() => onUnitClick(unit.id)}
                          >
                            <div className="flex-1">
                              <div className="font-medium text-sm">{unit.title}</div>
                              <div className={`text-xs ${
                                isSelected ? 'text-gray-300' : isUnitCompleted ? 'text-green-700' : 'text-gray-500'
                              }`}>
                                Unidad {moduleIndex + 1}.{unitIndex + 1} · {unit.contents?.length || 0} contenidos
                                {unitProgress && unitProgress.total > 0 && (
                                  <span className="ml-1">({unitProgress.completed}/{unitProgress.total})</span>
                                )}
                              </div>
                            </div>
                            {isUnitCompleted && (
                              <CheckCircle className={`w-4 h-4 ${
                                isSelected ? 'text-white' : 'text-green-600'
                              }`} />
                            )}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  )
}
