/**
 * Module List Component
 *
 * Displays all modules within a selected course.
 * Provides actions to manage (edit) or delete modules.
 * Styled consistently with UnitList component.
 */

import { Button } from '@/shared/components/button'
import { ModuleListSkeleton } from '@/shared/components/Skeleton'
import { Settings, Trash2, Edit, Layers } from 'lucide-react'

export function ModuleList({
  modules,
  selectedModuleId,
  onModuleSelect,
  onModuleEdit,
  onModuleDelete,
  onModuleQuiz,
  isLoading = false,
}) {
  if (isLoading) return <ModuleListSkeleton />
  return (
    <div>
      {modules && modules.length > 0 ? (
        <div className="space-y-3">
          {modules.map((module, index) => {
            const isSelected = selectedModuleId === module.id
            const unitCount = module.units?.length || 0

            return (
              <div
                key={module.id}
                className={`p-4 rounded-xl border transition-all duration-200 ${isSelected
                  ? 'border-indigo-200 bg-indigo-50/50 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                  }`}
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Left: Info */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${isSelected ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-500'
                      }`}>
                      {module.order_index || index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 text-sm truncate">{module.title || 'Módulo sin título'}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                          <Layers className="w-3 h-3" />
                          {unitCount} {unitCount === 1 ? 'unidad' : 'unidades'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <Button
                      onClick={() => onModuleSelect(module)}
                      variant={isSelected ? 'default' : 'outline'}
                      size="sm"
                      className="text-xs"
                    >
                      <Settings className="w-3.5 h-3.5 mr-1" />
                      Gestionar
                    </Button>
                    <Button
                      onClick={() => onModuleEdit(module)}
                      variant="ghost"
                      size="sm"
                      className="text-gray-500 hover:text-indigo-600"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      onClick={() => onModuleDelete(module.id)}
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12 rounded-xl border-2 border-dashed border-gray-200">
          <Layers className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-400 font-medium">Sin módulos aún</p>
          <p className="text-xs text-gray-400 mt-1">Crea un módulo para comenzar</p>
        </div>
      )}
    </div>
  )
}
