/**
 * Course Detail Page
 * 
 * Displays complete course content with module navigation and content viewer.
 * Shows course modules in sidebar and content (text/video/resources) in main area.
 */

import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getStoredUser } from '../services/auth'
import { getCourseDetail } from '../services/courses'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Loader2, BookOpen } from 'lucide-react'
import { CourseHeader } from './course/components/CourseHeader'
import { ModuleSidebar } from './course/components/ModuleSidebar'
import CourseRoadmap from './course/components/CourseRoadmap'
import { ContentViewer } from './course/components/ContentViewer'
import { useProgress } from '../hooks/useProgress'

function CoursePage() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedUnitId, setSelectedUnitId] = useState(null)

  // Progress tracking
  const progressHook = useProgress(user?.id, parseInt(courseId))

  const handleUnitClick = (unitId) => {
    setSelectedUnitId(unitId)
  }

  const handleBackToDashboard = () => {
    navigate('/dashboard')
  }

  useEffect(() => {
    const storedUser = getStoredUser()
    if (!storedUser) {
      navigate('/login')
      return
    }
    setUser(storedUser)
  }, [navigate])

  useEffect(() => {
    const loadCourse = async () => {
      try {
        const data = await getCourseDetail(courseId)
        setCourse(data)
        // Seleccionar automáticamente la primera unidad del primer módulo si existe
        if (data?.modules && data.modules.length > 0) {
          const firstModule = data.modules[0]
          if (firstModule.units && firstModule.units.length > 0) {
            setSelectedUnitId(firstModule.units[0].id)
          }
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    loadCourse()
  }, [courseId])

  // Crear lista plana de todas las unidades para navegación secuencial
  const allUnits = course?.modules?.flatMap(m => m.units || []) || []
  const currentUnit = allUnits.find(u => u.id === selectedUnitId)

  // Verificar si el curso está vacío (sin módulos o unidades)
  const isEmpty = !course?.modules || course.modules.length === 0 || allUnits.length === 0


  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
    </div>
  )

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <Card className="max-w-md">
        <CardContent className="py-8 text-center">
          <p className="text-red-600">{error}</p>
          <Button className="mt-4" onClick={() => navigate('/dashboard')}>
            Volver al dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  )

  if (!course) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <Card className="max-w-md">
        <CardContent className="py-8 text-center">
          <p className="text-gray-600">Curso no encontrado</p>
          <Button className="mt-4" onClick={() => navigate('/dashboard')}>
            Volver al dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  )

  // Mostrar mensaje si el curso está vacío (sin contenido)
  if (isEmpty) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <CourseHeader
        course={course}
        user={user}
        onBack={handleBackToDashboard}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="py-12 text-center">
            <BookOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Curso sin contenido
            </h3>
            <p className="text-gray-600 mb-6">
              Este curso aún no tiene módulos ni unidades creadas.
              {user?.role === 'admin' && (
                <span className="block mt-2">
                  Ve al <strong>Panel Admin</strong> para agregar módulos, unidades y contenidos.
                </span>
              )}
            </p>
            <Button onClick={() => navigate('/dashboard')}>
              Volver al dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <CourseHeader
        course={course}
        user={user}
        onBack={handleBackToDashboard}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-12 gap-6">
          <aside className="col-span-12 lg:col-span-4">
            <CourseRoadmap userId={user?.id} courseId={parseInt(courseId)} onNavigateUnit={(unitId) => setSelectedUnitId(unitId)} />
            <ModuleSidebar
              modules={course.modules || []}
              selectedUnitId={selectedUnitId}
              onUnitClick={handleUnitClick}
              getModuleProgress={progressHook.getModuleProgress}
              getUnitProgress={progressHook.getUnitProgress}
              progressData={progressHook.progress}
            />
          </aside>

          <main className="col-span-12 lg:col-span-8">
            <ContentViewer
              unit={currentUnit}
              allUnits={allUnits}
              userId={user?.id}
              isContentCompleted={progressHook.isContentCompleted}
              markComplete={progressHook.markComplete}
              getUnitProgress={progressHook.getUnitProgress}
              onUnitChange={setSelectedUnitId}
            />
          </main>
        </div>
      </div>
    </div>
  )
}

export default CoursePage
