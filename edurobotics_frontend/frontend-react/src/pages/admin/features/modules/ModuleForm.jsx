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
  onToggle
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
        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
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
          className="w-24"
        />
      </div>

      <Button type="submit" className="w-full gap-1.5 bg-blue-600 hover:bg-blue-700">
        <Plus className="w-4 h-4" />
        Crear Módulo
      </Button>
    </form>
  )
}
