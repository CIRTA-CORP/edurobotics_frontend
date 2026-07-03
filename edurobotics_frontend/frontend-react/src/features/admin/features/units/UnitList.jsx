/**
 * Unit List Component
 *
 * Displays all units within a selected module with improved visuals.
 * Provides actions to manage (select) or delete units.
 */

import { Button } from '@/shared/components/button'
import { UnitListSkeleton } from '@/shared/components/Skeleton'
import { FileText, Settings, Trash2, Edit, Package, ClipboardCheck } from 'lucide-react'

export function UnitList({
  units,
  selectedUnitId,
  onUnitSelect,
  onUnitEdit,
  onUnitDelete,
  onUnitQuiz,
  isLoading = false,
}) {
  if (isLoading) return <UnitListSkeleton />
  return (
    <div>
      {units && units.length > 0 ? (
        <div className="space-y-3">
          {units.map((unit, index) => {
            const isSelected = selectedUnitId === unit.id
            const contentCount = unit.contents?.length || 0

            return (
              <div
                key={unit.id}
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
                      {unit.order_index || index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 text-sm truncate">{unit.title}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                          <Package className="w-3 h-3" />
                          {contentCount} contenido{contentCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <Button
                      onClick={() => onUnitSelect(unit)}
                      variant={isSelected ? 'default' : 'outline'}
                      size="sm"
                      className="text-xs"
                    >
                      <Settings className="w-3.5 h-3.5 mr-1" />
                      Gestionar
                    </Button>
                    <Button
                      onClick={() => onUnitQuiz(unit)}
                      variant="outline"
                      size="sm"
                      className="text-xs border-indigo-100 text-indigo-600 hover:bg-indigo-50"
                    >
                      <ClipboardCheck className="w-3.5 h-3.5 mr-1" />
                      Examen
                    </Button>
                    <Button
                      onClick={() => onUnitEdit(unit)}
                      variant="ghost"
                      size="sm"
                      className="text-gray-500 hover:text-indigo-600"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      onClick={() => onUnitDelete(unit.id, unit.title)}
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
          <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-400 font-medium">Sin unidades aún</p>
          <p className="text-xs text-gray-400 mt-1">Crea una unidad para comenzar</p>
        </div>
      )}
    </div>
  )
}
