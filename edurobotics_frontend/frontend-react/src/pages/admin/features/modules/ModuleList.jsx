/**
 * Module List Component
 * 
 * Displays all modules within a selected course.
 * Provides actions to manage (edit) or delete modules.
 */

import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/ui/card'
import { Button } from '../../../../components/ui/button'
import { BookOpen, Settings, Trash2, Edit } from 'lucide-react'

export function ModuleList({
  modules,
  selectedModuleId,
  onModuleSelect,
  onModuleEdit,
  onModuleDelete
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Módulos del Curso
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {modules && modules.length > 0 ? (
            modules.map((module) => (
              <div
                key={module.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-white hover:shadow-sm transition-shadow"
              >
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{module.title}</h4>
                  <div className="flex items-center gap-4 mt-1">
                    <p className="text-sm text-gray-500">Orden: {module.order_index}</p>
                    <p className="text-sm text-gray-500">Unidades: {module.units?.length || 0}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => onModuleSelect(module)}
                    variant={selectedModuleId === module.id ? 'default' : 'outline'}
                    size="sm"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Gestionar
                  </Button>
                  <Button
                    onClick={() => onModuleEdit(module)}
                    variant="outline"
                    size="sm"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                  <Button
                    onClick={() => onModuleDelete(module.id)}
                    variant="destructive"
                    size="sm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 text-center py-8">Sin módulos aún</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
