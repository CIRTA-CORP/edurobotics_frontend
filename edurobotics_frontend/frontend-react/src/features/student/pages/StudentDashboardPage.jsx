/**
 * Student Dashboard Page
 * 
 * Main student interface displaying available courses.
 * Can be embedded in admin view with customizable header/logout visibility.
 */

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { clearStoredUser, getStoredUser } from '@/features/auth/services/auth'
import { getCourses } from '@/features/courses/services/courses'
import { getRoadmap } from '@/features/progress/services/progress'
import { BookOpen, Loader2 } from 'lucide-react'
import { StudentHeader } from '@/features/student/components/StudentHeader'
import { HeroSection } from '@/features/student/components/HeroSection'
import { CourseGrid } from '@/features/student/components/CourseGrid'
import { LogoutModal } from '@/shared/components/LogoutModal'

function StudentDashboardPage({ userOverride = null, hideLogout = false, hideHeader = false, adminView = null, setAdminView = null }) {
  const navigate = useNavigate()
  const [user, setUser] = useState(() => userOverride || getStoredUser())

  useEffect(() => {
    if (userOverride) return
    if (!user) {
      navigate('/login')
      return
    }
  }, [navigate, userOverride, user])

  const { data: coursesResp, isLoading: coursesLoading, error: coursesError } = useQuery({
    queryKey: ['courses-list'],
    queryFn: getCourses,
    enabled: !!user,
    staleTime: 45_000,
  })

  const { data: roadmapResp } = useQuery({
    queryKey: ['roadmap-full', user?.id],
    queryFn: () => getRoadmap(user.id),
    enabled: !!user && Number.isInteger(user.id),
    staleTime: 20_000,
  })

  const courseList = coursesResp?.courses || []
  const roadmapMap = {}
  if (roadmapResp?.roadmap && Array.isArray(roadmapResp.roadmap)) {
    roadmapResp.roadmap.forEach(c => { roadmapMap[c.id] = c })
  }
  const courses = courseList.map(course => ({ ...course, roadmapSummary: roadmapMap[course.id] }))
  const loading = coursesLoading
  const error = coursesError?.message || null

  const [showLogoutModal, setShowLogoutModal] = useState(false)

  const handleLogout = () => {
    setShowLogoutModal(true)
  }

  const confirmLogout = () => {
    clearStoredUser()
    navigate('/login')
  }

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
    </div>
  )

  return (
    <div className={hideHeader ? "" : "min-h-screen bg-gradient-to-br from-gray-50 to-gray-100"}>
      <LogoutModal
        isOpen={showLogoutModal}
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutModal(false)}
      />
      {!hideHeader && (
        <>
          <StudentHeader
            user={user}
            hideLogout={hideLogout}
            onLogout={handleLogout}
            adminView={adminView}
            setAdminView={setAdminView}
          />
          <HeroSection user={user} courses={courses} />
        </>
      )}

      {/* Main Content */}
      <main className={hideHeader ? "max-w-7xl mx-auto p-6" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"}>
        <div className="mb-6 flex items-end justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-gray-900">Cursos activos</h2>
              <p className="text-sm text-gray-500">
                {loading ? 'Cargando…' : `${courses.length} ${courses.length === 1 ? 'curso disponible' : 'cursos disponibles'}`}
              </p>
            </div>
          </div>
        </div>

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-16 h-5 bg-gray-200 rounded-full" />
                  <div className="w-10 h-5 bg-gray-100 rounded-full" />
                </div>
                <div className="w-3/4 h-5 bg-gray-200 rounded" />
                <div className="w-full h-3 bg-gray-100 rounded" />
                <div className="w-5/6 h-3 bg-gray-100 rounded" />
                <div className="w-full h-2 bg-gray-100 rounded-full mt-2" />
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
            {error}
          </div>
        )}

        {!loading && !error && (
          <CourseGrid courses={courses} onCourseClick={(id) => navigate(`/courses/${id}`)} />
        )}
      </main>
    </div>
  )
}

export default StudentDashboardPage
