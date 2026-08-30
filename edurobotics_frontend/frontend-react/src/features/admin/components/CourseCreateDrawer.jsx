/**
 * CourseCreateDrawer — crear un curso desde cualquier pantalla del panel.
 *
 * Vive en el armazón, no en una pestaña, porque el botón que lo abre está en el
 * rail junto a la lista de cursos y esa lista se ve siempre.
 */
import { Drawer } from '@/shared/components/Drawer'
import { CourseForm } from '@/features/admin/features/courses/CourseForm'
import { useAdmin } from '@/features/admin/context/AdminContext'

export function CourseCreateDrawer() {
  const { isCourseModalOpen, setIsCourseModalOpen, courseHooks, courses, isTeacher } = useAdmin()

  if (isTeacher) return null

  const handleCreate = async (e) => {
    e.preventDefault()
    await courseHooks.handleCourseCreate(e)
    setIsCourseModalOpen(false)
  }

  return (
    <Drawer
      open={isCourseModalOpen}
      onClose={() => setIsCourseModalOpen(false)}
      title="Crear nuevo curso"
    >
      <CourseForm
        bare
        mode="create"
        courseForm={courseHooks.courseForm}
        setCourseForm={courseHooks.setCourseForm}
        prereqIds={courseHooks.prereqIds}
        setPrereqIds={courseHooks.setPrereqIds}
        isSubmitting={courseHooks.isSubmitting}
        onSubmit={handleCreate}
        allCourses={courses}
      />
    </Drawer>
  )
}
