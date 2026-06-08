import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { Toaster } from 'sonner'
import ProtectedRoute from '@/features/auth/components/ProtectedRoute.jsx'
import { API_BASE } from '@/config'

// ── Static imports (needed on first load) ──
import LoginPage from '@/features/auth/pages/LoginPage.jsx'
import RegisterPage from '@/features/auth/pages/RegisterPage.jsx'

// ── Lazy imports (code-split into separate chunks) ──
const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage.jsx'))
const CoursePreviewPage = lazy(() => import('@/features/courses/pages/CoursePreviewPage.jsx'))
const CoursePage = lazy(() => import('@/features/courses/pages/CoursePage.jsx'))
const RoadmapPage = lazy(() => import('@/features/roadmap/pages/RoadmapPage.jsx'))
const AdminDashboardPage = lazy(() => import('@/features/admin/pages/AdminDashboardPage.jsx'))
const StudentDashboardPage = lazy(() => import('@/features/student/pages/StudentDashboardPage.jsx'))
const QuizPage = lazy(() => import('@/features/quizzes/pages/QuizPage.jsx'))
const UserProfilePage = lazy(() => import('@/features/profile/pages/UserProfilePage.jsx'))
const SimulatorPage = lazy(() => import('@/features/simulator/pages/SimulatorPage.jsx'))
const LandingPage = lazy(() => import('@/features/landing/pages/LandingPage.jsx'))

// ── Fallback spinner shown while a lazy chunk downloads ──
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
  </div>
)

function App() {
  // Warm-up ping: wake the Fly.io backend on app mount so it's ready
  // when the user actually needs data. Fire-and-forget, no await.
  // Hits the lightweight "/" health route (just returns {status:ok})
  // instead of "/docs", which would generate the whole Swagger UI.
  useEffect(() => {
    fetch(`${API_BASE}/`, { method: 'GET' }).catch(() => { })
  }, [])

  return (
    <>
      <Toaster position="top-right" richColors closeButton duration={3000} />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Rutas protegidas - requieren autenticación */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student"
            element={
              <ProtectedRoute requiredRole="student">
                <StudentDashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Course preview (landing page before study mode) */}
          <Route
            path="/courses/:courseId"
            element={
              <ProtectedRoute>
                <CoursePreviewPage />
              </ProtectedRoute>
            }
          />

          {/* Course study mode (sidebar + content viewer) */}
          <Route
            path="/courses/:courseId/study"
            element={
              <ProtectedRoute>
                <CoursePage />
              </ProtectedRoute>
            }
          />

          {/* Visual roadmap (dependency graph) */}
          <Route
            path="/roadmap"
            element={
              <ProtectedRoute>
                <RoadmapPage />
              </ProtectedRoute>
            }
          />

          {/* Dedicated Quiz Page */}
          <Route
            path="/courses/:courseId/quiz/:quizId"
            element={
              <ProtectedRoute>
                <QuizPage />
              </ProtectedRoute>
            }
          />

          {/* User Profile */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <UserProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Simulator */}
          <Route
            path="/simulator"
            element={
              <ProtectedRoute>
                <SimulatorPage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    </>
  )
}

export default App
