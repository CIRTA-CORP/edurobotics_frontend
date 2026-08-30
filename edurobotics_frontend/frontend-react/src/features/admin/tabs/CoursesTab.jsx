// Detalle del curso: lo que antes vivía en un panel deslizante ahora está a la
// vista. Crear curso e importar respaldo subieron al rail, que es donde está la
// lista; eliminar bajó a su propia tarjeta, separada de la edición.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Printer, Download, Trash2 } from 'lucide-react'
import { Button } from '@/shared/components/button'
import { CourseForm } from '@/features/admin/features/courses/CourseForm'
import { CourseFeedbackSummary } from '@/features/admin/features/courses/CourseFeedbackSummary'
import { CourseTimeMetrics } from '@/features/admin/features/courses/CourseTimeMetrics'
import { downloadCourseBackup } from '@/features/courses/services/courses'
import { useAdmin } from '@/features/admin/context/AdminContext'

export function CoursesTab() {
  const { selectedCourse, courses, courseHooks, isTeacher } = useAdmin()

  const navigate = useNavigate()
  const [downloading, setDownloading] = useState(false)

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

  const handleCourseDelete = () => {
    if (window.confirm(`¿Eliminar el curso "${selectedCourse.title}"? Esta acción no se puede deshacer.`)) {
      courseHooks.handleCourseDelete(selectedCourse)
    }
  }

  if (isTeacher) return null

  if (!selectedCourse) {
    return (
      <div className="rounded-2xl border border-[#e9e9ee] bg-white p-10 text-center">
        <p className="text-[14px] font-medium text-[#55545f]">Elige un curso en el panel de la izquierda</p>
        <p className="mt-1 text-[13px] text-[#a9a8b4]">Aquí verás y editarás sus datos.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#a9a8b4]">
            Detalle del curso
          </div>
          <h2 className="mt-2 truncate text-[24px] font-bold tracking-[-0.012em] text-[#16151b]">
            {selectedCourse.title}
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate(`/courses/${selectedCourse.id}/print`)}>
            <Printer className="h-4 w-4" /> Descargar PDF
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleBackup} disabled={downloading}>
            <Download className="h-4 w-4" />
            {downloading ? 'Descargando…' : 'Descargar respaldo'}
          </Button>
        </div>
      </div>

      {/* El formulario ya no vive en un panel deslizante: está siempre a la vista. */}
      <div className="rounded-2xl border border-[#e9e9ee] bg-white p-5 sm:p-6">
        <CourseForm
          bare
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

      <CourseTimeMetrics courseId={selectedCourse.id} />
      <CourseFeedbackSummary courseId={selectedCourse.id} />

      {/* Zona sensible: eliminar se separa de la edición a propósito, y recuerda
          descargar el respaldo antes de que sea tarde. */}
      <div className="rounded-2xl border border-[#b4425a]/25 bg-[#b4425a]/[0.03] p-5 sm:p-6">
        <h3 className="text-[15px] font-semibold text-[#16151b]">Zona sensible</h3>
        <p className="mt-1.5 max-w-2xl text-[13.5px] leading-relaxed text-[#55545f]">
          Eliminar el curso borra sus módulos, unidades, contenidos y evaluaciones, y el avance
          que los alumnos llevaban en él. <strong className="font-semibold">Descarga el respaldo antes</strong> —
          es la única forma de recuperarlo.
        </p>
        <Button variant="destructive" size="sm" className="mt-4 gap-1.5" onClick={handleCourseDelete}>
          <Trash2 className="h-4 w-4" /> Eliminar este curso
        </Button>
      </div>
    </div>
  )
}
