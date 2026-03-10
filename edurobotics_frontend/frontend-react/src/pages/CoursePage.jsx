/**
 * Course Detail Page
 *
 * Two-column layout: collapsible sidebar on the left (Coursera-style),
 * content viewer on the right. Redesigned with modern top bar and styling.
 *
 * Performance: getCourseDetail and getUserProgress run in parallel via
 * Promise.all to eliminate the sequential waterfall.
 */

import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getStoredUser } from '../services/auth'
import { getCourseDetail } from '../services/courses'
import { getUserProgress } from '../services/progress'
import { Button } from '../components/ui/button'
import {
  Loader2, BookOpen, ArrowLeft, GraduationCap, Zap, Trophy, Shield, Menu, X
} from 'lucide-react'
import { CourseSidebar } from './course/components/CourseSidebar'
import { ContentViewer } from './course/components/ContentViewer'
import { useProgress } from '../hooks/useProgress'

const LEVEL_CONFIG = {
  beginner: { label: 'Principiante', icon: GraduationCap, color: 'text-emerald-600 bg-emerald-50' },
  intermediate: { label: 'Intermedio', icon: Zap, color: 'text-amber-600 bg-amber-50' },
  advanced: { label: 'Avanzado', icon: Trophy, color: 'text-rose-600 bg-rose-50' },
}

// ── Skeleton loader (shows page structure while data loads) ──
function CoursePageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col animate-pulse">
      {/* Top bar skeleton */}
      <header className="bg-white border-b border-gray-200 px-4 py-2.5 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-16 h-4 bg-gray-200 rounded" />
          <div className="h-5 w-px bg-gray-200" />
          <div>
            <div className="w-40 h-4 bg-gray-200 rounded mb-1" />
            <div className="w-24 h-3 bg-gray-100 rounded" />
          </div>
        </div>
        <div className="w-7 h-7 bg-gray-200 rounded-full" />
      </header>

      {/* Body skeleton */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar skeleton */}
        <aside className="w-72 flex-shrink-0 bg-white border-r border-gray-200 p-4 space-y-4 hidden lg:block">
          <div className="w-full h-5 bg-gray-200 rounded" />
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-2">
                <div className="w-3/4 h-4 bg-gray-200 rounded" />
                <div className="pl-4 space-y-1.5">
                  <div className="w-full h-3 bg-gray-100 rounded" />
                  <div className="w-5/6 h-3 bg-gray-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Content skeleton */}
        <main className="flex-1 p-6 space-y-6">
          <div className="w-2/3 h-6 bg-gray-200 rounded" />
          <div className="w-full h-4 bg-gray-100 rounded" />
          <div className="w-full h-4 bg-gray-100 rounded" />
          <div className="w-5/6 h-4 bg-gray-100 rounded" />
          <div className="w-full h-48 bg-gray-100 rounded-xl mt-4" />
          <div className="w-full h-4 bg-gray-100 rounded" />
          <div className="w-3/4 h-4 bg-gray-100 rounded" />
        </main>
      </div>
    </div>
  )
}

