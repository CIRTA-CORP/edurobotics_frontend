/**
 * Specializations Tab — gestiona especializaciones (grupos de cursos).
 *
 * La directora puede crear/editar/eliminar especializaciones, subir una imagen
 * de portada y asignarles cursos (en orden). No toca los CRUD de cursos.
 */
import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Card, CardContent } from '@/shared/components/card'
import { Button } from '@/shared/components/button'
import { Input } from '@/shared/components/input'
import { apiUploadFile } from '@/shared/services/api'
import { getAllCourses } from '@/features/courses/services/courses'
import {
  getAllSpecializations, createSpecialization, updateSpecialization,
  deleteSpecialization, setSpecializationCourses,
} from '@/features/specializations/services/specializations'
import {
  Plus, Save, Trash2, Layers, ImageIcon, Upload, X, Loader2,
  Eye, EyeOff, BookOpen,
} from 'lucide-react'

const EMPTY_FORM = { title: '', description: '', image_url: '', is_published: true }

export function SpecializationsTab() {
  const queryClient = useQueryClient()
  const { data: specs = [], isLoading } = useQuery({
    queryKey: ['admin-specializations'],
    queryFn: getAllSpecializations,
    staleTime: 15_000,
  })
  const { data: coursesResp } = useQuery({
    queryKey: ['admin-all-courses'],
    queryFn: getAllCourses,
    staleTime: 30_000,
  })
  const allCourses = Array.isArray(coursesResp) ? coursesResp : coursesResp?.courses || []

  const [editingId, setEditingId] = useState(null) // null = modo crear
  const [form, setForm] = useState(EMPTY_FORM)
  const [courseIds, setCourseIds] = useState([])
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin-specializations'] })

  const startCreate = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setCourseIds([])
  }

  const startEdit = (spec) => {
    setEditingId(spec.id)
    setForm({
      title: spec.title || '',
      description: spec.description || '',
      image_url: spec.image_url || '',
      is_published: spec.is_published !== false,
    })
    setCourseIds((spec.courses || []).map((c) => c.id))
  }

  const toggleCourse = (id) =>
    setCourseIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const handleImage = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const result = await apiUploadFile('/api/uploads', file)
      setForm((f) => ({ ...f, image_url: result.url }))
      toast.success('Imagen subida')
    } catch (error) {
      toast.error(error.message || 'Error al subir la imagen')
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  const handleSave = async (event) => {
    event.preventDefault()
    if (saving) return
    setSaving(true)
    try {
      let specId = editingId
      if (editingId) {
        await updateSpecialization(editingId, form)
      } else {
        const res = await createSpecialization(form)
        specId = res?.id
      }
      if (specId) await setSpecializationCourses(specId, courseIds)
      await refresh()
      toast.success(editingId ? 'Especialización actualizada' : 'Especialización creada')
      startCreate()
    } catch (error) {
      toast.error(error.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (spec) => {
    if (!window.confirm(`¿Eliminar la especialización "${spec.title}"? Los cursos no se borran, solo se desagrupan.`)) return
    try {
      await deleteSpecialization(spec.id)
      await refresh()
      toast.success('Especialización eliminada')
      if (editingId === spec.id) startCreate()
    } catch (error) {
      toast.error(error.message || 'Error al eliminar')
    }
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
      {/* ── Lista de especializaciones ── */}
      <div className="space-y-3 lg:col-span-5">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
            <Layers className="h-5 w-5" /> Especializaciones
          </h2>
          <Button size="sm" variant={editingId === null ? 'default' : 'outline'} onClick={startCreate} className="gap-1.5">
            <Plus className="h-4 w-4" /> Nueva
          </Button>
        </div>

        {isLoading ? (
          <p className="py-8 text-center text-sm text-gray-400">Cargando…</p>
        ) : specs.length === 0 ? (
          <Card className="border-2 border-dashed border-gray-200">
            <CardContent className="py-12 text-center">
              <Layers className="mx-auto mb-2 h-8 w-8 text-gray-300" />
              <p className="text-sm text-gray-500">Aún no hay especializaciones</p>
              <p className="text-xs text-gray-400">Crea una con el botón "Nueva"</p>
            </CardContent>
          </Card>
        ) : (
          specs.map((spec) => (
            <Card
              key={spec.id}
              className={`cursor-pointer overflow-hidden border transition-all hover:shadow-md ${editingId === spec.id ? 'border-blue-300 ring-1 ring-blue-200' : 'border-gray-200'}`}
              onClick={() => startEdit(spec)}
            >
              <CardContent className="flex items-center gap-3 p-3">
                <div className="h-12 w-16 flex-shrink-0 overflow-hidden rounded-md bg-slate-100">
                  {spec.image_url ? (
                    <img src={spec.image_url} alt={spec.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-700 to-slate-900">
                      <Layers className="h-5 w-5 text-blue-300" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-sm font-semibold text-gray-900">{spec.title}</h3>
                    {spec.is_published === false && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">
                        <EyeOff className="h-2.5 w-2.5" /> Oculta
                      </span>
                    )}
                  </div>
                  <p className="flex items-center gap-1 text-xs text-gray-400">
                    <BookOpen className="h-3 w-3" /> {spec.course_count} curso{spec.course_count === 1 ? '' : 's'}
                  </p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(spec) }}
                  className="rounded-lg p-1.5 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500"
                  title="Eliminar"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* ── Formulario crear/editar ── */}
      <div className="lg:col-span-7">
        <Card className="border-gray-200">
          <CardContent className="space-y-4 p-5">
            <h3 className="text-sm font-semibold text-gray-900">
              {editingId ? 'Editar especialización' : 'Nueva especialización'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">Título *</label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Ej: Manipulación robótica"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">Descripción</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="flex min-h-[70px] w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="De qué trata esta especialización…"
                />
              </div>

              {/* Imagen */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">Imagen de portada</label>
                {form.image_url ? (
                  <div className="relative overflow-hidden rounded-lg border border-gray-200">
                    <img src={form.image_url} alt="Portada" className="h-32 w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, image_url: '' })}
                      className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex h-28 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50/50 text-gray-400 transition-colors hover:border-blue-300 hover:bg-blue-50/40 hover:text-blue-500">
                    {uploading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <div className="flex items-center gap-1.5"><ImageIcon className="h-5 w-5" /><Upload className="h-4 w-4" /></div>
                        <span className="text-xs font-medium">Subir imagen</span>
                      </>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={handleImage} disabled={uploading} />
                  </label>
                )}
              </div>

              {/* Publicado */}
              <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50/50 p-3">
                <div className="flex items-center gap-2">
                  {form.is_published ? <Eye className="h-4 w-4 text-emerald-600" /> : <EyeOff className="h-4 w-4 text-gray-400" />}
                  <span className="text-sm font-medium text-gray-700">Publicada</span>
                </div>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, is_published: !form.is_published })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.is_published ? 'bg-emerald-500' : 'bg-gray-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${form.is_published ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              {/* Asignar cursos */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Cursos en esta especialización ({courseIds.length})
                </label>
                {allCourses.length === 0 ? (
                  <p className="rounded-lg border-2 border-dashed border-gray-200 py-4 text-center text-xs text-gray-400">
                    No hay cursos disponibles
                  </p>
                ) : (
                  <div className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
                    {allCourses.map((course) => {
                      const checked = courseIds.includes(course.id)
                      return (
                        <label
                          key={course.id}
                          className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 transition-all ${checked ? 'border-blue-200 bg-blue-50/80' : 'border-gray-100 hover:bg-gray-50'}`}
                        >
                          <input type="checkbox" checked={checked} onChange={() => toggleCourse(course.id)} className="h-4 w-4 accent-blue-600" />
                          <span className="flex-1 truncate text-sm text-gray-800">{course.title}</span>
                          <span className="font-mono text-[11px] text-gray-400">CR-{course.id}</span>
                        </label>
                      )
                    })}
                  </div>
                )}
              </div>

              <Button type="submit" disabled={saving} className="w-full gap-1.5 bg-blue-600 hover:bg-blue-700">
                <Save className="h-4 w-4" />
                {saving ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Crear especialización'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
