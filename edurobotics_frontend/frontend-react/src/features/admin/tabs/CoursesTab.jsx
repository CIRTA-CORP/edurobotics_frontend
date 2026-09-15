// Detalle del curso: lo que antes vivía en un panel deslizante ahora está a la
// vista. Cabecera con las acciones del curso, cuerpo en dos columnas —campos a
// la izquierda, prerequisitos y zona sensible a la derecha— y las métricas y el
// feedback en sus propias pestañas.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Check, Download, Eye, Printer, Trash2 } from 'lucide-react'
import { CourseForm } from '@/features/admin/features/courses/CourseForm'
import { CourseFeedbackSummary } from '@/features/admin/features/courses/CourseFeedbackSummary'
import { CourseTimeMetrics } from '@/features/admin/features/courses/CourseTimeMetrics'
import { downloadCourseBackup } from '@/features/courses/services/courses'
import { useAdmin } from '@/features/admin/context/AdminContext'

function HeaderAction({ onClick, children, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#e9e9ee] bg-white px-3.5 text-[13px] font-semibold text-[#55545f] transition-colors hover:border-[#c4c3cd] hover:text-[#16151b] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4b46d6]"
    >
      {children}
    </button>
  )
}

export function CoursesTab() {
  const { selectedCourse, courses, courseHooks, isTeacher } = useAdmin()

  const navigate = useNavigate()
  const [downloading, setDownloading] = useState(false)
  const [tab, setTab] = useState('detalle')

  if (isTeacher) return null

  if (!selectedCourse) {
    return (
      <div className="rounded-2xl border border-[#e9e9ee] bg-white p-10 text-center">
        <p className="text-[14px] font-medium text-[#55545f]">Elige un curso en la lista</p>
        <p className="mt-1 text-[13px] text-[#a9a8b4]">Aquí verás y editarás sus datos.</p>
      </div>
    )
  }

  const handleBackup = async () => {
    setDownloading(true)
    try {
      await downloadCourseBackup(selectedCourse.id, selectedCourse.title)
      toast.success('Respaldo descargado')
    } catch {
      toast.error('No se pudo descargar el respaldo')
    } finally {
      setDownloading(false)
    }
  }

  const handleDelete = () => {
    if (window.confirm(`¿Eliminar el curso "${selectedCourse.title}"? Esta acción no se puede deshacer.`)) {
      courseHooks.handleCourseDelete(selectedCourse)
    }
  }

  const tabButton = (id, label) => (
    <button
      onClick={() => setTab(id)}
      className={`h-9 rounded-lg px-4 text-[13.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4b46d6] ${
        tab === id ? 'bg-white text-[#16151b] shadow-sm' : 'text-[#8b8a95] hover:text-[#16151b]'
      }`}
    >
      {label}
    </button>
  )

  return (
    <div className="space-y-6">
      {/* Cabecera: contexto, acciones y la acción primaria a la derecha */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-[#a9a8b4]">
          Cursos · CR-{selectedCourse.id}
        </p>
        <div className="flex flex-wrap gap-2">
          <HeaderAction onClick={() => navigate(`/courses/${selectedCourse.id}`)}>
            <Eye className="h-4 w-4" strokeWidth={1.8} /> Ver como alumno
          </HeaderAction>
          <HeaderAction onClick={() => navigate(`/courses/${selectedCourse.id}/print`)}>
            <Printer className="h-4 w-4" strokeWidth={1.8} /> Descargar PDF
          </HeaderAction>
          <HeaderAction onClick={handleBackup} disabled={downloading}>
            <Download className="h-4 w-4" strokeWidth={1.8} />
            {downloading ? 'Descargando…' : 'Descargar respaldo'}
          </HeaderAction>
          <button
            form="course-detail-form"
            type="submit"
            disabled={courseHooks.isSubmitting}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#16151b] px-5 text-[13px] font-semibold text-white transition-colors hover:bg-[#2b2b26] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#16151b]"
          >
            <Check className="h-4 w-4" strokeWidth={2.4} />
            {courseHooks.isSubmitting ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-[28px] font-bold leading-tight tracking-[-0.015em] text-[#16151b]">
          {selectedCourse.title}
        </h2>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${
            selectedCourse.is_published
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-[#f4f3f8] text-[#8b8a95]'
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${selectedCourse.is_published ? 'bg-emerald-500' : 'bg-[#b3b2be]'}`} />
          {selectedCourse.is_published ? 'Publicado' : 'Despublicado'}
        </span>
      </div>

      <div className="inline-flex items-center gap-[3px] rounded-[10px] bg-[#f4f3f8] p-[3px]">
        {tabButton('detalle', 'Detalle')}
        {tabButton('metricas', 'Métricas')}
        {tabButton('feedback', 'Feedback')}
      </div>

      {tab === 'detalle' && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="rounded-2xl border border-[#e9e9ee] bg-white p-5 sm:p-6">
            <CourseForm
              bare
              formId="course-detail-form"
              hideSubmit
              hidePrereqs
              mode="edit"
              courseForm={courseHooks.courseForm}
              setCourseForm={courseHooks.setCourseForm}
              prereqIds={courseHooks.prereqIds}
              setPrereqIds={courseHooks.setPrereqIds}
              isSubmitting={courseHooks.isSubmitting}
              onSubmit={(e) => courseHooks.handleCourseUpdate(e, selectedCourse)}
              selectedCourse={selectedCourse}
              allCourses={courses}
            />
          </div>

          <div className="space-y-5">
            <div className="rounded-2xl border border-[#e9e9ee] bg-white p-5">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#a9a8b4]">
                Prerequisitos
              </p>
              <p className="mt-2.5 text-[12.5px] leading-relaxed text-[#8b8a95]">
                El alumno debe completar estos cursos antes de entrar. Se guardan junto con el curso.
              </p>
              <div className="mt-4 space-y-2">
                {courses.filter(c => c.id !== selectedCourse.id).length === 0 ? (
                  <p className="text-[13px] text-[#a9a8b4]">No hay otros cursos todavía.</p>
                ) : (
                  courses.filter(c => c.id !== selectedCourse.id).map((c) => {
                    const checked = courseHooks.prereqIds.includes(c.id)
                    return (
                      <label
                        key={c.id}
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
                          checked ? 'border-[#4b46d6]/30 bg-[#4b46d6]/[0.07]' : 'border-[#ececf1] hover:bg-[#fafafa]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => courseHooks.setPrereqIds(
                            checked
                              ? courseHooks.prereqIds.filter(id => id !== c.id)
                              : [...courseHooks.prereqIds, c.id]
                          )}
                          className="h-4 w-4 flex-shrink-0 accent-[#4b46d6]"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13.5px] font-semibold text-[#16151b]">{c.title}</span>
                          <span className="block font-mono text-[10.5px] text-[#a9a8b4]">#{c.id}</span>
                        </span>
                        {checked && (
                          <span className="flex-shrink-0 font-mono text-[9.5px] font-bold tracking-wider text-[#4b46d6]">
                            REQUERIDO
                          </span>
                        )}
                      </label>
                    )
                  })
                )}
              </div>
            </div>

            {/* Zona sensible: separada de la edición a propósito. */}
            <div className="rounded-2xl border border-[#b4425a]/25 bg-[#b4425a]/[0.03] p-5">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#b4425a]">
                Zona sensible
              </p>
              <p className="mt-2.5 text-[12.5px] leading-relaxed text-[#55545f]">
                Eliminar el curso borra sus módulos, unidades, contenidos y evaluaciones.
                Descarga un respaldo antes.
              </p>
              <button
                onClick={handleDelete}
                className="mt-4 inline-flex h-9 items-center gap-2 rounded-xl border border-[#b4425a]/30 px-3.5 text-[13px] font-semibold text-[#b4425a] transition-colors hover:bg-[#b4425a]/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b4425a]"
              >
                <Trash2 className="h-4 w-4" /> Eliminar curso
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === 'metricas' && <CourseTimeMetrics courseId={selectedCourse.id} />}
      {tab === 'feedback' && <CourseFeedbackSummary courseId={selectedCourse.id} />}
    </div>
  )
}
