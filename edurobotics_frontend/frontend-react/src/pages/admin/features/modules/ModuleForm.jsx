/**
 * Module Form Component
 *
 * Form for creating/editing modules within a course.
 * Redesigned with modern labels, consistent spacing, and improved inputs.
 */

import { Card, CardContent } from '../../../../components/ui/card'
import { Button } from '../../../../components/ui/button'
import { Input } from '../../../../components/ui/input'
import { Plus, Layers } from 'lucide-react'

export function ModuleForm({
  moduleForm,
  setModuleForm,
  onSubmit,
  expanded,
  onToggle,
  mode = 'create',
  isSubmitting = false
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Title */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
          Título del módulo *
        </label>
        <Input
          type="text"
          placeholder="Ej: Introducción a sensores"
          value={moduleForm.title}
          onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
          required
        />
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
          Descripción <span className="text-gray-400 normal-case">(opcional)</span>
        </label>
        <textarea
          className="flex min-h-[80px] w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors resize-none"
          value={moduleForm.description}
          onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
          rows={3}
          placeholder="Descripción breve del módulo"
        />
      </div>

      {/* Order */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-1">
          Orden *
          <span className="text-gray-400 group relative inline-flex justify-center cursor-help">
            <span className="w-3 h-3 rounded-full border border-gray-400 flex items-center justify-center text-[9px]">?</span>
            <span className="absolute bottom-full mb-1 hidden group-hover:block w-48 p-2 bg-gray-800 text-white text-xs rounded-md shadow-lg z-10 text-center normal-case">
              Determina la posición en la que el estudiante verá este módulo (1, 2, 3...)
            </span>
          </span>
        </label>
        <Input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="1"
          value={moduleForm.order_index}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, '')
            setModuleForm({ ...moduleForm, order_index: val === '' ? '' : parseInt(val, 10) })
          }}
          required
          className="w-24"
        />
      </div>

      <Button
        type="submit"
        className="w-full gap-1.5 bg-blue-600 hover:bg-blue-700"
        disabled={isSubmitting}
      >
        <Plus className="w-4 h-4" />
        {isSubmitting ? 'Guardando...' : (mode === 'edit' ? 'Guardar Cambios' : 'Crear Módulo')}
      </Button>
    </form>
  )
}
