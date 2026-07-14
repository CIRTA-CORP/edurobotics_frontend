/**
 * Course Form Component
 *
 * Dual-mode form for creating/editing courses.
 * Prerequisites section uses checkboxes (one per course) instead of raw IDs.
 * Redesigned with modern styling, clear labels, and visual hierarchy.
 */

import { useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/shared/components/card'
import { Button } from '@/shared/components/button'
import { Input } from '@/shared/components/input'
import { apiUploadFile } from '@/shared/services/api'
import {
  Plus, Settings, Save, Trash2, ChevronDown, ChevronUp,
  GitBranch, GraduationCap, Zap, Trophy, BookOpen, Eye, EyeOff,
  ImageIcon, Upload, X, Loader2
} from 'lucide-react'

const LEVEL_OPTIONS = [
  { value: 'beginner', label: 'Principiante', icon: GraduationCap, color: 'text-emerald-600' },
  { value: 'intermediate', label: 'Intermedio', icon: Zap, color: 'text-amber-600' },
  { value: 'advanced', label: 'Avanzado', icon: Trophy, color: 'text-rose-600' },
]

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
  isSubmitting = false,
  allCourses = [],    // all courses for the checkbox list
  expanded,
  onToggle,
  bare = false,       // when true, render just the fields (e.g. inside a Drawer)
}) {
  const isCreateMode = mode === 'create'
  const [uploadingImage, setUploadingImage] = useState(false)

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setUploadingImage(true)
    try {
      const result = await apiUploadFile('/api/uploads', file)
      setCourseForm({ ...courseForm, image_url: result.url })
      toast.success('Imagen subida')
    } catch (error) {
      toast.error(error.message || 'Error al subir la imagen')
    } finally {
      setUploadingImage(false)
      event.target.value = '' // allow re-selecting the same file
    }
  }

  // Courses that can be selected as prerequisites (exclude self)
  const eligibleCourses = allCourses.filter(c => c.id !== selectedCourse?.id)

  const togglePrereq = (courseId) => {
    if (prereqIds.includes(courseId)) {
      setPrereqIds(prereqIds.filter(id => id !== courseId))
    } else {
      setPrereqIds([...prereqIds, courseId])
    }
  }

  const content = (
    <>
          {/* ── Course details form ── */}
          <form onSubmit={onSubmit} className="space-y-4">
            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Título del curso *
              </label>
              <Input
                type="text"
                placeholder="Ej: Fundamentos de Robótica"
                value={courseForm.title}
                onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Descripción
              </label>
              <textarea
                placeholder="Breve descripción del curso..."
                value={courseForm.description}
                onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                rows={3}
                className="flex min-h-[80px] w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors resize-none"
              />
            </div>

            {/* Cover image */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Imagen de portada
              </label>
              {courseForm.image_url ? (
                <div className="relative overflow-hidden rounded-lg border border-gray-200">
                  <img
                    src={courseForm.image_url}
                    alt="Portada del curso"
                    className="h-36 w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setCourseForm({ ...courseForm, image_url: '' })}
                    className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
                    title="Quitar imagen"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex h-36 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50/50 text-gray-400 transition-colors hover:border-blue-300 hover:bg-blue-50/40 hover:text-blue-500">
                  {uploadingImage ? (
                    <>
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span className="text-xs font-medium">Subiendo...</span>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-1.5">
                        <ImageIcon className="h-5 w-5" />
                        <Upload className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-medium">Haz clic para subir una imagen</span>
                      <span className="text-[10px] text-gray-400">PNG, JPG, WEBP · máx 5 MB</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                  />
                </label>
              )}
            </div>

            {/* Level selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Nivel
              </label>
              <div className="grid grid-cols-3 gap-2">
                {LEVEL_OPTIONS.map((level) => {
                  const LevelIcon = level.icon
                  const isActive = courseForm.level === level.value
                  return (
                    <button
                      key={level.value}
                      type="button"
                      onClick={() => setCourseForm({ ...courseForm, level: level.value })}
                      className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${isActive
                        ? 'border-blue-300 bg-blue-50 text-blue-700 shadow-sm'
                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                        }`}
                    >
                      <LevelIcon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600' : level.color}`} />
                      {level.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Published toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-gray-50/50">
              <div className="flex items-center gap-2">
                {courseForm.is_published !== false
                  ? <Eye className="w-4 h-4 text-emerald-600" />
                  : <EyeOff className="w-4 h-4 text-gray-400" />
                }
                <div>
                  <span className="text-sm font-medium text-gray-700">Publicado</span>
                  <p className="text-[10px] text-gray-400">
                    {courseForm.is_published !== false ? 'Visible para estudiantes' : 'Oculto — sólo visible para admin'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCourseForm({ ...courseForm, is_published: !courseForm.is_published })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${courseForm.is_published !== false ? 'bg-emerald-500' : 'bg-gray-300'
                  }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${courseForm.is_published !== false ? 'translate-x-6' : 'translate-x-1'
                  }`} />
              </button>
            </div>

            {/* Action buttons */}
            {isCreateMode ? (
              <Button type="submit" disabled={isSubmitting} className="w-full gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
                <Plus className="w-4 h-4" />
                {isSubmitting ? 'Creando...' : 'Crear Curso'}
              </Button>
            ) : (
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={isSubmitting} className="flex-1 gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
                  <Save className="w-4 h-4" />
                  {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
                </Button>
                <Button
                  type="button"
                  onClick={onDelete}
                  variant="ghost"
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </form>

          {/* ── Prerequisites (edit mode only) ── */}
          {!isCreateMode && (
            <div className="border-t border-gray-100 pt-5">
              <div className="flex items-center gap-2 mb-1">
                <GitBranch className="w-4 h-4 text-gray-500" />
                <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Prerequisitos</h4>
              </div>
              <p className="text-xs text-gray-400 mb-3">
                El estudiante debe completar estos cursos para acceder a <strong>{selectedCourse?.title}</strong>.
              </p>

              {eligibleCourses.length === 0 ? (
                <div className="text-center py-6 rounded-lg border-2 border-dashed border-gray-200">
                  <BookOpen className="w-6 h-6 text-gray-300 mx-auto mb-1.5" />
                  <p className="text-xs text-gray-400">No hay otros cursos disponibles</p>
                </div>
              ) : (
                <div className="space-y-1.5 mb-4">
                  {eligibleCourses.map((course) => {
                    const code = `CR-${course.id}`
                    const isChecked = prereqIds.includes(course.id)
                    const levelConf = LEVEL_OPTIONS.find(l => l.value === course.level) || LEVEL_OPTIONS[0]
                    const LevelIcon = levelConf.icon
                    return (
                      <label
                        key={course.id}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-all ${isChecked
                          ? 'border-blue-200 bg-blue-50/80 shadow-sm'
                          : 'border-gray-100 hover:bg-gray-50 hover:border-gray-200'
                          }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => togglePrereq(course.id)}
                          className="w-4 h-4 accent-blue-600 flex-shrink-0 rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-800 truncate">{course.title}</div>
                          <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mt-0.5">
                            <LevelIcon className={`w-3 h-3 ${levelConf.color}`} />
                            <span>{code} · {levelConf.label}</span>
                          </div>
                        </div>
                        {isChecked && (
                          <span className="text-[10px] font-semibold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full flex-shrink-0">
                            Requerido
                          </span>
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
                className="w-full gap-1.5"
              >
                <Save className="w-4 h-4" />
                Guardar prerequisitos
              </Button>
            </div>
          )}
    </>
  )

  // Inside a Drawer: just the fields, no collapsible card chrome.
  if (bare) return <div className="space-y-6">{content}</div>

  return (
    <Card className="border-gray-200 overflow-hidden">
      {/* Header */}
      <button
        type="button"
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50/80 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isCreateMode ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'}`}>
            {isCreateMode ? <Plus className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
          </div>
          <div className="text-left">
            <h3 className="text-sm font-semibold text-gray-900">
              {isCreateMode ? 'Crear Nuevo Curso' : 'Editar Curso'}
            </h3>
            {!isCreateMode && selectedCourse && (
              <p className="text-xs text-gray-500 mt-0.5">
                {selectedCourse.title} · <span className="font-mono">CR-{selectedCourse.id}</span>
              </p>
            )}
          </div>
        </div>
        {expanded
          ? <ChevronUp className="w-4 h-4 text-gray-400" />
          : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>

      {expanded && (
        <CardContent className="pt-0 px-5 pb-5 space-y-6">{content}</CardContent>
      )}
    </Card>
  )
}
