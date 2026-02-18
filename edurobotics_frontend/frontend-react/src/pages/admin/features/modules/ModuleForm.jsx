/**
 * Module Form Component
 * 
 * Form for creating new modules within a course.
 * Captures module title and position/order within the course.
 */

import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/ui/card'
import { Button } from '../../../../components/ui/button'
import { Input } from '../../../../components/ui/input'
import { Plus, ChevronDown, ChevronUp } from 'lucide-react'

export function ModuleForm({
  moduleForm,
  setModuleForm,
  onSubmit,
  expanded,
  onToggle
}) {
  return (
    <Card>
      <CardHeader
        className="cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Crear Módulo
          </CardTitle>
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </div>
      </CardHeader>
      {expanded && (
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título del Módulo *
              </label>
              <Input
                type="text"
                placeholder="Ej: Introducción a Tailwind CSS"
                value={moduleForm.title}
                onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción (opcional)
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={moduleForm.description}
                onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                rows={3}
                placeholder="Descripción del módulo"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Orden *
              </label>
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="1"
                value={moduleForm.order_index}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '')
                  setModuleForm({ ...moduleForm, order_index: val ? parseInt(val, 10) : 1 })
                }}
                required
              />
            </div>

            <Button type="submit" className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Crear Módulo
            </Button>
          </form>
        </CardContent>
      )}
    </Card>
  )
}
