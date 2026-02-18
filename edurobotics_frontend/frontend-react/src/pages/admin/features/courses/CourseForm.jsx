/**
 * Course Form Component
 *
 * Dual-mode form for creating/editing courses.
 * Prerequisites section uses checkboxes (one per course) instead of raw IDs.
 */

import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/ui/card'
import { Button } from '../../../../components/ui/button'
import { Input } from '../../../../components/ui/input'
import { Plus, Settings, Save, Trash2, ChevronDown, ChevronUp, GitBranch } from 'lucide-react'

export function CourseForm({
  mode,
  courseForm,
  setCourseForm,
  prereqIds,          // number[]
  setPrereqIds,       // (ids: number[]) => void
  onSubmit,
  onDelete,
  onPrereqSave,
  selectedCourse,
  allCourses = [],    // all courses for the checkbox list
  expanded,
  onToggle
}) {
  const isCreateMode = mode === 'create'

  // Courses that can be selected as prerequisites (exclude self)
  const eligibleCourses = allCourses.filter(c => c.id !== selectedCourse?.id)

  const togglePrereq = (courseId) => {
    if (prereqIds.includes(courseId)) {
      setPrereqIds(prereqIds.filter(id => id !== courseId))
    } else {
      setPrereqIds([...prereqIds, courseId])
    }
  }

  const LEVEL_LABELS = { beginner: 'Principiante', intermediate: 'Intermedio', advanced: 'Avanzado' }

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
          {expanded
            ? <ChevronUp className="w-5 h-5 text-gray-500" />
            : <ChevronDown className="w-5 h-5 text-gray-500" />
          }
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className={isCreateMode ? '' : 'space-y-6'}>
          {/* ── Course details form ── */}
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
            <select
              value={courseForm.level}
              onChange={(e) => setCourseForm({ ...courseForm, level: e.target.value })}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            >
              <option value="beginner">Principiante</option>
              <option value="intermediate">Intermedio</option>
              <option value="advanced">Avanzado</option>
            </select>

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

          {/* ── Prerequisites (edit mode only) ── */}
          {!isCreateMode && (
            <div className="border-t pt-5">
              <div className="flex items-center gap-2 mb-1">
                <GitBranch className="w-4 h-4 text-gray-500" />
                <h4 className="text-sm font-semibold text-gray-700">Prerequisitos</h4>
              </div>
              <p className="text-xs text-gray-400 mb-3">
                El estudiante debe completar estos cursos antes de acceder a <strong>{selectedCourse?.title}</strong>.
              </p>

              {eligibleCourses.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No hay otros cursos disponibles.</p>
              ) : (
                <div className="space-y-2 mb-4">
                  {eligibleCourses.map((course, i) => {
                    const code = `CR-${course.id}`
                    const isChecked = prereqIds.includes(course.id)
                    const levelLabel = LEVEL_LABELS[course.level] || course.level
                    return (
                      <label
                        key={course.id}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors ${isChecked
                            ? 'border-blue-300 bg-blue-50'
                            : 'border-gray-200 hover:bg-gray-50'
                          }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => togglePrereq(course.id)}
                          className="w-4 h-4 accent-blue-600 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-800 truncate">{course.title}</div>
                          <div className="text-xs text-gray-400">{code} · {levelLabel}</div>
                        </div>
                        {isChecked && (
                          <span className="text-xs font-medium text-blue-600 flex-shrink-0">Prerequisito</span>
                        )}
                      </label>
                    )
                  })}
                </div>
              )}

              <Button
                type="button"
                onClick={onPrereqSave}
                disabled={eligibleCourses.length === 0}
                className="w-full"
              >
                <Save className="w-4 h-4 mr-2" />
                Guardar prerequisitos
              </Button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
