/**
 * WorkshopDrawers — los drawers de crear/editar módulo y unidad, montados en el
 * armazón del panel (no dentro de la pestaña del taller).
 *
 * Así "Crear módulo" y "Crear unidad" funcionan desde cualquier pantalla del
 * contexto Cursos: el árbol de la columna los abre y el drawer aparece aunque la
 * pestaña activa sea el detalle del curso (antes los drawers vivían dentro del
 * WorkshopTab y, con el detalle abierto, el modal quedaba invisible).
 */
import { Drawer } from '@/shared/components/Drawer'
import { ModuleForm } from '@/features/admin/features/modules/ModuleForm'
import { UnitForm } from '@/features/admin/features/units/UnitForm'
import { useAdmin } from '@/features/admin/context/AdminContext'

export function WorkshopDrawers() {
  const {
    selectedCourse, selectedModule,
    isModuleModalOpen, setIsModuleModalOpen,
    isModuleEditModalOpen, setIsModuleEditModalOpen,
    editingModule, setEditingModule,
    isUnitModalOpen, setIsUnitModalOpen,
    isUnitEditModalOpen, setIsUnitEditModalOpen,
    editingUnit, setEditingUnit,
    moduleHooks, unitHooks,
    handleModuleSelect, handleUnitSelect,
  } = useAdmin()

  // ── Módulo: crear / editar (mismos hooks que la pestaña antigua) ──
  const moduleDrawerOpen = isModuleModalOpen || isModuleEditModalOpen
  const moduleMode = isModuleEditModalOpen ? 'edit' : 'create'
  const closeModuleDrawer = () => {
    setIsModuleModalOpen(false)
    setIsModuleEditModalOpen(false)
    setEditingModule(null)
  }
  const submitModule = async (e) => {
    if (moduleMode === 'create') {
      const created = await moduleHooks.handleModuleCreate(e, selectedCourse)
      if (created) {
        handleModuleSelect(created)
        closeModuleDrawer()
      }
    } else {
      await moduleHooks.handleModuleUpdate(e, editingModule.id, selectedCourse)
      closeModuleDrawer()
    }
  }

  // ── Unidad: crear / editar ──
  const unitDrawerOpen = isUnitModalOpen || isUnitEditModalOpen
  const unitMode = isUnitEditModalOpen ? 'edit' : 'create'
  const closeUnitDrawer = () => {
    setIsUnitModalOpen(false)
    setIsUnitEditModalOpen(false)
    setEditingUnit(null)
  }
  const submitUnit = async (e) => {
    if (unitMode === 'create') {
      const created = await unitHooks.handleUnitCreate(e, selectedModule, selectedCourse)
      if (created) {
        handleUnitSelect(created)
        closeUnitDrawer()
      }
    } else {
      await unitHooks.handleUnitUpdate(e, editingUnit.id, selectedCourse)
      closeUnitDrawer()
    }
  }

  return (
    <>
      <Drawer
        open={moduleDrawerOpen}
        onClose={closeModuleDrawer}
        title={moduleMode === 'create' ? 'Crear nuevo módulo' : 'Editar módulo'}
        width="max-w-md"
      >
        <ModuleForm
          mode={moduleMode}
          isSubmitting={moduleHooks.isSubmitting}
          moduleForm={moduleHooks.moduleForm}
          setModuleForm={moduleHooks.setModuleForm}
          onSubmit={submitModule}
        />
      </Drawer>

      <Drawer
        open={unitDrawerOpen}
        onClose={closeUnitDrawer}
        title={unitMode === 'create' ? 'Crear nueva unidad' : 'Editar unidad'}
        width="max-w-md"
      >
        <UnitForm
          mode={unitMode}
          isSubmitting={unitHooks.isSubmitting}
          unitForm={unitHooks.unitForm}
          setUnitForm={unitHooks.setUnitForm}
          onSubmit={submitUnit}
        />
      </Drawer>
    </>
  )
}
