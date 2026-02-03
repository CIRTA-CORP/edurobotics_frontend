import { Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import CoursePage from './pages/CoursePage.jsx'
import AdminDashboardPage from './pages/admin/AdminDashboardPage.jsx'
import StudentDashboardPage from './pages/student/StudentDashboardPage.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/admin" element={<AdminDashboardPage />} />
      <Route path="/student" element={<StudentDashboardPage />} />
      <Route path="/courses/:courseId" element={<CoursePage />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
