/**
 * Unit Form Component
 * 
 * Form for creating new units within a module.
 * Collapsible section with title and order_index inputs.
 */

import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/ui/card'
import { Button } from '../../../../components/ui/button'
import { ChevronDown, ChevronRight, FileText } from 'lucide-react'

export function UnitForm({
  unitForm,
  setUnitForm,
  onSubmit,
  expanded,
  onToggle
}) {
  return (
    <Card>
      <CardHeader className="cursor-pointer" onClick={onToggle}>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Crear Nueva Unidad
          </div>
          {expanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </CardTitle>
      </CardHeader>
      {expanded && (
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título de la Unidad *
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={unitForm.title}
                onChange={(e) => setUnitForm({ ...unitForm, title: e.target.value })}
                required
                placeholder="Ej: Introducción a CSS"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción (opcional)
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={unitForm.description}
                onChange={(e) => setUnitForm({ ...unitForm, description: e.target.value })}
                rows={3}
                placeholder="Descripción breve de la unidad"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Orden *
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={unitForm.order_index}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '')
                  setUnitForm({ ...unitForm, order_index: val ? parseInt(val) : 1 })
                }}
                required
              />
            </div>

            <Button type="submit" className="w-full">
              Crear Unidad
            </Button>
          </form>
        </CardContent>
      )}
    </Card>
  )
}
