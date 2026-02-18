/**
 * Course Detail Page
 *
 * Two-column layout: collapsible sidebar on the left (Coursera-style),
 * content viewer on the right.
 */

import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getStoredUser } from '../services/auth'
import { getCourseDetail } from '../services/courses'
import { Button } from '../components/ui/button'
import { Loader2, BookOpen, ArrowLeft } from 'lucide-react'
import { CourseSidebar } from './course/components/CourseSidebar'
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

  const progressHook = useProgress(user?.id, parseInt(courseId))

  useEffect(() => {
    const storedUser = getStoredUser()
    if (!storedUser) { navigate('/login'); return }
    setUser(storedUser)
  }, [navigate])

  useEffect(() => {
    const loadCourse = async () => {
      try {
        const data = await getCourseDetail(courseId)
        setCourse(data)
        if (data?.modules?.length > 0) {
          const firstUnit = data.modules[0]?.units?.[0]
          if (firstUnit) setSelectedUnitId(firstUnit.id)
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    loadCourse()
  }, [courseId])

  const allUnits = course?.modules?.flatMap(m => m.units || []) || []
  const currentUnit = allUnits.find(u => u.id === selectedUnitId)
  const isEmpty = !course?.modules || course.modules.length === 0 || allUnits.length === 0

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
    </div>
  )

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={() => navigate('/dashboard')}>Volver al dashboard</Button>
      </div>
    </div>
  )

  if (!course) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <p className="text-gray-600 mb-4">Curso no encontrado</p>
        <Button onClick={() => navigate(`/courses/${courseId}`)}>Volver al curso</Button>
      </div>
    </div>
  )

  // ── Empty course ──────────────────────────────────────────────────────────
  if (isEmpty) return (
    <div className="min-h-screen bg-gray-50">
      <CourseTopBar course={course} user={user} onBack={() => navigate(`/courses/${courseId}`)} />
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <BookOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">Curso sin contenido</h3>
        <p className="text-gray-500 mb-6">
          Este curso aún no tiene módulos ni unidades creadas.
          {user?.role === 'admin' && (
            <span className="block mt-2">
              Ve al <strong>Panel Admin</strong> para agregar módulos, unidades y contenidos.
            </span>
          )}
        </p>
        <Button onClick={() => navigate(`/courses/${courseId}`)}>Volver al curso</Button>
      </div>
    </div>
  )

  // ── Main layout ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar */}
      <CourseTopBar course={course} user={user} onBack={() => navigate('/dashboard')} />

      {/* Body: sidebar + content */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Sidebar ── */}
        <aside className="w-72 flex-shrink-0 bg-white border-r border-gray-200 overflow-y-auto">
          <CourseSidebar
            modules={course.modules || []}
            selectedUnitId={selectedUnitId}
            onUnitClick={setSelectedUnitId}
            getModuleProgress={progressHook.getModuleProgress}
            getUnitProgress={progressHook.getUnitProgress}
            progressData={progressHook.progress}
            userId={user?.id}
            courseId={parseInt(courseId)}
            onNavigateUnit={setSelectedUnitId}
          />
        </aside>

        {/* ── Main content ── */}
        <main className="flex-1 overflow-y-auto p-6">
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
  )
}

// ── Top bar component ─────────────────────────────────────────────────────────
function CourseTopBar({ course, user, onBack }) {
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a cursos
        </button>
        <div className="h-4 w-px bg-gray-200" />
        <div>
          <h1 className="text-sm font-semibold text-gray-800 leading-tight">{course.title}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            {course.level && (
              <span className="text-xs text-gray-400 capitalize">{course.level}</span>
            )}
            {course.version && (
              <>
                <span className="text-gray-300 text-xs">·</span>
                <span className="text-xs text-gray-400">Versión {course.version}</span>
              </>
            )}
          </div>
        </div>
      </div>
      {user?.role && (
        <span className="text-xs font-medium text-gray-400 capitalize">{user.role}</span>
      )}
    </header>
  )
}

export default CoursePage
