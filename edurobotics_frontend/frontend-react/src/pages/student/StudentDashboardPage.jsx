/**
 * Student Dashboard Page
 * 
 * Main student interface displaying available courses.
 * Can be embedded in admin view with customizable header/logout visibility.
 */

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearStoredUser, getStoredUser } from '../../services/auth'
import { getCourses } from '../../services/courses'
import { getRoadmap } from '../../services/progress'
import { BookOpen, Loader2 } from 'lucide-react'
import { StudentHeader } from './components/StudentHeader'
import { HeroSection } from './components/HeroSection'
import { CourseGrid } from './components/CourseGrid'

function StudentDashboardPage({ userOverride = null, hideLogout = false, hideHeader = false, adminView = null, setAdminView = null }) {
  const navigate = useNavigate()
  const [user, setUser] = useState(userOverride)
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (userOverride) return
    const storedUser = getStoredUser()
    if (!storedUser) {
      navigate('/login')
      return
    }
    setUser(storedUser)
  }, [navigate, userOverride])

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const response = await getCourses()
        setCourses(response.courses || [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    loadCourses()
  }, [])

  // Fetch roadmap summary once we have the user and courses loaded
  const [roadmapFetched, setRoadmapFetched] = useState(false)
  useEffect(() => {
    const loadRoadmap = async () => {
      if (!user || !Number.isInteger(user.id)) return
      if (!courses || courses.length === 0) return
      if (roadmapFetched) return

      try {
        const roadmapResp = await getRoadmap(user.id)
        const map = {}
        if (roadmapResp?.roadmap && Array.isArray(roadmapResp.roadmap)) {
          roadmapResp.roadmap.forEach(c => { map[c.id] = c })
        }
        setCourses(prev => (prev || []).map(course => ({ ...course, roadmapSummary: map[course.id] })))
      } catch (e) {
        // ignore roadmap errors for now
      } finally {
        setRoadmapFetched(true)
      }
    }
    loadRoadmap()
  }, [user, courses, roadmapFetched])

  const handleLogout = () => {
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
      <main className={hideHeader ? "p-6" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"}>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6" />
            Cursos activos
          </h2>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
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
