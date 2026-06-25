import { Plus } from 'lucide-react'
import { Button } from '@/shared/components/button'
import { Drawer } from '@/shared/components/Drawer'
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

  const drawerOpen = isUnitModalOpen || isUnitEditModalOpen
  const drawerMode = isUnitEditModalOpen ? 'edit' : 'create'
  const closeDrawer = () => {
    setIsUnitModalOpen(false)
    setIsUnitEditModalOpen(false)
    setEditingUnit(null)
  }

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

      <UnitList
        units={selectedModule.units || []}
        selectedUnitId={selectedUnit?.id}
        onUnitSelect={handleUnitSelect}
        onUnitEdit={handleUnitEdit}
        onUnitDelete={handleUnitDelete}
        onUnitQuiz={handleUnitQuiz}
        isLoading={isSelectedCourseLoading}
      />

      {/* Create / edit unit — slide-over drawer */}
      <Drawer
        open={drawerOpen}
        onClose={closeDrawer}
        title={drawerMode === 'create' ? 'Crear nueva unidad' : 'Editar unidad'}
        width="max-w-md"
      >
        <UnitForm
          mode={drawerMode}
          isSubmitting={unitHooks.isSubmitting}
          unitForm={unitHooks.unitForm}
          setUnitForm={unitHooks.setUnitForm}
          onSubmit={drawerMode === 'create' ? handleCreateUnit : handleEditUnit}
        />
      </Drawer>
    </div>
  )
}
