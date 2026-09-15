/**
 * Specializations Tab — gestiona especializaciones (grupos de cursos).
 *
 * La directora puede crear/editar/eliminar especializaciones, subir una imagen
 * de portada y asignarles cursos (en orden). No toca los CRUD de cursos.
 */
import { useState } from 'react'
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
    <div>
      {/* Encabezado (canvas AdminSitio §8.5) */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-[#a9a8b4]">Contenido</span>
          <h1
            className="mt-2 text-[26px] font-bold leading-[1.16] tracking-[-0.014em] text-[#16151b]"
          >
            Especializaciones
          </h1>
          <p className="mt-2 text-[13.5px] text-[#55545f]">
            Agrupan cursos en rutas. Cada una toma un color fijo que se repite en las tarjetas y en la malla.
          </p>
        </div>
        <button
          type="button"
          onClick={startCreate}
          className="inline-flex h-10 flex-shrink-0 items-center gap-2 rounded-[11px] bg-[#16151b] px-4 text-[13px] font-semibold text-white transition-colors hover:bg-[#2b2b26] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#16151b]"
        >
          <Plus className="h-4 w-4" strokeWidth={2} /> Nueva especialización
        </button>
      </div>

      {/* Tarjetas (grid de 3, canvas) */}
      <div className="mt-5 grid max-w-[1060px] grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {isLoading ? (
          <p className="py-8 text-center text-sm text-gray-400">Cargando…</p>
        ) : specs.length === 0 ? (
          <div className="rounded-[14px] border-2 border-dashed border-gray-200 py-12 text-center md:col-span-2 xl:col-span-3">
            <Layers className="mx-auto mb-2 h-8 w-8 text-gray-300" />
            <p className="text-sm text-gray-500">Aún no hay especializaciones</p>
            <p className="text-xs text-gray-400">Crea una con el botón "Nueva especialización"</p>
          </div>
        ) : (
          specs.map((spec) => (
            <div
              key={spec.id}
              className={`cursor-pointer overflow-hidden rounded-[14px] border bg-white transition-all ${
                editingId === spec.id ? 'border-[#4b46d6]/40 ring-1 ring-[#4b46d6]/20' : 'border-[#e9e9ee] hover:shadow-md'
              }`}
              onClick={() => startEdit(spec)}
            >
              <div
                className="relative h-[96px] bg-[#0a0a0c]"
                style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '18px 18px' }}
              >
                {spec.image_url && <img src={spec.image_url} alt={spec.title} className="absolute inset-0 h-full w-full object-cover" />}
                <span
                  className={`absolute right-2.5 top-2.5 rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold ${
                    spec.is_published === false ? 'bg-[#f4f4f7] text-[#8b8a95]' : 'bg-[#ecfdf5] text-[#047857]'
                  }`}
                >
                  {spec.is_published === false ? 'Borrador' : 'Publicada'}
                </span>
              </div>
              <div className="p-[16px_18px]">
                <div className="text-[14.5px] font-semibold text-[#16151b]">{spec.title}</div>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-[#8b8a95] line-clamp-2">{spec.description}</p>
                <div className="mt-3.5 flex items-center gap-2.5">
                  <span className="font-mono text-[10.5px] text-[#a9a8b4]">
                    {spec.course_count ?? (spec.courses || []).length} curso{(spec.course_count ?? (spec.courses || []).length) === 1 ? '' : 's'}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); startEdit(spec) }}
                    className="ml-auto inline-flex h-8 items-center gap-2 rounded-[10px] border border-[#e3e2ea] px-3 text-[12px] font-semibold text-[#55545f] transition-colors hover:border-[#c4c3cd] hover:text-[#16151b]"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleDelete(spec) }}
                    className="grid h-8 w-8 place-items-center rounded-[9px] border border-[#e3e2ea] text-[#c4c3cd] transition-colors hover:border-[#f0d5d5] hover:text-[#b4425a]"
                    title="Eliminar"
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={1.8} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Formulario crear/editar ── */}
      <div className="mt-8 max-w-[880px]">
        <Card className="border-[#e9e9ee]">
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
                  className="flex min-h-[70px] w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm placeholder:text-gray-400 focus:border-[#4b46d6] focus:outline-none focus:ring-2 focus:ring-[#4b46d6]/20"
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
                  <label className="flex h-28 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50/50 text-gray-400 transition-colors hover:border-[#4b46d6]/40 hover:bg-[#4b46d6]/[0.05] hover:text-[#4b46d6]">
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
                          className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 transition-all ${checked ? 'border-[#4b46d6]/30 bg-[#4b46d6]/[0.07]' : 'border-gray-100 hover:bg-gray-50'}`}
                        >
                          <input type="checkbox" checked={checked} onChange={() => toggleCourse(course.id)} className="h-4 w-4 accent-[#4b46d6]" />
                          <span className="flex-1 truncate text-sm text-gray-800">{course.title}</span>
                          <span className="font-mono text-[11px] text-gray-400">CR-{course.id}</span>
                        </label>
                      )
                    })}
                  </div>
                )}
              </div>

              <Button type="submit" disabled={saving} className="w-full gap-1.5">
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
