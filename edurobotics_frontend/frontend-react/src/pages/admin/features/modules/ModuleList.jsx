/**
 * Module List Component
 *
 * Displays all modules within a selected course with improved visuals.
 * Provides actions to manage (edit) or delete modules.
 */

import { Button } from '../../../../components/ui/button'
import { Settings, Trash2, Edit3, Layers, ClipboardCheck, BookOpen } from 'lucide-react'

export function ModuleList({
  modules,
  selectedModuleId,
  onModuleSelect,
  onModuleEdit,
  onModuleDelete,
  onModuleQuiz
}) {
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
                  ? 'border-slate-300 bg-slate-50 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                  }`}
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Left: Info */}
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-black shadow-sm ${isSelected ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-500'
                      }`}>
                      {module.order_index || index + 1}
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <h4 className="font-bold text-gray-900 text-sm truncate">{module.title || 'Módulo sin título'}</h4>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-500 bg-gray-100/50 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                          <Layers className="w-2.5 h-2.5" />
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
                      className={`text-xs font-bold rounded-xl transition-all ${isSelected ? 'bg-slate-800 hover:bg-black shadow-md' : ''}`}
                    >
                      <Settings className="w-3.5 h-3.5 mr-1" />
                      Gestionar
                    </Button>
                    <div className="flex items-center ml-1 border-l border-gray-100 pl-1.5">
                      <Button
                        onClick={() => onModuleEdit(module)}
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-slate-900 rounded-lg p-2 h-auto"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        onClick={() => onModuleDelete(module.id)}
                        variant="ghost"
                        size="sm"
                        className="text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg p-2 h-auto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/50">
          <Layers className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400 font-bold">Sin módulos aún</p>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest">Añade tu primer módulo</p>
        </div>
      )}
    </div>
  )
}
