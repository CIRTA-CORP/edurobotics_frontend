import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { clearStoredUser, getStoredUser } from '../../services/auth'
import { getCourseDetail, getAllCourses, invalidateCourseCache } from '../../services/courses'
import { CourseFeedbackSummary } from './features/courses/CourseFeedbackSummary'
import { GlobalMetrics } from './features/courses/GlobalMetrics'
import StudentDashboardPage from '../student/StudentDashboardPage'
import { Button } from '../../components/ui/button'
import { Modal } from '../../components/ui/Modal'
import {
  BookOpen, Layers, FileText, Package, ClipboardCheck,
  ChevronRight, Plus, BarChart3
} from 'lucide-react'

// Components
import { AdminHeader } from './components/AdminHeader'
import { CourseList } from './features/courses/CourseList'
import { CourseForm } from './features/courses/CourseForm'
import { LogoutModal } from '../../components/LogoutModal'
import { ModuleForm } from './features/modules/ModuleForm'
import { ModuleList } from './features/modules/ModuleList'
import { UnitForm } from './features/units/UnitForm'
import { UnitList } from './features/units/UnitList'
import { ContentForm } from './features/content/ContentForm'
import { QuizEditor } from './features/quizzes/QuizEditor'

// Custom hooks
import { useCourses } from './features/courses/useCourses'
import { useModules } from './features/modules/useModules'
import { useUnits } from './features/units/useUnits'
import { useContent } from './features/content/useContent'

function AdminDashboardPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [adminView, setAdminView] = useState('admin')
  const [courses, setCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [selectedModule, setSelectedModule] = useState(null)
  const [selectedUnit, setSelectedUnit] = useState(null)
  const [activeTab, setActiveTab] = useState('cursos')
  const [expandedSections, setExpandedSections] = useState({
    crear: true,
    editar: false,
    'modulos-crear': true,
    'unidades-crear': true,
    contenido: true,
  })

  // Modal states
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false)
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false)
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false)

  // Edit modal states
  const [isModuleEditModalOpen, setIsModuleEditModalOpen] = useState(false)
  const [isUnitEditModalOpen, setIsUnitEditModalOpen] = useState(false)
  const [editingModule, setEditingModule] = useState(null)
  const [editingUnit, setEditingUnit] = useState(null)

  // Definir funciones de refresh antes de los hooks
  const refreshCourses = useCallback(async () => {
    try {
      const response = await getAllCourses()
      setCourses(response.courses || [])
    } catch (error) {
      console.error('Error refreshing courses:', error)
    }
  }, [])

  const refreshSelectedCourse = useCallback(async (courseId = selectedCourse?.id) => {
    if (!courseId) return null
    try {
      invalidateCourseCache(courseId)
      const detail = await getCourseDetail(courseId)
      setSelectedCourse(detail)
      return detail
    } catch (error) {
      console.error('Error refreshing course:', error)
      return null
    }
  }, [selectedCourse?.id])

  // Custom hooks para lógica de negocio
  const courseHooks = useCourses(null, refreshCourses, refreshSelectedCourse)
  const moduleHooks = useModules(null, refreshSelectedCourse)
  const unitHooks = useUnits(null, refreshSelectedCourse)
  const contentHooks = useContent(null, refreshSelectedCourse)

  // Messages are now handled by sonner toasts (no more inline banners)

  // Sincronizar selectedModule y selectedUnit cuando se actualiza selectedCourse
  useEffect(() => {
    if (selectedCourse) {
      if (!selectedModule) return; // Nada que sincronizar si no hay módulo seleccionado

      const updatedModule = selectedCourse.modules?.find(m => m.id === selectedModule.id)

      if (updatedModule) {
        // El módulo existe, actualizar si cambió
        if (JSON.stringify(updatedModule) !== JSON.stringify(selectedModule)) {
          setSelectedModule(updatedModule)
        }

        if (selectedUnit) {
          const updatedUnit = updatedModule.units?.find(u => u.id === selectedUnit.id)
          if (updatedUnit) {
            // La unidad existe, actualizar si cambió
            if (JSON.stringify(updatedUnit) !== JSON.stringify(selectedUnit)) {
              setSelectedUnit(updatedUnit)
            }
          } else {
            // La unidad fue eliminada
            setSelectedUnit(null)
          }
        }
      } else {
        // El módulo fue eliminado
        setSelectedModule(null)
        setSelectedUnit(null)
      }
    }
  }, [selectedCourse, selectedModule, selectedUnit])

  useEffect(() => {
    const storedUser = getStoredUser()
    if (!storedUser) {
      navigate('/login')
      return
    }
    setUser(storedUser)
  }, [navigate])

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const response = await getAllCourses()
        setCourses(response.courses || [])
      } catch (error) {
        toast.error(error.message)
      }
    }
    loadCourses()
  }, [])

  const [showLogoutModal, setShowLogoutModal] = useState(false)

  const handleLogout = () => {
    setShowLogoutModal(true)
  }

  const confirmLogout = () => {
    clearStoredUser()
    navigate('/login')
  }

  const handleCourseSelect = async (course) => {
    try {
      const detail = await getCourseDetail(course.id)
      setSelectedCourse(detail)

      // Pre-fill course form with selected course data
      courseHooks.setCourseForm({
        title: detail.title || '',
        description: detail.description || '',
        level: detail.level || 'beginner',
        is_published: detail.is_published !== false
      })

      // Set prerequisite IDs if they exist (prerequisites is already number[])
      if (detail.prerequisites && detail.prerequisites.length > 0) {
        courseHooks.setPrereqIds(detail.prerequisites)
      } else {
        courseHooks.setPrereqIds([])
      }

      // Auto-select first module and unit if available for smoother navigation
      if (detail.modules && detail.modules.length > 0) {
        const firstModule = detail.modules[0]
        setSelectedModule(firstModule)

        if (firstModule.units && firstModule.units.length > 0) {
          setSelectedUnit(firstModule.units[0])
        } else {
          setSelectedUnit(null)
        }
      } else {
        setSelectedModule(null)
        setSelectedUnit(null)
      }

      // Stay in Cursos tab instead of navigating to Módulos
      // setActiveTab('modulos') // REMOVED
    } catch (error) {
      setMessage(error.message)
    }
  }

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const handleModuleSelect = (module) => {
    setSelectedModule(module)

    // Auto-select first unit if available
    if (module.units && module.units.length > 0) {
      setSelectedUnit(module.units[0])
    } else {
      setSelectedUnit(null)
    }

    setActiveTab('unidades')
  }

  const handleUnitSelect = (unit) => {
    setSelectedUnit(unit)
    setActiveTab('contenido')
  }

  const handleCourseCreate = async (e) => {
    e.preventDefault()
    await courseHooks.handleCourseCreate(e)
    moduleHooks.setModuleForm({ title: '', description: '', order_index: 1 })
    unitHooks.setUnitForm({ title: '', description: '', order_index: 1 })
  }

  const handleContentDelete = async (contentId) => {
    if (!window.confirm('¿Estás seguro de eliminar este contenido?')) return

    try {
      await contentHooks.handleContentDelete(contentId, selectedCourse)
      // No necesitamos limpiar selectedUnit aquí, solo refrescar el contenido
    } catch (error) {
      console.error('Error deleting content:', error)
    }
  }

  const handleModuleDelete = async (moduleId) => {
    if (!window.confirm('¿Estás seguro de eliminar este módulo?')) return

    try {
      await moduleHooks.handleModuleDelete(moduleId, selectedCourse)
      setSelectedModule(null)
      setSelectedUnit(null)
    } catch (error) {
      console.error('Error deleting module:', error)
    }
  }

  const handleUnitDelete = async (unitId) => {
    if (!window.confirm('¿Estás seguro de eliminar esta unidad?')) return

    try {
      await unitHooks.handleUnitDelete(unitId, selectedCourse)
      setSelectedUnit(null)
    } catch (error) {
      console.error('Error deleting unit:', error)
    }
  }

  // Edit handlers
  const handleModuleEdit = (module) => {
    setEditingModule(module)
    moduleHooks.setModuleForm({
      title: module.title || '',
      description: module.description || '',
      order_index: module.order_index || 1
    })
    setIsModuleEditModalOpen(true)
  }

  const handleUnitEdit = (unit) => {
    setEditingUnit(unit)
    unitHooks.setUnitForm({
      title: unit.title || '',
      description: unit.description || '',
      order_index: unit.order_index || 1
    })
    setIsUnitEditModalOpen(true)
  }

  const handleUnitQuiz = (unit) => {
    setSelectedUnit(unit)
    setActiveTab('evaluaciones')
  }

  const handleModuleQuiz = (module) => {
    setSelectedModule(module)
    setActiveTab('evaluaciones')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <LogoutModal
        isOpen={showLogoutModal}
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutModal(false)}
      />
      <AdminHeader
        adminView={adminView}
        onViewChange={setAdminView}
        onLogout={handleLogout}
      />

      {/* Vista Estudiante */}
      {adminView === 'student' && (
        <StudentDashboardPage
          userOverride={user}
          hideHeader={true}
          hideLogout={true}
        />
      )}

      {/* Vista Admin */}
      {adminView === 'admin' && (
        <div className="max-w-7xl mx-auto p-3 lg:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
            {/* Sidebar */}
            <aside className="lg:col-span-3">
              <CourseList
                courses={courses}
                selectedCourse={selectedCourse}
                onCourseSelect={handleCourseSelect}
              />
            </aside>

            {/* Main Content */}
            <main className="lg:col-span-9">
              {/* Breadcrumbs */}
              <nav className="mb-4 lg:mb-6">
                <ol className="flex items-center gap-1 text-sm flex-wrap">
                  <li>
                    <button
                      onClick={() => setActiveTab('dashboard')}
                      className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors ${activeTab === 'dashboard' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
                    >
                      <BarChart3 className="w-3.5 h-3.5 inline mr-1" />
                      Admin
                    </button>
                  </li>
                  <li className="text-gray-300"><ChevronRight className="w-3.5 h-3.5" /></li>
                  <li>
                    <button
                      onClick={() => setActiveTab('cursos')}
                      className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors ${activeTab === 'cursos' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
                    >
                      {selectedCourse ? selectedCourse.title : 'Cursos'}
                    </button>
                  </li>
                  {selectedCourse && selectedModule && (
                    <>
                      <li className="text-gray-300"><ChevronRight className="w-3.5 h-3.5" /></li>
                      <li>
                        <button
                          onClick={() => setActiveTab('modulos')}
                          className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors ${activeTab === 'modulos' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                          {selectedModule.title}
                        </button>
                      </li>
                    </>
                  )}
                  {selectedUnit && (
                    <>
                      <li className="text-gray-300"><ChevronRight className="w-3.5 h-3.5" /></li>
                      <li>
                        <button
                          onClick={() => setActiveTab('unidades')}
                          className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors ${activeTab === 'unidades' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                          {selectedUnit.title}
                        </button>
                      </li>
                    </>
                  )}
                  {selectedUnit && (activeTab === 'contenido' || activeTab === 'evaluaciones') && (
                    <>
                      <li className="text-gray-300"><ChevronRight className="w-3.5 h-3.5" /></li>
                      <li>
                        <span className="px-2.5 py-1.5 rounded-lg font-medium bg-indigo-100 text-indigo-700">
                          {activeTab === 'contenido' ? 'Contenido' : 'Evaluaciones'}
                        </span>
                      </li>
                    </>
                  )}
                </ol>
              </nav>

              {/* Tabs */}
              <div className="mb-4 lg:mb-6">
                <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 overflow-x-auto">
                  {[
                    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, enabled: true },
                    { id: 'cursos', label: 'Cursos', icon: BookOpen, enabled: true },
                    { id: 'modulos', label: 'Módulos', icon: Layers, enabled: !!selectedCourse },
                    { id: 'unidades', label: 'Unidades', icon: FileText, enabled: !!selectedModule },
                    { id: 'contenido', label: 'Contenido', icon: Package, enabled: !!selectedUnit },
                    { id: 'evaluaciones', label: 'Evaluaciones', icon: ClipboardCheck, enabled: !!selectedUnit },
                  ].map(tab => {
                    const TabIcon = tab.icon
                    const isActive = activeTab === tab.id
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        disabled={!tab.enabled}
                        className={`flex items-center justify-center gap-1.5 px-3 lg:px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${isActive
                          ? 'bg-white text-gray-900 shadow-sm'
                          : tab.enabled
                            ? 'text-gray-500 hover:text-gray-700'
                            : 'text-gray-300 cursor-not-allowed'
                          }`}
                      >
                        <TabIcon className="w-4 h-4 flex-shrink-0" />
                        <span className="hidden sm:inline">{tab.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Tab Content */}
              <div className="space-y-6">
                {/* Tab Dashboard */}
                {activeTab === 'dashboard' && (
                  <GlobalMetrics />
                )}

                {/* Tab Cursos */}
                {activeTab === 'cursos' && (
                  <div className="space-y-6">

                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-gray-900">Gestión de Cursos</h3>
                      <Button onClick={() => setIsCourseModalOpen(true)} className="gap-1.5">
                        <Plus className="w-4 h-4" />
                        Crear Curso
                      </Button>
                    </div>

                    {/* Course Management Section */}
                    {selectedCourse && (
                      <CourseForm
                        mode="edit"
                        courseForm={courseHooks.courseForm}
                        setCourseForm={courseHooks.setCourseForm}
                        prereqIds={courseHooks.prereqIds}
                        setPrereqIds={courseHooks.setPrereqIds}
                        isSubmitting={courseHooks.isSubmitting}
                        onSubmit={(e) => courseHooks.handleCourseUpdate(e, selectedCourse)}
                        onDelete={() => {
                          if (window.confirm(`¿Eliminar el curso "${selectedCourse.title}"?`)) {
                            courseHooks.handleCourseDelete(selectedCourse)
                            setSelectedCourse(null)
                            setSelectedModule(null)
                            setSelectedUnit(null)
                          }
                        }}
                        onPrereqSave={() => courseHooks.handlePrereqSave(selectedCourse)}
                        selectedCourse={selectedCourse}
                        allCourses={courses}
                        expanded={expandedSections.editar}
                        onToggle={() => toggleSection('editar')}
                      />
                    )}

                    {/* Feedback Summary */}
                    {selectedCourse && (
                      <CourseFeedbackSummary courseId={selectedCourse.id} />
                    )}

                    {/* Create Course Modal */}
                    <Modal
                      isOpen={isCourseModalOpen}
                      onClose={() => setIsCourseModalOpen(false)}
                      title="Crear Nuevo Curso"
                    >
                      <CourseForm
                        mode="create"
                        courseForm={courseHooks.courseForm}
                        setCourseForm={courseHooks.setCourseForm}
                        isSubmitting={courseHooks.isSubmitting}
                        onSubmit={async (e) => {
                          await handleCourseCreate(e)
                          setIsCourseModalOpen(false)
                        }}
                        expanded={true}
                        onToggle={() => { }}
                      />
                    </Modal>
                  </div>
                )}

                {/* Tab Módulos */}
                {activeTab === 'modulos' && selectedCourse && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-gray-900">Módulos del Curso</h3>
                      <Button onClick={() => setIsModuleModalOpen(true)} className="gap-1.5">
                        <Plus className="w-4 h-4" />
                        Crear Módulo
                      </Button>
                    </div>

                    <Modal
                      isOpen={isModuleModalOpen}
                      onClose={() => setIsModuleModalOpen(false)}
                      title="Crear Nuevo Módulo"
                    >
                      <ModuleForm
                        mode="create"
                        isSubmitting={moduleHooks.isSubmitting}
                        moduleForm={moduleHooks.moduleForm}
                        setModuleForm={moduleHooks.setModuleForm}
                        onSubmit={async (e) => {
                          const newModule = await moduleHooks.handleModuleCreate(e, selectedCourse)
                          if (newModule) handleModuleSelect(newModule)
                          setIsModuleModalOpen(false)
                        }}
                        expanded={true}
                        onToggle={() => { }}
                      />
                    </Modal>

                    <ModuleList
                      modules={selectedCourse.modules || []}
                      selectedModuleId={selectedModule?.id}
                      onModuleSelect={handleModuleSelect}
                      onModuleEdit={handleModuleEdit}
                      onModuleDelete={handleModuleDelete}
                      onModuleQuiz={handleModuleQuiz}
                    />

                    {/* Edit Module Modal */}
                    <Modal
                      isOpen={isModuleEditModalOpen}
                      onClose={() => {
                        setIsModuleEditModalOpen(false)
                        setEditingModule(null)
                      }}
                      title="Editar Módulo"
                    >
                      <ModuleForm
                        mode="edit"
                        isSubmitting={moduleHooks.isSubmitting}
                        moduleForm={moduleHooks.moduleForm}
                        setModuleForm={moduleHooks.setModuleForm}
                        onSubmit={async (e) => {
                          await moduleHooks.handleModuleUpdate(e, editingModule.id, selectedCourse)
                          setIsModuleEditModalOpen(false)
                          setEditingModule(null)
                        }}
                        expanded={true}
                        onToggle={() => { }}
                      />
                    </Modal>
                  </div>
                )}

                {/* Tab Unidades */}
                {activeTab === 'unidades' && selectedModule && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-gray-900">Unidades del Módulo</h3>
                      <Button onClick={() => setIsUnitModalOpen(true)} className="gap-1.5">
                        <Plus className="w-4 h-4" />
                        Crear Unidad
                      </Button>
                    </div>

                    <Modal
                      isOpen={isUnitModalOpen}
                      onClose={() => setIsUnitModalOpen(false)}
                      title="Crear Nueva Unidad"
                    >
                      <UnitForm
                        mode="create"
                        isSubmitting={unitHooks.isSubmitting}
                        unitForm={unitHooks.unitForm}
                        setUnitForm={unitHooks.setUnitForm}
                        onSubmit={async (e) => {
                          const newUnit = await unitHooks.handleUnitCreate(e, selectedModule, selectedCourse)
                          if (newUnit) handleUnitSelect(newUnit)
                          setIsUnitModalOpen(false)
                        }}
                        expanded={true}
                        onToggle={() => { }}
                      />
                    </Modal>

                    <UnitList
                      units={selectedModule.units || []}
                      selectedUnitId={selectedUnit?.id}
                      onUnitSelect={handleUnitSelect}
                      onUnitEdit={handleUnitEdit}
                      onUnitDelete={handleUnitDelete}
                      onUnitQuiz={handleUnitQuiz}
                    />

                    {/* Edit Unit Modal */}
                    <Modal
                      isOpen={isUnitEditModalOpen}
                      onClose={() => {
                        setIsUnitEditModalOpen(false)
                        setEditingUnit(null)
                      }}
                      title="Editar Unidad"
                    >
                      <UnitForm
                        mode="edit"
                        isSubmitting={unitHooks.isSubmitting}
                        unitForm={unitHooks.unitForm}
                        setUnitForm={unitHooks.setUnitForm}
                        onSubmit={async (e) => {
                          await unitHooks.handleUnitUpdate(e, editingUnit.id, selectedCourse)
                          setIsUnitEditModalOpen(false)
                          setEditingUnit(null)
                        }}
                        expanded={true}
                        onToggle={() => { }}
                      />
                    </Modal>
                  </div>
                )}

                {/* Tab Evaluaciones */}
                {activeTab === 'evaluaciones' && selectedUnit && (
                  <div className="space-y-6">
                    <QuizEditor
                      unitId={selectedUnit.id}
                    />
                  </div>
                )}

                {/* Tab Contenido */}
                {activeTab === 'contenido' && selectedUnit && (
                  <div className="space-y-6">
                    <ContentForm
                      selectedUnit={selectedUnit}
                      onRichContentSave={(html) => contentHooks.handleRichContentSave(html, selectedUnit, selectedCourse)}
                      onContentDelete={handleContentDelete}
                      onMigrateLegacy={() => contentHooks.handleMigrateLegacy(selectedUnit, selectedCourse)}
                      saving={contentHooks.saving}
                      expanded={expandedSections.contenido}
                      onToggle={() => toggleSection('contenido')}
                    />
                  </div>
                )}
              </div>
            </main>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboardPage
