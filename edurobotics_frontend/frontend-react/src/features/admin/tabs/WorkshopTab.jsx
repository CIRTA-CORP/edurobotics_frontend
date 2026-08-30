/**
 * WorkshopTab — el taller del curso: árbol a la izquierda, editor a la derecha.
 *
 * Reemplaza la cadena de cuatro pestañas (Módulos → Unidades → Contenido →
 * Evaluaciones). El árbol dice dónde estás, así que el editor solo lleva una
 * línea de contexto en vez de una barra de migas aparte.
 *
 * Las piezas de dentro —editor TipTap, editor de evaluaciones, formularios— se
 * reutilizan tal cual: cambian de contenedor, no de lógica.
 */

import { useState } from 'react'
import { ClipboardCheck, FileText, Settings } from 'lucide-react'
import { Drawer } from '@/shared/components/Drawer'
import { ContentForm } from '@/features/admin/features/content/ContentForm'
import { QuizEditor } from '@/features/admin/features/quizzes/QuizEditor'
import { ModuleForm } from '@/features/admin/features/modules/ModuleForm'
import { UnitForm } from '@/features/admin/features/units/UnitForm'
import { CourseTree } from '@/features/admin/features/workshop/CourseTree'
import { useAdmin } from '@/features/admin/context/AdminContext'

function EmptyEditor({ hasModules }) {
  return (
    <div className="grid h-full place-items-center p-10 text-center">
      <div>
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#f4f3f8]">
          <FileText className="h-6 w-6 text-[#c4c3cd]" />
        </div>
        <p className="mt-3 text-[14px] font-medium text-[#55545f]">
          {hasModules ? 'Elige una unidad en el árbol' : 'Empieza creando un módulo'}
        </p>
        <p className="mt-1 text-[13px] text-[#a9a8b4]">
          {hasModules
            ? 'Su contenido y su evaluación se editan aquí.'
            : 'Los módulos agrupan las unidades del curso.'}
        </p>
      </div>
    </div>
  )
}

export function WorkshopTab() {
  const {
    selectedCourse, selectedModule, selectedUnit,
    setActiveTab,
    expandedSections, toggleSection, handleContentDelete, contentHooks,
    isModuleModalOpen, setIsModuleModalOpen,
    isModuleEditModalOpen, setIsModuleEditModalOpen,
    editingModule, setEditingModule, moduleHooks, handleModuleSelect,
    isUnitModalOpen, setIsUnitModalOpen,
    isUnitEditModalOpen, setIsUnitEditModalOpen,
    editingUnit, setEditingUnit, unitHooks, handleUnitSelect,
  } = useAdmin()

  const [editorTab, setEditorTab] = useState('contenido')

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
      if (created) handleModuleSelect(created)
    } else {
      await moduleHooks.handleModuleUpdate(e, editingModule.id, selectedCourse)
    }
    closeModuleDrawer()
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
      if (created) handleUnitSelect(created)
    } else {
      await unitHooks.handleUnitUpdate(e, editingUnit.id, selectedCourse)
    }
    closeUnitDrawer()
  }

  const quizCount = selectedUnit?.quizzes?.length || 0
  const hasModules = (selectedCourse?.modules || []).length > 0

  const tab = (id, label, Icon, count) => (
    <button
      key={id}
      onClick={() => setEditorTab(id)}
      className={`inline-flex items-center gap-2 border-b-2 px-1 pb-2.5 text-[13.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4b46d6] ${
        editorTab === id
          ? 'border-[#16151b] text-[#16151b]'
          : 'border-transparent text-[#8b8a95] hover:text-[#16151b]'
      }`}
    >
      <Icon className="h-4 w-4" strokeWidth={1.7} />
      {label}
      {count > 0 && (
        <span className="rounded-full bg-[#efeef3] px-1.5 font-mono text-[10px] tabular-nums text-[#8b8a95]">
          {count}
        </span>
      )}
    </button>
  )

  return (
    <>
      <div className="flex min-h-[calc(100vh-8rem)] overflow-hidden rounded-2xl border border-[#e9e9ee] bg-white">
        {/* ── Árbol ── */}
        <div className="hidden w-[290px] flex-shrink-0 border-r border-[#ececf1] bg-[#fcfcfd] lg:block">
          <CourseTree onOpenDetail={() => setActiveTab('cursos')} />
        </div>

        {/* ── Editor ── */}
        <div className="min-w-0 flex-1">
          {!selectedUnit ? (
            <EmptyEditor hasModules={hasModules} />
          ) : (
            <>
              <div className="border-b border-[#ececf1] px-5 pt-4 sm:px-6">
                {/* Línea de contexto: el árbol ya dice dónde estás */}
                <p className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-[#a9a8b4]">
                  {selectedModule?.title}
                </p>
                <h2 className="mt-1 truncate text-[19px] font-bold tracking-[-0.01em] text-[#16151b]">
                  {selectedUnit.title}
                </h2>
                <div className="mt-3 flex items-center gap-5">
                  {tab('contenido', 'Contenido', FileText)}
                  {tab('evaluacion', 'Evaluación', ClipboardCheck, quizCount)}
                  {tab('ajustes', 'Ajustes', Settings)}
                </div>
              </div>

              <div className="p-5 sm:p-6">
                {editorTab === 'contenido' && (
                  <ContentForm
                    selectedUnit={selectedUnit}
                    onRichContentSave={(html) => contentHooks.handleRichContentSave(html, selectedUnit, selectedCourse)}
                    onContentDelete={handleContentDelete}
                    onMigrateLegacy={() => contentHooks.handleMigrateLegacy(selectedUnit, selectedCourse)}
                    onSimulatorToggle={() => contentHooks.handleSimulatorToggle(selectedUnit, selectedCourse)}
                    onSimulatorDescriptionSave={(desc) => contentHooks.handleSimulatorDescriptionSave(desc, selectedUnit, selectedCourse)}
                    saving={contentHooks.saving}
                    expanded={expandedSections.contenido}
                    onToggle={() => toggleSection('contenido')}
                  />
                )}

                {editorTab === 'evaluacion' && <QuizEditor unitId={selectedUnit.id} />}

                {editorTab === 'ajustes' && (
                  <div className="max-w-xl">
                    <p className="mb-4 text-[13px] text-[#8b8a95]">
                      Título, descripción y orden de esta unidad dentro del módulo.
                    </p>
                    <UnitForm
                      mode="edit"
                      isSubmitting={unitHooks.isSubmitting}
                      unitForm={unitHooks.unitForm}
                      setUnitForm={unitHooks.setUnitForm}
                      onSubmit={(e) => unitHooks.handleUnitUpdate(e, selectedUnit.id, selectedCourse)}
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Los formularios de módulo y unidad siguen siendo los mismos */}
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
