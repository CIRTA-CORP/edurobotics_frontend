import { Plus } from 'lucide-react'
import { Button } from '@/shared/components/button'
import { Modal } from '@/shared/components/Modal'
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
          onSubmit={handleCreateModule}
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
        isLoading={isSelectedCourseLoading}
      />

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
          onSubmit={handleEditModule}
          expanded={true}
          onToggle={() => { }}
        />
      </Modal>
    </div>
  )
}
