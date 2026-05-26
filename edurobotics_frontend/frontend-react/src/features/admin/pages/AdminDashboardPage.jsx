import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearStoredUser, getStoredUser } from '@/features/auth/services/auth'
import StudentDashboardPage from '@/features/student/pages/StudentDashboardPage'
import { AdminHeader } from '@/features/admin/components/AdminHeader'
import { CourseList } from '@/features/admin/features/courses/CourseList'
import { LogoutModal } from '@/shared/components/LogoutModal'
import { ErrorBoundary } from '@/shared/components/ErrorBoundary'
import { AdminProvider, useAdmin } from '@/features/admin/context/AdminContext'
import { AdminBreadcrumbs } from '@/features/admin/components/AdminBreadcrumbs'
import { AdminTabBar } from '@/features/admin/components/AdminTabBar'
import { DashboardTab } from '@/features/admin/tabs/DashboardTab'
import { CoursesTab } from '@/features/admin/tabs/CoursesTab'
import { ModulesTab } from '@/features/admin/tabs/ModulesTab'
import { UnitsTab } from '@/features/admin/tabs/UnitsTab'
import { ContentTab } from '@/features/admin/tabs/ContentTab'
import { EvaluationsTab } from '@/features/admin/tabs/EvaluationsTab'

function AdminDashboardLayout() {
  const {
    user,
    setUser,
    adminView,
    setAdminView,
    showLogoutModal,
    setShowLogoutModal,
    activeTab,
    courses,
    selectedCourse,
    handleCourseSelect,
    handleLogout,
    isCoursesLoading,
  } = useAdmin()

  const navigate = useNavigate()

  useEffect(() => {
    const storedUser = getStoredUser()
    if (!storedUser) {
      navigate('/login')
      return
    }
    setUser(storedUser)
  }, [navigate, setUser])

  const handleConfirmLogout = () => {
    clearStoredUser()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <LogoutModal
        isOpen={showLogoutModal}
        onConfirm={handleConfirmLogout}
        onCancel={() => setShowLogoutModal(false)}
      />
      <AdminHeader
        adminView={adminView}
        onViewChange={setAdminView}
        onLogout={handleLogout}
      />

      {adminView === 'student' && (
        <StudentDashboardPage
          userOverride={user}
          hideHeader={true}
          hideLogout={true}
        />
      )}

      {adminView === 'admin' && (
        <div className="max-w-7xl mx-auto p-3 lg:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
            <aside className="lg:col-span-3">
              <CourseList
                courses={courses}
                selectedCourse={selectedCourse}
                onCourseSelect={handleCourseSelect}
                isLoading={isCoursesLoading}
              />
            </aside>

            <main className="lg:col-span-9">
              <AdminBreadcrumbs />
              <AdminTabBar />

              <div className="space-y-6">
                {activeTab === 'dashboard' && <DashboardTab />}
                {activeTab === 'cursos' && <CoursesTab />}
                {activeTab === 'modulos' && <ModulesTab />}
                {activeTab === 'unidades' && <UnitsTab />}
                {activeTab === 'contenido' && <ContentTab />}
                {activeTab === 'evaluaciones' && <EvaluationsTab />}
              </div>
            </main>
          </div>
        </div>
      )}
    </div>
  )
}

function AdminDashboardPage() {
  return (
    <ErrorBoundary>
      <AdminProvider>
        <AdminDashboardLayout />
      </AdminProvider>
    </ErrorBoundary>
  )
}

export default AdminDashboardPage
