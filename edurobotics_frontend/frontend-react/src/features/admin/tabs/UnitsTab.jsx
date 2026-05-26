import { Plus } from 'lucide-react'
import { Button } from '@/shared/components/button'
import { Modal } from '@/shared/components/Modal'
import { UnitForm } from '@/features/admin/features/units/UnitForm'
import { UnitList } from '@/features/admin/features/units/UnitList'
import { useAdmin } from '@/features/admin/context/AdminContext'

export function UnitsTab() {
  const {
    selectedCourse,
    selectedModule,
    selectedUnit,
    isUnitModalOpen,
    setIsUnitModalOpen,
    isUnitEditModalOpen,
    setIsUnitEditModalOpen,
    editingUnit,
    setEditingUnit,
    handleUnitSelect,
    handleUnitEdit,
    handleUnitDelete,
    handleUnitQuiz,
    unitHooks,
    isSelectedCourseLoading,
  } = useAdmin()

  if (!selectedModule) return null

  const handleCreateUnit = async (e) => {
    const newUnit = await unitHooks.handleUnitCreate(e, selectedModule, selectedCourse)
    if (newUnit) handleUnitSelect(newUnit)
    setIsUnitModalOpen(false)
  }

  const handleEditUnit = async (e) => {
    await unitHooks.handleUnitUpdate(e, editingUnit.id, selectedCourse)
    setIsUnitEditModalOpen(false)
    setEditingUnit(null)
  }

  return (
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
          onSubmit={handleCreateUnit}
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
        isLoading={isSelectedCourseLoading}
      />

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
          onSubmit={handleEditUnit}
          expanded={true}
          onToggle={() => { }}
        />
      </Modal>
    </div>
  )
}
