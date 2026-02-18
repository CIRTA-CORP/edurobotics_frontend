import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import CoursePreviewPage from './pages/CoursePreviewPage.jsx'
import CoursePage from './pages/CoursePage.jsx'
import AdminDashboardPage from './pages/admin/AdminDashboardPage.jsx'
import StudentDashboardPage from './pages/student/StudentDashboardPage.jsx'

function App() {
  return (
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

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
