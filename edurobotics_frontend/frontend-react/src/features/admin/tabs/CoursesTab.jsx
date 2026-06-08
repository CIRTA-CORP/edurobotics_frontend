import { Plus } from 'lucide-react'
import { Button } from '@/shared/components/button'
import { Modal } from '@/shared/components/Modal'
import { CourseForm } from '@/features/admin/features/courses/CourseForm'
import { CourseFeedbackSummary } from '@/features/admin/features/courses/CourseFeedbackSummary'
import { CourseTimeMetrics } from '@/features/admin/features/courses/CourseTimeMetrics'
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

  const handleCourseCreate = async (e) => {
    e.preventDefault()
    await courseHooks.handleCourseCreate(e)
    setIsCourseModalOpen(false)
  }

  const handleCourseDelete = (course) => {
    if (window.confirm(`¿Eliminar el curso "${course.title}"?`)) {
      courseHooks.handleCourseDelete(course)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Gestión de Cursos</h3>
        <Button onClick={() => setIsCourseModalOpen(true)} className="gap-1.5">
          <Plus className="w-4 h-4" />
          Crear Curso
        </Button>
      </div>

      {selectedCourse && (
        <CourseForm
          mode="edit"
          courseForm={courseHooks.courseForm}
          setCourseForm={courseHooks.setCourseForm}
          prereqIds={courseHooks.prereqIds}
          setPrereqIds={courseHooks.setPrereqIds}
          isSubmitting={courseHooks.isSubmitting}
          onSubmit={(e) => courseHooks.handleCourseUpdate(e, selectedCourse)}
          onDelete={() => handleCourseDelete(selectedCourse)}
          onPrereqSave={() => courseHooks.handlePrereqSave(selectedCourse)}
          selectedCourse={selectedCourse}
          allCourses={courses}
          expanded={expandedSections.editar}
          onToggle={() => toggleSection('editar')}
        />
      )}

      {selectedCourse && (
        <CourseTimeMetrics courseId={selectedCourse.id} />
      )}

      {selectedCourse && (
        <CourseFeedbackSummary courseId={selectedCourse.id} />
      )}

      <Modal
        isOpen={isCourseModalOpen}
        onClose={() => setIsCourseModalOpen(false)}
        title="Crear Nuevo Curso"
      >
        <CourseForm
          mode="create"
          courseForm={courseHooks.courseForm}
          setCourseForm={courseHooks.setCourseForm}
          isSubmitting={courseHooks.isSubmitting}
          onSubmit={handleCourseCreate}
          expanded={true}
          onToggle={() => { }}
        />
      </Modal>
    </div>
  )
}
