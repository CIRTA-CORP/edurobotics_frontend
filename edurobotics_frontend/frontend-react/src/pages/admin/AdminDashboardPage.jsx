import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearStoredUser, getStoredUser } from '../../services/auth'
import { getCourseDetail, getCourses } from '../../services/courses'
import StudentDashboardPage from '../student/StudentDashboardPage'
import { Button } from '../../components/ui/button'
import { Modal } from '../../components/ui/Modal'

// Components
import { AdminHeader } from './components/AdminHeader'
import { CourseList } from './features/courses/CourseList'
import { CourseForm } from './features/courses/CourseForm'
import { ModuleForm } from './features/modules/ModuleForm'
import { ModuleList } from './features/modules/ModuleList'
import { UnitForm } from './features/units/UnitForm'
import { UnitList } from './features/units/UnitList'
import { ContentForm } from './features/content/ContentForm'

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
      const response = await getCourses()
      setCourses(response.courses || [])
    } catch (error) {
      console.error('Error refreshing courses:', error)
    }
  }, [])

  const refreshSelectedCourse = useCallback(async (courseId = selectedCourse?.id) => {
    if (!courseId) return
    try {
      const detail = await getCourseDetail(courseId)
      setSelectedCourse(detail)
    } catch (error) {
      console.error('Error refreshing course:', error)
    }
  }, [selectedCourse?.id])

  // Custom hooks para lógica de negocio
  const courseHooks = useCourses(null, refreshCourses, refreshSelectedCourse)
  const moduleHooks = useModules(null, refreshSelectedCourse)
  const unitHooks = useUnits(null, refreshSelectedCourse)
  const contentHooks = useContent(null, refreshSelectedCourse)

  // Mensaje unificado de todos los hooks
  const message = courseHooks.message || moduleHooks.message || unitHooks.message || contentHooks.message
  const messageType = courseHooks.messageType || moduleHooks.messageType || unitHooks.messageType || contentHooks.messageType

  const setMessage = (msg) => {
    courseHooks.setMessage(msg)
    moduleHooks.setMessage(msg)
    unitHooks.setMessage(msg)
    contentHooks.setMessage(msg)
  }

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
        const response = await getCourses()
        setCourses(response.courses || [])
      } catch (error) {
        setMessage(error.message)
      }
    }
    loadCourses()
  }, [])

  const handleLogout = () => {
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
        level: detail.level || 'beginner'
      })

      // Set prerequisite IDs if they exist
      if (detail.prerequisites && detail.prerequisites.length > 0) {
        courseHooks.setPrereqIds(detail.prerequisites.map(p => p.id).join(','))
      } else {
        courseHooks.setPrereqIds('')
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
    contentHooks.setContentForm({ content_type: 'text', content_value: '', order_index: 1 })
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

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader
        adminView={adminView}
        onViewChange={setAdminView}
        onLogout={handleLogout}
      />

      {message && (
        <div className={`px-6 py-3 ${messageType === 'error' ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'}`}>
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <span>{message}</span>
            <button onClick={() => setMessage('')} className="text-sm underline">Cerrar</button>
          </div>
        </div>
      )}

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
        <div className="max-w-7xl mx-auto p-6">
          <div className="grid grid-cols-12 gap-6">
            {/* Sidebar */}
            <aside className="col-span-3">
              <CourseList
                courses={courses}
                selectedCourse={selectedCourse}
                onCourseSelect={handleCourseSelect}
              />
            </aside>

            {/* Main Content */}
            <main className="col-span-9">
              {/* Tabs */}
              <div className="bg-white rounded-lg shadow-sm mb-6">
                <div className="border-b border-gray-200">
                  <nav className="flex -mb-px">
                    <button
                      onClick={() => setActiveTab('cursos')}
                      className={`px-6 py-3 text-sm font-medium ${activeTab === 'cursos'
                        ? 'border-b-2 border-black text-black'
                        : 'text-gray-600 hover:text-black'
                        }`}
                    >
                      Cursos
                    </button>
                    <button
                      onClick={() => setActiveTab('modulos')}
                      className={`px-6 py-3 text-sm font-medium ${activeTab === 'modulos'
                        ? 'border-b-2 border-black text-black'
                        : 'text-gray-600 hover:text-black'
                        }`}
                      disabled={!selectedCourse}
                    >
                      Módulos
                    </button>
                    <button
                      onClick={() => setActiveTab('unidades')}
                      className={`px-6 py-3 text-sm font-medium ${activeTab === 'unidades'
                        ? 'border-b-2 border-black text-black'
                        : 'text-gray-600 hover:text-black'
                        }`}
                      disabled={!selectedModule}
                    >
                      Unidades
                    </button>
                    <button
                      onClick={() => setActiveTab('contenido')}
                      className={`px-6 py-3 text-sm font-medium ${activeTab === 'contenido'
                        ? 'border-b-2 border-black text-black'
                        : 'text-gray-600 hover:text-black'
                        }`}
                      disabled={!selectedUnit}
                    >
                      Contenido
                    </button>
                  </nav>
                </div>
              </div>

              {/* Tab Content */}
              <div className="space-y-6">
                {/* Tab Cursos */}
                {activeTab === 'cursos' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">Gestión de Cursos</h3>
                      <Button onClick={() => setIsCourseModalOpen(true)}>
                        + Crear Nuevo Curso
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
                        expanded={expandedSections.editar}
                        onToggle={() => toggleSection('editar')}
                      />
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
                      <h3 className="text-lg font-medium">Módulos del Curso</h3>
                      <Button onClick={() => setIsModuleModalOpen(true)}>
                        + Crear Módulo
                      </Button>
                    </div>

                    <Modal
                      isOpen={isModuleModalOpen}
                      onClose={() => setIsModuleModalOpen(false)}
                      title="Crear Nuevo Módulo"
                    >
                      <ModuleForm
                        moduleForm={moduleHooks.moduleForm}
                        setModuleForm={moduleHooks.setModuleForm}
                        onSubmit={async (e) => {
                          await moduleHooks.handleModuleCreate(e, selectedCourse)
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
                      <h3 className="text-lg font-medium">Unidades del Módulo</h3>
                      <Button onClick={() => setIsUnitModalOpen(true)}>
                        + Crear Unidad
                      </Button>
                    </div>

                    <Modal
                      isOpen={isUnitModalOpen}
                      onClose={() => setIsUnitModalOpen(false)}
                      title="Crear Nueva Unidad"
                    >
                      <UnitForm
                        unitForm={unitHooks.unitForm}
                        setUnitForm={unitHooks.setUnitForm}
                        onSubmit={async (e) => {
                          await unitHooks.handleUnitCreate(e, selectedModule, selectedCourse)
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

                {/* Tab Contenido */}
                {activeTab === 'contenido' && selectedUnit && (
                  <div className="space-y-6">
                    <ContentForm
                      contentForm={contentHooks.contentForm}
                      setContentForm={contentHooks.setContentForm}
                      onSubmit={(e) => contentHooks.handleContentCreate(e, selectedUnit.id, selectedCourse)}
                      selectedUnit={selectedUnit}
                      onContentDelete={handleContentDelete}
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
