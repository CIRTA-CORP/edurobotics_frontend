import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { Toaster } from 'sonner'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import { API_BASE } from './config'

// ── Static imports (needed on first load) ──
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'

// ── Lazy imports (code-split into separate chunks) ──
const DashboardPage = lazy(() => import('./pages/DashboardPage.jsx'))
const CoursePreviewPage = lazy(() => import('./pages/CoursePreviewPage.jsx'))
const CoursePage = lazy(() => import('./pages/CoursePage.jsx'))
const RoadmapPage = lazy(() => import('./pages/RoadmapPage.jsx'))
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage.jsx'))
const StudentDashboardPage = lazy(() => import('./pages/student/StudentDashboardPage.jsx'))
const QuizPage = lazy(() => import('./pages/QuizPage.jsx'))
const UserProfilePage = lazy(() => import('./pages/UserProfilePage.jsx'))

// ── Fallback spinner shown while a lazy chunk downloads ──
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
  </div>
)

function App() {
  // Warm-up ping: wake Railway backend on app mount so it's ready
  // when the user actually needs data. Fire-and-forget, no await.
  useEffect(() => {
    fetch(`${API_BASE}/docs`, { method: 'HEAD' }).catch(() => { })
  }, [])

  return (
    <>
      <Toaster position="top-right" richColors closeButton duration={3000} />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
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

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    </>
  )
}

export default App
