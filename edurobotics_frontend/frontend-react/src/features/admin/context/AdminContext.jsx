import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getCourseDetail, getAllCourses, invalidateCourseCache } from '@/features/courses/services/courses'
import { useCourses } from '@/features/admin/features/courses/useCourses'
import { useModules } from '@/features/admin/features/modules/useModules'
import { useUnits } from '@/features/admin/features/units/useUnits'
import { useContent } from '@/features/admin/features/content/useContent'

const AdminContext = createContext(null)

export function AdminProvider({ children }) {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()

  // User and view state
  const [user, setUser] = useState(null)
  const [adminView, setAdminView] = useState('admin')
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  // Selection state - initialize from URL
  const [selectedCourseId, setSelectedCourseId] = useState(() => {
    const courseId = searchParams.get('course')
    return courseId ? parseInt(courseId) : null
  })
  const [selectedModule, setSelectedModule] = useState(null)
  const [selectedUnit, setSelectedUnit] = useState(null)

  // Navigation state - initialize from URL
  const [activeTab, setActiveTab] = useState(() => {
    return searchParams.get('tab') || 'cursos'
  })
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
  const [isModuleEditModalOpen, setIsModuleEditModalOpen] = useState(false)
  const [isUnitEditModalOpen, setIsUnitEditModalOpen] = useState(false)
  const [editingModule, setEditingModule] = useState(null)
  const [editingUnit, setEditingUnit] = useState(null)

  // Sync state to URL whenever selectedCourseId or activeTab changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams)

    if (selectedCourseId) {
      params.set('course', selectedCourseId.toString())
    } else {
      params.delete('course')
      params.delete('module')
      params.delete('unit')
    }

    if (activeTab && activeTab !== 'cursos') {
      params.set('tab', activeTab)
    } else {
      params.delete('tab')
    }

    setSearchParams(params, { replace: true })
  }, [selectedCourseId, activeTab, searchParams, setSearchParams])

  // Refresh callbacks (defined before hooks that depend on them)
  const refreshCourses = useCallback(async () => {
    try {
      await queryClient.invalidateQueries({ queryKey: ['admin-courses'] })
      await queryClient.refetchQueries({ queryKey: ['admin-courses'] })
    } catch (error) {
      console.error('Error refreshing courses:', error)
    }
  }, [queryClient])

  const refreshSelectedCourse = useCallback(async (courseId = selectedCourseId) => {
    if (!courseId) return null
    try {
      invalidateCourseCache(courseId)
      await queryClient.invalidateQueries({ queryKey: ['admin-course-detail', courseId] })
      const detail = await queryClient.fetchQuery({
        queryKey: ['admin-course-detail', courseId],
        queryFn: () => getCourseDetail(courseId),
      })
      return detail
    } catch (error) {
      console.error('Error refreshing course:', error)
      return null
    }
  }, [queryClient, selectedCourseId])

  // Custom hooks for business logic
  const courseHooks = useCourses(null, refreshCourses, refreshSelectedCourse)
  const moduleHooks = useModules(null, refreshSelectedCourse)
  const unitHooks = useUnits(null, refreshSelectedCourse)
  const contentHooks = useContent(null, refreshSelectedCourse)

  // React Query hooks
  const { data: coursesResp, error: coursesError, isLoading: isCoursesLoading } = useQuery({
    queryKey: ['admin-courses'],
    queryFn: getAllCourses,
    enabled: !!user && adminView === 'admin',
    staleTime: 5 * 60 * 1000, // 5 minutes for lists
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
  })

  useEffect(() => {
    if (coursesError) {
      console.error('Error loading courses:', coursesError)
      toast.error('Error al cargar cursos: ' + (coursesError.message || 'Error desconocido'))
    }
  }, [coursesError])

  const courses = coursesResp?.courses || []

  const { data: selectedCourseData, isLoading: isSelectedCourseLoading, error: selectedCourseError } = useQuery({
    queryKey: ['admin-course-detail', selectedCourseId],
    queryFn: () => getCourseDetail(selectedCourseId),
    enabled: !!selectedCourseId,
    staleTime: 3 * 60 * 1000, // 3 minutes for details
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
  })

  useEffect(() => {
    if (selectedCourseError) {
      console.error('Error loading course detail:', selectedCourseError)
      toast.error('Error al cargar detalles del curso')
    }
  }, [selectedCourseError])

  const selectedCourse = selectedCourseData || null

  // Synchronize selectedModule and selectedUnit when selectedCourse updates
  useEffect(() => {
    if (selectedCourse) {
      if (!selectedModule) return

      const updatedModule = selectedCourse.modules?.find(m => m.id === selectedModule.id)

      if (updatedModule) {
        if (JSON.stringify(updatedModule) !== JSON.stringify(selectedModule)) {
          setSelectedModule(updatedModule)
        }

        if (selectedUnit) {
          const updatedUnit = updatedModule.units?.find(u => u.id === selectedUnit.id)
          if (updatedUnit) {
            if (JSON.stringify(updatedUnit) !== JSON.stringify(selectedUnit)) {
              setSelectedUnit(updatedUnit)
            }
          } else {
            setSelectedUnit(null)
          }
        }
      } else {
        setSelectedModule(null)
        setSelectedUnit(null)
      }
    }
  }, [selectedCourse, selectedModule, selectedUnit])

  // Handlers
  const handleLogout = () => {
    setShowLogoutModal(true)
  }

  const confirmLogout = () => {
    // Logout logic will be called from page
  }

  const handleCourseSelect = async (course) => {
    try {
      const detail = await getCourseDetail(course.id)
      queryClient.setQueryData(['admin-course-detail', course.id], detail)

      // Clear module/unit selections when switching courses
      setSelectedModule(null)
      setSelectedUnit(null)
      setSelectedCourseId(course.id)

      courseHooks.setCourseForm({
        title: detail.title || '',
        description: detail.description || '',
        image_url: detail.image_url || '',
        level: detail.level || 'beginner',
        is_published: detail.is_published !== false
      })

      if (detail.prerequisites && detail.prerequisites.length > 0) {
        courseHooks.setPrereqIds(detail.prerequisites)
      } else {
        courseHooks.setPrereqIds([])
      }

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
    } catch (error) {
      toast.error(error.message)
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

  const value = {
    // User and view state
    user,
    setUser,
    adminView,
    setAdminView,
    showLogoutModal,
    setShowLogoutModal,

    // Selection state
    selectedCourseId,
    setSelectedCourseId,
    selectedModule,
    setSelectedModule,
    selectedUnit,
    setSelectedUnit,

    // Navigation state
    activeTab,
    setActiveTab,
    expandedSections,
    setExpandedSections,

    // Modal states
    isCourseModalOpen,
    setIsCourseModalOpen,
    isModuleModalOpen,
    setIsModuleModalOpen,
    isUnitModalOpen,
    setIsUnitModalOpen,
    isModuleEditModalOpen,
    setIsModuleEditModalOpen,
    isUnitEditModalOpen,
    setIsUnitEditModalOpen,
    editingModule,
    setEditingModule,
    editingUnit,
    setEditingUnit,

    // Query data
    courses,
    selectedCourse,
    isCoursesLoading,
    isSelectedCourseLoading,

    // Custom hooks
    courseHooks,
    moduleHooks,
    unitHooks,
    contentHooks,

    // Handlers
    handleLogout,
    confirmLogout,
    handleCourseSelect,
    toggleSection,
    handleModuleSelect,
    handleUnitSelect,
    handleCourseCreate,
    handleContentDelete,
    handleModuleDelete,
    handleUnitDelete,
    handleModuleEdit,
    handleUnitEdit,
    handleUnitQuiz,
    handleModuleQuiz,
  }

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  )
}

export function useAdmin() {
  const context = useContext(AdminContext)
  if (!context) {
    throw new Error('useAdmin must be used within AdminProvider')
  }
  return context
}