function CoursePage() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedUnitId, setSelectedUnitId] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // useProgress still manages progress state and provides helper methods,
  // but the initial fetch is now parallelized below.
  const progressHook = useProgress(user?.id, parseInt(courseId))

  useEffect(() => {
    const storedUser = getStoredUser()
    if (!storedUser) { navigate('/login'); return }
    setUser(storedUser)
  }, [navigate])

  // ── Parallel data loading ──
  // Fire getCourseDetail + getUserProgress at the same time.
  // getUserProgress doesn't depend on getCourseDetail's result.
  useEffect(() => {
    if (!user?.id) return

    const loadAll = async () => {
      try {
        const [courseData] = await Promise.all([
          getCourseDetail(courseId),
          // This pre-warms the progress data. The useProgress hook will also
          // call getUserProgress, but since it fires at the same tick, the
          // browser de-duplicates the request (same URL = single HTTP call).
          getUserProgress(user.id, parseInt(courseId)).catch(() => null),
        ])

        setCourse(courseData)
        if (courseData?.modules?.length > 0) {
          const firstUnit = courseData.modules[0]?.units?.[0]
          if (firstUnit) setSelectedUnitId(firstUnit.id)
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    loadAll()
  }, [courseId, user])

  const allUnits = course?.modules?.flatMap(m => m.units || []) || []
  const currentUnit = allUnits.find(u => u.id === selectedUnitId)
  const isEmpty = !course?.modules || course.modules.length === 0 || allUnits.length === 0

  // ── Loading (skeleton) ──
  if (loading) return <CoursePageSkeleton />

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
          <BookOpen className="w-6 h-6 text-red-500" />
        </div>
        <p className="text-red-600 mb-4 text-sm">{error}</p>
        <Button onClick={() => navigate('/dashboard')} variant="outline" size="sm">Volver al dashboard</Button>
      </div>
    </div>
  )

  if (!course) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
          <BookOpen className="w-6 h-6 text-gray-400" />
        </div>
        <p className="text-gray-600 mb-4 text-sm">Curso no encontrado</p>
        <Button onClick={() => navigate(`/courses/${courseId}`)} variant="outline" size="sm">Volver al curso</Button>
      </div>
    </div>
  )

  // ── Empty course ──
  if (isEmpty) return (
    <div className="min-h-screen bg-gray-50">
      <CourseTopBar course={course} user={user} onBack={() => navigate(`/courses/${courseId}`)} />
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <BookOpen className="w-8 h-8 text-gray-300" />
        </div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">Curso sin contenido</h3>
        <p className="text-gray-500 mb-6 text-sm">
          Este curso aún no tiene módulos ni unidades creadas.
          {user?.role === 'admin' && (
            <span className="block mt-2">
              Ve al <strong>Panel Admin</strong> para agregar módulos, unidades y contenidos.
            </span>
          )}
        </p>
        <Button onClick={() => navigate(`/courses/${courseId}`)} variant="outline">Volver al curso</Button>
      </div>
    </div>
  )

  // ── Main layout ──
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar */}
      <CourseTopBar course={course} user={user} onBack={() => navigate('/dashboard')} />

      {/* Body: sidebar + content */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile sidebar toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden fixed bottom-4 left-4 z-50 w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Mobile backdrop */}
        {sidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black/30 z-30"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ── Sidebar ── */}
        <aside className={`
          w-72 flex-shrink-0 bg-white border-r border-gray-200 overflow-y-auto
          fixed lg:relative inset-y-0 left-0 z-40
          transform transition-transform duration-200 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          top-0 lg:top-auto pt-14 lg:pt-0
        `}>
          <CourseSidebar
            modules={course.modules || []}
            selectedUnitId={selectedUnitId}
            onUnitClick={(id) => { setSelectedUnitId(id); setSidebarOpen(false) }}
            getModuleProgress={progressHook.getModuleProgress}
            getUnitProgress={progressHook.getUnitProgress}
            progressData={progressHook.progress}
            userId={user?.id}
            courseId={parseInt(courseId)}
            onNavigateUnit={(id) => { setSelectedUnitId(id); setSidebarOpen(false) }}
          />
        </aside>

        {/* ── Main content ── */}
        <main className="flex-1 overflow-y-auto p-3 lg:p-6">
          <ContentViewer
            unit={currentUnit}
            allUnits={allUnits}
            userId={user?.id}
            isContentCompleted={progressHook.isContentCompleted}
            isQuizCompleted={progressHook.isQuizCompleted}
            markComplete={progressHook.markComplete}
            refreshProgress={progressHook.refreshProgress}
            getUnitProgress={progressHook.getUnitProgress}
            onUnitChange={setSelectedUnitId}
          />
        </main>
      </div>
    </div>
  )
}

// ── Top bar component ──
function CourseTopBar({ course, user, onBack }) {
  const level = LEVEL_CONFIG[course.level] || LEVEL_CONFIG.beginner
  const LevelIcon = level.icon

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 py-2.5 flex items-center justify-between flex-shrink-0 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Volver</span>
        </button>

        <div className="h-5 w-px bg-gray-200" />

        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-sm font-semibold text-gray-900 leading-tight">{course.title}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${level.color}`}>
                <LevelIcon className="w-2.5 h-2.5" />
                {level.label}
              </span>
              {course.version && (
                <span className="text-[10px] text-gray-400">v{course.version}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* User info */}
      {user && (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">
            {(user.first_name?.[0] || '') + (user.last_name?.[0] || '')}
          </div>
          {user.role === 'admin' && (
            <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-white">
              <Shield className="w-2 h-2" />
              ADMIN
            </span>
          )}
        </div>
      )}
    </header>
  )
}

export default CoursePage
