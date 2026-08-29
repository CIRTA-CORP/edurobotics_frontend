/**
 * Course Detail Page
 *
 * Two-column layout: collapsible sidebar on the left (Coursera-style),
 * content viewer on the right. Redesigned with modern top bar and styling.
 *
 * Performance: getCourseDetail and getUserProgress run in parallel via
 * Promise.all to eliminate the sequential waterfall.
 */

import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getStoredUser } from '@/features/auth/services/auth'
import { getCourseDetail, checkPrerequisites, enrollCourse } from '@/features/courses/services/courses'
import { Button } from '@/shared/components/button'
import {
  BookOpen, ArrowLeft, Shield, Menu, X, PanelLeftOpen, Map
} from 'lucide-react'
import { CourseSidebar } from '@/features/courses/components/CourseSidebar'
import { ContentViewer } from '@/features/courses/components/ContentViewer'
import { useProgress } from '@/shared/hooks/useProgress'
import { countCompletedUnits } from '@/features/courses/lib/unitCompletion'
import { COURSE_LEVELS } from '@/shared/lib/courseLevel'

const LEVEL_CONFIG = {
  beginner: { ...COURSE_LEVELS.beginner, color: 'text-emerald-600 bg-emerald-50' },
  intermediate: { ...COURSE_LEVELS.intermediate, color: 'text-amber-600 bg-amber-50' },
  advanced: { ...COURSE_LEVELS.advanced, color: 'text-rose-600 bg-rose-50' },
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
  const numericCourseId = Number.parseInt(courseId, 10)
  const navigate = useNavigate()
  const [user, setUser] = useState(() => getStoredUser())
  const [selectedUnitId, setSelectedUnitId] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false) // desktop "modo foco"
  const mainRef = useRef(null)
  const [readProgress, setReadProgress] = useState(0)

  // useProgress still manages progress state and provides helper methods,
  // but the initial fetch is now parallelized below.
  const progressHook = useProgress(user?.id, numericCourseId)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
  }, [navigate, user])

  const {
    data: course,
    isLoading: courseLoading,
    error: courseError,
  } = useQuery({
    queryKey: ['course-detail', numericCourseId],
    queryFn: () => getCourseDetail(numericCourseId),
    enabled: Number.isFinite(numericCourseId),
    staleTime: 60_000,
  })

  const { data: prereqResult } = useQuery({
    queryKey: ['prereq-check', numericCourseId, user?.id],
    queryFn: () => checkPrerequisites(numericCourseId, user.id),
    enabled: !!user?.id && Number.isFinite(numericCourseId),
    staleTime: 10_000,
  })

  useEffect(() => {
    if (prereqResult && !prereqResult.allowed && user?.role !== 'admin') {
      navigate(`/courses/${courseId}`, { replace: true })
    }
  }, [prereqResult, user?.role, navigate, courseId])

  useEffect(() => {
    if (!course || selectedUnitId) return
    const firstUnit = course.modules?.[0]?.units?.[0]
    if (firstUnit) setSelectedUnitId(firstUnit.id)
  }, [course, selectedUnitId])

  // Enroll the student when they open the course (idempotent, fire-and-forget).
  useEffect(() => {
    if (user?.id && course?.id) enrollCourse(course.id).catch(() => {})
  }, [user?.id, course?.id])

  const allUnits = course?.modules?.flatMap(m => m.units || []) || []
  const currentUnit = allUnits.find(u => u.id === selectedUnitId)
  const isEmpty = !course?.modules || course.modules.length === 0 || allUnits.length === 0
  const unitsDone = countCompletedUnits(allUnits, progressHook.progress, progressHook.getUnitProgress)

  // ── Reading progress bar (scroll-based) ──
  useEffect(() => {
    const el = mainRef.current
    if (!el) return
    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el
      const max = scrollHeight - clientHeight
      setReadProgress(max > 0 ? Math.min(100, (scrollTop / max) * 100) : 0)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [course])

  // Reset progress bar on unit change
  useEffect(() => { setReadProgress(0) }, [selectedUnitId])

  // ── Loading (skeleton) ──
  if (courseLoading) return <CoursePageSkeleton />

  if (courseError) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
          <BookOpen className="w-6 h-6 text-red-500" />
        </div>
        <p className="text-red-600 mb-4 text-sm">{courseError?.message}</p>
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
    <div className="min-h-screen bg-white flex flex-col">
      {/* Top bar */}
      <CourseTopBar
        course={course}
        user={user}
        onBack={() => navigate('/dashboard')}
        unitsDone={unitsDone}
        unitsTotal={allUnits.length}
        onRoadmap={() => navigate('/roadmap')}
      />

      {/* Body: sidebar + content */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Reading progress bar */}
        <div className="absolute top-0 left-0 right-0 z-50 h-0.5 bg-gray-100">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-150 ease-out"
            style={{ width: `${readProgress}%` }}
          />
        </div>
        {/* Mobile: open the index as a bottom sheet */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-expanded={sidebarOpen}
          className="lg:hidden fixed bottom-4 left-4 z-50 inline-flex items-center gap-2 pl-3 pr-4 py-2.5 bg-gray-900 text-white rounded-full shadow-lg text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          Índice
        </button>

        {/* Mobile backdrop */}
        {sidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black/30 z-30"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ── Index: bottom sheet on mobile, column on desktop ── */}
        <aside className={`
          bg-gray-50 overflow-y-auto z-40
          fixed inset-x-0 bottom-0 max-h-[78vh] rounded-t-2xl border-t border-gray-200 shadow-2xl
          transition-transform duration-200 ease-out
          ${sidebarOpen ? 'translate-y-0' : 'translate-y-full'}
          lg:static lg:translate-y-0 lg:max-h-none lg:w-80 lg:flex-shrink-0
          lg:rounded-none lg:border-t-0 lg:border-r lg:shadow-none lg:bg-gray-50/70
          ${sidebarCollapsed ? 'lg:hidden' : ''}
        `}>
          {/* Grab handle (mobile sheet only) */}
          <div className="lg:hidden flex justify-center pt-2.5 pb-1" aria-hidden="true">
            <div className="w-9 h-1 rounded-full bg-gray-300" />
          </div>

          <CourseSidebar
            modules={course.modules || []}
            selectedUnitId={selectedUnitId}
            onUnitClick={(id) => { setSelectedUnitId(id); setSidebarOpen(false) }}
            getModuleProgress={progressHook.getModuleProgress}
            getUnitProgress={progressHook.getUnitProgress}
            progressData={progressHook.progress}
            onHide={() => setSidebarCollapsed(true)}
          />
        </aside>

        {/* Restore index (desktop focus mode) */}
        {sidebarCollapsed && (
          <button
            onClick={() => setSidebarCollapsed(false)}
            className="hidden lg:flex items-center gap-2 fixed bottom-5 left-5 z-50 pl-3 pr-4 py-2.5 rounded-full bg-white border border-gray-200 shadow-sm text-sm text-gray-600 hover:text-gray-900 hover:shadow-md transition-all"
          >
            <PanelLeftOpen className="w-4 h-4" />
            Mostrar índice
          </button>
        )}

        {/* ── Main content ── */}
        <main ref={mainRef} className="flex-1 overflow-y-auto p-3 lg:p-6">
          <ContentViewer
            unit={currentUnit}
            allUnits={allUnits}
            modules={course.modules || []}
            userId={user?.id}
            isContentCompleted={progressHook.isContentCompleted}
            isQuizCompleted={progressHook.isQuizCompleted}
            markComplete={progressHook.markComplete}
            updateAccess={progressHook.updateAccess}
            refreshProgress={progressHook.refreshProgress}
            getUnitProgress={progressHook.getUnitProgress}
            onUnitChange={setSelectedUnitId}
            scrollRef={mainRef}
          />
        </main>
      </div>
    </div>
  )
}

// ── Progress ring: units done out of total ──
function ProgressRing({ done, total }) {
  const pct = total > 0 ? done / total : 0
  const radius = 10.5
  const circumference = 2 * Math.PI * radius

  return (
    <div className="hidden sm:flex items-center gap-2.5">
      <svg width="26" height="26" viewBox="0 0 26 26" className="-rotate-90" aria-hidden="true">
        <circle cx="13" cy="13" r={radius} fill="none" stroke="#eceaf5" strokeWidth="3" />
        <circle
          cx="13" cy="13" r={radius} fill="none" stroke="#6366f1" strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${circumference * pct} ${circumference}`}
        />
      </svg>
      <div className="leading-tight">
        <div className="font-mono text-xs font-semibold text-gray-700 tabular-nums">
          {done}/{total}
        </div>
        <div className="text-[10px] text-gray-400">unidades</div>
      </div>
    </div>
  )
}

// ── Top bar component ──
function CourseTopBar({ course, user, onBack, unitsDone = 0, unitsTotal = 0, onRoadmap }) {
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

      <div className="flex items-center gap-3.5 flex-shrink-0">
        {/* The index no longer carries this link, so the course map lives here. */}
        {onRoadmap && (
          <button
            onClick={onRoadmap}
            className="hidden md:inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
          >
            <Map className="w-3.5 h-3.5" />
            Ver la malla
          </button>
        )}

        {unitsTotal > 0 && (
          <>
            <ProgressRing done={unitsDone} total={unitsTotal} />
            <div className="hidden sm:block h-5 w-px bg-gray-200" />
          </>
        )}

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
      </div>
    </header>
  )
}

export default CoursePage
