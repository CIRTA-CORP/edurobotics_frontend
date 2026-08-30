/**
 * AdminDashboardPage — the admin panel shell.
 *
 * Renders the header, sidebar and breadcrumbs, and swaps the active tab (driven
 * by AdminContext). Every tab is lazy-loaded so the shell stays light — the
 * heavy Content tab (TipTap) and the student preview only download when opened.
 * An ErrorBoundary wraps everything so one tab crashing can't blank the panel.
 */
import { lazy, Suspense, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { clearStoredUser, getStoredUser } from '@/features/auth/services/auth'
import { AdminHeader } from '@/features/admin/components/AdminHeader'
import { LogoutModal } from '@/shared/components/LogoutModal'
import { ErrorBoundary } from '@/shared/components/ErrorBoundary'
import { AdminProvider, useAdmin } from '@/features/admin/context/AdminContext'
import { AdminBreadcrumbs } from '@/features/admin/components/AdminBreadcrumbs'
import { AdminSidebarNav } from '@/features/admin/components/AdminSidebarNav'

// Lazy-load each tab so the admin shell stays light. The heavy Content tab
// (TipTap editor) and the student preview only download when actually opened.
const named = (p, name) => lazy(() => p().then((m) => ({ default: m[name] })))
const StudentDashboardPage = lazy(() => import('@/features/student/pages/StudentDashboardPage'))
const DashboardTab = named(() => import('@/features/admin/tabs/DashboardTab'), 'DashboardTab')
const CoursesTab = named(() => import('@/features/admin/tabs/CoursesTab'), 'CoursesTab')
const ModulesTab = named(() => import('@/features/admin/tabs/ModulesTab'), 'ModulesTab')
const UnitsTab = named(() => import('@/features/admin/tabs/UnitsTab'), 'UnitsTab')
const ContentTab = named(() => import('@/features/admin/tabs/ContentTab'), 'ContentTab')
const EvaluationsTab = named(() => import('@/features/admin/tabs/EvaluationsTab'), 'EvaluationsTab')
const LandingTab = named(() => import('@/features/admin/tabs/LandingTab'), 'LandingTab')
const SpecializationsTab = named(() => import('@/features/admin/tabs/SpecializationsTab'), 'SpecializationsTab')
const UsersTab = named(() => import('@/features/admin/tabs/UsersTab'), 'UsersTab')
const AnalyticsTab = named(() => import('@/features/admin/tabs/AnalyticsTab'), 'AnalyticsTab')
const StudentsTab = named(() => import('@/features/admin/tabs/StudentsTab'), 'StudentsTab')

const TabLoader = () => (
  <div className="flex justify-center py-16">
    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
  </div>
)

function AdminDashboardLayout() {
  const {
    user,
    setUser,
    adminView,
    setAdminView,
    showLogoutModal,
    setShowLogoutModal,
    activeTab,
    setActiveTab,
    handleLogout,
    isTeacher,
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

  // A teacher has no course-meta tab ('cursos') nor the admin-only tabs; any of
  // those (default or deep link) falls back to their home, "Progreso".
  useEffect(() => {
    if (isTeacher && ['dashboard', 'usuarios', 'especializaciones', 'landing', 'cursos'].includes(activeTab)) {
      setActiveTab('progreso')
    }
  }, [isTeacher, activeTab, setActiveTab])

  const handleConfirmLogout = () => {
    clearStoredUser()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <LogoutModal
        isOpen={showLogoutModal}
        onConfirm={handleConfirmLogout}
        onCancel={() => setShowLogoutModal(false)}
      />
      {/* Student preview: show the REAL student header (with an "Admin" button
          to switch back) so the admin sees exactly what students see. */}
      {adminView === 'student' && (
        <Suspense fallback={<TabLoader />}>
          <StudentDashboardPage
            userOverride={user}
            adminView={adminView}
            setAdminView={setAdminView}
          />
        </Suspense>
      )}

      {adminView !== 'student' && (
        <>
        <AdminHeader
          adminView={adminView}
          onViewChange={setAdminView}
          onLogout={handleLogout}
        />
        {/* The rail is a column of the shell, not a card floating in a grid:
            it runs the full height with a hairline against the work area. */}
        <div className="flex min-h-[calc(100vh-3.5rem)] flex-col lg:flex-row">
          <AdminSidebarNav />

          <main className="min-w-0 flex-1 p-3 lg:p-6">
            <div className="mx-auto max-w-6xl">
              <AdminBreadcrumbs />

              <div className="space-y-6">
                <Suspense fallback={<TabLoader />}>
                  {activeTab === 'dashboard' && <DashboardTab />}
                  {activeTab === 'cursos' && <CoursesTab />}
                  {activeTab === 'modulos' && <ModulesTab />}
                  {activeTab === 'unidades' && <UnitsTab />}
                  {activeTab === 'contenido' && <ContentTab />}
                  {activeTab === 'evaluaciones' && <EvaluationsTab />}
                  {activeTab === 'especializaciones' && <SpecializationsTab />}
                  {activeTab === 'landing' && <LandingTab />}
                  {activeTab === 'usuarios' && <UsersTab />}
                  {activeTab === 'analitica' && <AnalyticsTab />}
                  {activeTab === 'progreso' && <StudentsTab />}
                </Suspense>
              </div>
            </div>
          </main>
        </div>
        </>
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
