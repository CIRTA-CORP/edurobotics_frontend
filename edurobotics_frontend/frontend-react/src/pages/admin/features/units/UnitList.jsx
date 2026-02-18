/**
 * Unit List Component
 * 
 * Displays all units within a selected module.
 * Provides actions to manage (select) or delete units.
 */

import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/ui/card'
import { Button } from '../../../../components/ui/button'
import { FileText, Settings, Trash2, Edit } from 'lucide-react'

export function UnitList({
  units,
  selectedUnitId,
  onUnitSelect,
  onUnitEdit,
  onUnitDelete
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Unidades del Módulo
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {units && units.length > 0 ? (
            units.map((unit) => (
              <div
                key={unit.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-white hover:shadow-sm transition-shadow"
              >
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{unit.title}</h4>
                  <div className="flex items-center gap-4 mt-1">
                    <p className="text-sm text-gray-500">Orden: {unit.order_index}</p>
                    <p className="text-sm text-gray-500">Contenidos: {unit.contents?.length || 0}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => onUnitSelect(unit)}
                    variant={selectedUnitId === unit.id ? 'default' : 'outline'}
                    size="sm"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Gestionar
                  </Button>
                  <Button
                    onClick={() => onUnitEdit(unit)}
                    variant="outline"
                    size="sm"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                  <Button
                    onClick={() => onUnitDelete(unit.id, unit.title)}
                    variant="destructive"
                    size="sm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 text-center py-8">Sin unidades aún</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
