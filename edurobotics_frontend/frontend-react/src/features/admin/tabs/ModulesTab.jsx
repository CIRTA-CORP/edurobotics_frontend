import { Plus } from 'lucide-react'
import { Button } from '@/shared/components/button'
import { Drawer } from '@/shared/components/Drawer'
import { ModuleForm } from '@/features/admin/features/modules/ModuleForm'
import { ModuleList } from '@/features/admin/features/modules/ModuleList'
import { useAdmin } from '@/features/admin/context/AdminContext'

export function ModulesTab() {
  const {
    selectedCourse,
    selectedModule,
    isModuleModalOpen,
    setIsModuleModalOpen,
    isModuleEditModalOpen,
    setIsModuleEditModalOpen,
    editingModule,
    setEditingModule,
    handleModuleSelect,
    handleModuleEdit,
    handleModuleDelete,
    handleModuleQuiz,
    moduleHooks,
    isSelectedCourseLoading,
  } = useAdmin()

  if (!selectedCourse) return null

  const drawerOpen = isModuleModalOpen || isModuleEditModalOpen
  const drawerMode = isModuleEditModalOpen ? 'edit' : 'create'
  const closeDrawer = () => {
    setIsModuleModalOpen(false)
    setIsModuleEditModalOpen(false)
    setEditingModule(null)
  }

  const handleCreateModule = async (e) => {
    const newModule = await moduleHooks.handleModuleCreate(e, selectedCourse)
    if (newModule) handleModuleSelect(newModule)
    setIsModuleModalOpen(false)
  }

  const handleEditModule = async (e) => {
    await moduleHooks.handleModuleUpdate(e, editingModule.id, selectedCourse)
    setIsModuleEditModalOpen(false)
    setEditingModule(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Módulos del Curso</h3>
        <Button onClick={() => setIsModuleModalOpen(true)} className="gap-1.5">
          <Plus className="w-4 h-4" />
          Crear Módulo
        </Button>
      </div>

      <ModuleList
        modules={selectedCourse.modules || []}
        selectedModuleId={selectedModule?.id}
        onModuleSelect={handleModuleSelect}
        onModuleEdit={handleModuleEdit}
        onModuleDelete={handleModuleDelete}
        onModuleQuiz={handleModuleQuiz}
        isLoading={isSelectedCourseLoading}
      />

      {/* Create / edit module — slide-over drawer */}
      <Drawer
        open={drawerOpen}
        onClose={closeDrawer}
        title={drawerMode === 'create' ? 'Crear nuevo módulo' : 'Editar módulo'}
        width="max-w-md"
      >
        <ModuleForm
          mode={drawerMode}
          isSubmitting={moduleHooks.isSubmitting}
          moduleForm={moduleHooks.moduleForm}
          setModuleForm={moduleHooks.setModuleForm}
          onSubmit={drawerMode === 'create' ? handleCreateModule : handleEditModule}
        />
      </Drawer>
    </div>
  )
}
