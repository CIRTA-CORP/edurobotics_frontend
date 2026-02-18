/**
 * Course Form Component
 * 
 * Dual-mode form for creating new courses or editing existing ones.
 * Handles course details including title, description, level, version, and prerequisites.
 */

import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/ui/card'
import { Button } from '../../../../components/ui/button'
import { Input } from '../../../../components/ui/input'
import { Plus, Settings, Save, Trash2, ChevronDown, ChevronUp } from 'lucide-react'

export function CourseForm({
  mode,
  courseForm,
  setCourseForm,
  prereqIds,
  setPrereqIds,
  onSubmit,
  onDelete,
  onPrereqSave,
  selectedCourse,
  expanded,
  onToggle
}) {
  const isCreateMode = mode === 'create'

  return (
    <Card>
      <CardHeader
        className="cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {isCreateMode ? (
              <>
                <Plus className="w-5 h-5" />
                Crear Nuevo Curso
              </>
            ) : (
              <>
                <Settings className="w-5 h-5" />
                Editar Curso: {selectedCourse?.title}
              </>
            )}
          </CardTitle>
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className={isCreateMode ? '' : 'space-y-6'}>
          <form onSubmit={onSubmit} className="space-y-4">
            <Input
              type="text"
              placeholder="Título del curso"
              value={courseForm.title}
              onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
              required
            />
            <textarea
              placeholder="Descripción"
              value={courseForm.description}
              onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
              className="flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
            />
            {isCreateMode && (
              <select
                value={courseForm.level}
                onChange={(e) => setCourseForm({ ...courseForm, level: e.target.value })}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="beginner">Principiante</option>
                <option value="intermediate">Intermedio</option>
                <option value="advanced">Avanzado</option>
              </select>
            )}
            {isCreateMode ? (
              <Button type="submit">
                <Plus className="w-4 h-4 mr-2" />
                Crear Curso
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button type="submit">
                  <Save className="w-4 h-4 mr-2" />
                  Actualizar
                </Button>
                <Button type="button" onClick={onDelete} variant="destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar Curso
                </Button>
              </div>
            )}
          </form>

          {!isCreateMode && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Prerequisitos</h4>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="IDs separados por coma (ej: 1,2,3)"
                  value={prereqIds}
                  onChange={(e) => setPrereqIds(e.target.value)}
                />
                <Button type="button" onClick={onPrereqSave}>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
