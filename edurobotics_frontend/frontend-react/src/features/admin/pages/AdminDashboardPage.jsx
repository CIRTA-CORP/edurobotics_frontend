/**
 * AdminDashboardPage — the admin panel shell.
 *
 * Renders the header, sidebar and breadcrumbs, and swaps the active tab (driven
 * by AdminContext). Every tab is lazy-loaded so the shell stays light — the
 * heavy Content tab (TipTap) and the student preview only download when opened.
 * An ErrorBoundary wraps everything so one tab crashing can't blank the panel.
 */
import { lazy, Suspense, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Loader2, PanelsTopLeft } from 'lucide-react'
import { clearStoredUser, getStoredUser } from '@/features/auth/services/auth'
import { AdminHeader } from '@/features/admin/components/AdminHeader'
import { LogoutModal } from '@/shared/components/LogoutModal'
import { ErrorBoundary } from '@/shared/components/ErrorBoundary'
import { AdminProvider, useAdmin } from '@/features/admin/context/AdminContext'
import { AdminSidebarNav } from '@/features/admin/components/AdminSidebarNav'
import { CourseCreateDrawer } from '@/features/admin/components/CourseCreateDrawer'
import { WorkshopDrawers } from '@/features/admin/components/WorkshopDrawers'
import { CourseColumn } from '@/features/admin/components/CourseColumn'

// Lazy-load each tab so the admin shell stays light. The heavy Content tab
// (TipTap editor) and the student preview only download when actually opened.
const named = (p, name) => lazy(() => p().then((m) => ({ default: m[name] })))
const StudentDashboardPage = lazy(() => import('@/features/student/pages/StudentDashboardPage'))
const DashboardTab = named(() => import('@/features/admin/tabs/DashboardTab'), 'DashboardTab')
const CoursesTab = named(() => import('@/features/admin/tabs/CoursesTab'), 'CoursesTab')
const WorkshopTab = named(() => import('@/features/admin/tabs/WorkshopTab'), 'WorkshopTab')
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
    selectedCourse,
  } = useAdmin()

  const navigate = useNavigate()
  // null | 'rail' | 'courses' — solo se usa bajo lg
  const [mobilePanel, setMobilePanel] = useState(null)
  const hasCourseColumn = activeTab === 'cursos' || activeTab === 'taller'

  useEffect(() => {
    const storedUser = getStoredUser()
    if (!storedUser) {
      navigate('/login')
      return
    }
    setUser(storedUser)
  }, [navigate, setUser])

  // A teacher has no course-meta tab ('cursos' is only the empty shell behind the
  // course column; they pick a course there and land on 'taller') nor the
  // admin-only tabs; any of those (default or deep link) falls back to "Progreso".
  useEffect(() => {
    if (isTeacher && ['dashboard', 'usuarios', 'especializaciones', 'landing'].includes(activeTab)) {
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
        <CourseCreateDrawer />
        <WorkshopDrawers />

        {/* On a phone the three columns cannot sit side by side, and stacking
            them would bury the editor under the whole rail and course list.
            Below lg they become slide-over panels and the work area owns the
            screen; from lg up the layout is the canvas's three columns. */}
        <div className="flex items-center gap-2 border-b border-[#ececf1] bg-white px-3 py-2 lg:hidden">
          <button
            onClick={() => setMobilePanel(mobilePanel === 'rail' ? null : 'rail')}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#e9e9ee] px-3 text-[13px] font-semibold text-[#55545f]"
          >
            <PanelsTopLeft className="h-4 w-4" /> Secciones
          </button>
          {hasCourseColumn && (
            <button
              onClick={() => setMobilePanel(mobilePanel === 'courses' ? null : 'courses')}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#e9e9ee] px-3 text-[13px] font-semibold text-[#55545f]"
            >
              <BookOpen className="h-4 w-4" /> Cursos
            </button>
          )}
        </div>

        {mobilePanel && (
          <div
            className="fixed inset-0 z-40 bg-black/30 lg:hidden"
            onClick={() => setMobilePanel(null)}
            aria-hidden="true"
          />
        )}

        <div className="flex min-h-[calc(100vh-3.5rem)] flex-col lg:flex-row">
          {/* Cualquier clic dentro cierra el panel: elegir algo es navegar, y
              en móvil la capa tiene que quitarse de en medio sola. */}
          <div
            onClick={() => setMobilePanel(null)}
            className={`z-50 max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:w-[280px] max-lg:overflow-y-auto max-lg:bg-[#fafafa] max-lg:shadow-2xl max-lg:transition-transform ${
              mobilePanel === 'rail' ? 'max-lg:translate-x-0' : 'max-lg:-translate-x-full'
            }`}
          >
            <AdminSidebarNav />
          </div>

          {/* Second column of the canvas: the course list and, when one is open,
              its module/unit tree. Present in the Cursos/taller context. */}
          {hasCourseColumn && (
            <div
              onClick={() => setMobilePanel(null)}
              className={`z-50 max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:w-[300px] max-lg:overflow-y-auto max-lg:shadow-2xl max-lg:transition-transform ${
                mobilePanel === 'courses' ? 'max-lg:translate-x-0' : 'max-lg:-translate-x-full'
              }`}
            >
              <CourseColumn />
            </div>
          )}

          <main className="min-w-0 flex-1 p-3 lg:p-6">
            <div className="mx-auto max-w-6xl">
              {/* Sin barra de migas: el árbol del taller dice dónde estás y el
                  editor lleva su propia línea de contexto. */}
              <div className="space-y-6">
                <Suspense fallback={<TabLoader />}>
                  {activeTab === 'dashboard' && <DashboardTab />}
                  {activeTab === 'cursos' && <CoursesTab />}
                  {activeTab === 'taller' && (selectedCourse ? <WorkshopTab /> : <CoursesTab />)}
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
