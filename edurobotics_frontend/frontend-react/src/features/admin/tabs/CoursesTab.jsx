import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Printer, Download, Upload, Pencil } from 'lucide-react'
import { Button } from '@/shared/components/button'
import { Drawer } from '@/shared/components/Drawer'
import { CourseForm } from '@/features/admin/features/courses/CourseForm'
import { CourseFeedbackSummary } from '@/features/admin/features/courses/CourseFeedbackSummary'
import { CourseTimeMetrics } from '@/features/admin/features/courses/CourseTimeMetrics'
import { downloadCourseBackup, importCourse } from '@/features/courses/services/courses'
import { useAdmin } from '@/features/admin/context/AdminContext'

export function CoursesTab() {
  const {
    selectedCourse,
    courses,
    isCourseModalOpen,
    setIsCourseModalOpen,
    expandedSections,
    toggleSection,
    handleCourseSelect,
    courseHooks,
  } = useAdmin()

  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const importInputRef = useRef(null)
  const [downloading, setDownloading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  // One drawer handles both create and edit.
  const drawerOpen = isCourseModalOpen || editOpen
  const drawerMode = editOpen ? 'edit' : 'create'
  const closeDrawer = () => { setIsCourseModalOpen(false); setEditOpen(false) }

  const handleCourseCreate = async (e) => {
    e.preventDefault()
    await courseHooks.handleCourseCreate(e)
    setIsCourseModalOpen(false)
  }

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0]
    if (importInputRef.current) importInputRef.current.value = ''
    if (!file) return
    setImporting(true)
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      const res = await importCourse(data)
      toast.success(`Curso "${res.title}" importado (queda despublicado para revisar)`)
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] })
    } catch (err) {
      toast.error(err?.message?.includes('JSON') ? 'El archivo no es un respaldo válido' : (err.message || 'No se pudo importar'))
    } finally {
      setImporting(false)
    }
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

  const handleCourseDelete = (course) => {
    if (window.confirm(`¿Eliminar el curso "${course.title}"?`)) {
      courseHooks.handleCourseDelete(course)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-semibold text-gray-900">Gestión de Cursos</h3>
        <div className="flex items-center gap-2">
          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleImportFile}
            className="hidden"
          />
          <Button
            variant="outline"
            onClick={() => importInputRef.current?.click()}
            disabled={importing}
            className="gap-1.5"
          >
            <Upload className="w-4 h-4" />
            {importing ? 'Importando…' : 'Importar respaldo'}
          </Button>
          <Button onClick={() => setIsCourseModalOpen(true)} className="gap-1.5">
            <Plus className="w-4 h-4" />
            Crear Curso
          </Button>
        </div>
      </div>

      {selectedCourse && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-white p-3">
          <span className="mr-auto px-1 text-sm text-gray-500">
            <span className="font-medium text-gray-700">“{selectedCourse.title}”</span>
          </span>
          <Button size="sm" className="gap-1.5 bg-blue-600 hover:bg-blue-700" onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4" /> Editar curso
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => navigate(`/courses/${selectedCourse.id}/print`)}
          >
            <Printer className="h-4 w-4" /> Descargar PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={handleBackup}
            disabled={downloading}
          >
            <Download className="h-4 w-4" />
            {downloading ? 'Descargando…' : 'Descargar respaldo'}
          </Button>
        </div>
      )}

      {selectedCourse && (
        <CourseTimeMetrics courseId={selectedCourse.id} />
      )}

      {selectedCourse && (
        <CourseFeedbackSummary courseId={selectedCourse.id} />
      )}

      {/* Create / edit course — slide-over drawer */}
      <Drawer
        open={drawerOpen}
        onClose={closeDrawer}
        title={drawerMode === 'create' ? 'Crear nuevo curso' : `Editar curso`}
      >
        <CourseForm
          bare
          mode={drawerMode}
          courseForm={courseHooks.courseForm}
          setCourseForm={courseHooks.setCourseForm}
          prereqIds={courseHooks.prereqIds}
          setPrereqIds={courseHooks.setPrereqIds}
          isSubmitting={courseHooks.isSubmitting}
          onSubmit={drawerMode === 'create'
            ? handleCourseCreate
            : (e) => courseHooks.handleCourseUpdate(e, selectedCourse)}
          onDelete={() => handleCourseDelete(selectedCourse)}
          onPrereqSave={() => courseHooks.handlePrereqSave(selectedCourse)}
          selectedCourse={selectedCourse}
          allCourses={courses}
        />
      </Drawer>
    </div>
  )
}
