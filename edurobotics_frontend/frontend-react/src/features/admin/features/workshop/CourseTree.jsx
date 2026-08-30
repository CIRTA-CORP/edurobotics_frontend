/**
 * CourseTree — the course's modules and units as one tree.
 *
 * Replaces the old chain of four tabs: selecting a node here IS navigating, so
 * there is no separate "Gestionar" step and no lateral tab to enable afterwards.
 * The nodes deliberately borrow the student index's language (numbered node,
 * green when complete) so an admin sees the same structure the student does.
 */

import { useState } from 'react'
import {
  ChevronDown, ClipboardCheck, Cpu, FileDown, FileText, Link2,
  MoreHorizontal, PlayCircle, Plus, Settings, Trash2,
} from 'lucide-react'
import { useAdmin } from '@/features/admin/context/AdminContext'

/** Icon for a unit, picked from the material it holds. */
function unitIcon(unit) {
  const types = new Set((unit.contents || []).map(c => c.content_type))
  if (types.has('simulator')) return Cpu
  if (types.has('video')) return PlayCircle
  if (types.has('file')) return FileDown
  if (types.has('resource')) return Link2
  if (unit.quizzes?.length > 0) return ClipboardCheck
  return FileText
}

/** Row actions that used to live as icons in the old list rows. */
function RowMenu({ onEdit, onDelete, label }) {
  const [open, setOpen] = useState(false)
  return (
    <span className="relative flex-shrink-0">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o) }}
        aria-label={`Acciones de ${label}`}
        className="grid h-6 w-6 place-items-center rounded-md text-[#b3b2be] transition-colors hover:bg-[#efeef3] hover:text-[#16151b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4b46d6]"
      >
        <MoreHorizontal className="h-3.5 w-3.5" />
      </button>
      {open && (
        <>
          <span className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setOpen(false) }} />
          <span className="absolute right-0 top-7 z-20 flex w-40 flex-col rounded-lg border border-[#e9e9ee] bg-white py-1 shadow-lg">
            <button
              onClick={(e) => { e.stopPropagation(); setOpen(false); onEdit() }}
              className="flex items-center gap-2 px-3 py-1.5 text-left text-[13px] text-[#55545f] hover:bg-[#f4f3f8]"
            >
              <Settings className="h-3.5 w-3.5" /> Ajustes
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setOpen(false); onDelete() }}
              className="flex items-center gap-2 px-3 py-1.5 text-left text-[13px] text-[#b4425a] hover:bg-[#b4425a]/[0.07]"
            >
              <Trash2 className="h-3.5 w-3.5" /> Eliminar
            </button>
          </span>
        </>
      )}
    </span>
  )
}

export function CourseTreeNodes() {
  const {
    selectedCourse, selectedModule, selectedUnit,
    handleModuleSelect, handleUnitSelect,
    handleModuleEdit, handleModuleDelete,
    handleUnitEdit, handleUnitDelete,
    setIsModuleModalOpen, setIsUnitModalOpen,
    isSelectedCourseLoading,
  } = useAdmin()

  // Modules the admin folded by hand; the selected one is open by default.
  const [overrides, setOverrides] = useState({})

  if (!selectedCourse) return null

  const modules = selectedCourse.modules || []

  return (
    <div className="ml-3 border-l border-[#ececf1] pl-1.5">
      <nav className="py-1" aria-label="Contenido del curso">
        {isSelectedCourseLoading ? (
          <p className="px-2 py-3 text-[13px] text-[#a9a8b4]">Cargando…</p>
        ) : modules.length === 0 ? (
          <p className="px-2 py-3 text-[13px] text-[#a9a8b4]">Este curso aún no tiene módulos.</p>
        ) : (
          modules.map((module, mi) => {
            const isCurrent = selectedModule?.id === module.id
            const isOpen = overrides[module.id] ?? isCurrent
            const units = module.units || []

            return (
              <div key={module.id} className="mb-1">
                <div
                  className={`flex items-center gap-2 rounded-lg px-2 py-2 transition-colors ${
                    isCurrent && !selectedUnit ? 'bg-[#16151b] text-white' : 'hover:bg-[#f4f3f8]'
                  }`}
                >
                  <button
                    onClick={() => {
                      setOverrides(p => ({ ...p, [module.id]: !isOpen }))
                      handleModuleSelect(module)
                    }}
                    aria-expanded={isOpen}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4b46d6] rounded"
                  >
                    <span
                      className={`grid h-[22px] w-[22px] flex-shrink-0 place-items-center rounded-full font-mono text-[11px] font-bold ${
                        isCurrent && !selectedUnit ? 'bg-white/20 text-white' : 'bg-[#eceaf2] text-[#8b8a95]'
                      }`}
                    >
                      {mi + 1}
                    </span>
                    <span className={`min-w-0 flex-1 truncate text-[13.5px] font-semibold ${
                      isCurrent && !selectedUnit ? 'text-white' : 'text-[#16151b]'
                    }`}>
                      {module.title}
                    </span>
                    <span className={`font-mono text-[10.5px] tabular-nums ${
                      isCurrent && !selectedUnit ? 'text-white/60' : 'text-[#a9a8b4]'
                    }`}>
                      {units.length}
                    </span>
                    <ChevronDown
                      className={`h-3.5 w-3.5 flex-shrink-0 transition-transform ${isOpen ? '' : '-rotate-90'} ${
                        isCurrent && !selectedUnit ? 'text-white/60' : 'text-[#c4c3cd]'
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                  <RowMenu
                    label={module.title}
                    onEdit={() => handleModuleEdit(module)}
                    onDelete={() => handleModuleDelete(module.id)}
                  />
                </div>

                {isOpen && (
                  <ul className="ml-[11px] mt-0.5 border-l border-[#ececf1] pl-2.5">
                    {units.map((unit) => {
                      const Icon = unitIcon(unit)
                      const isSel = selectedUnit?.id === unit.id
                      return (
                        <li key={unit.id}>
                          <div
                            className={`flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors ${
                              isSel ? 'bg-[#4b46d6]/[0.07]' : 'hover:bg-[#f4f3f8]'
                            }`}
                          >
                            <button
                              onClick={() => handleUnitSelect(unit)}
                              aria-current={isSel ? 'true' : undefined}
                              className="flex min-w-0 flex-1 items-center gap-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4b46d6] rounded"
                            >
                              <Icon
                                className={`h-3.5 w-3.5 flex-shrink-0 ${isSel ? 'text-[#4b46d6]' : 'text-[#b3b2be]'}`}
                                strokeWidth={1.7}
                              />
                              <span className={`min-w-0 flex-1 truncate text-[13px] ${
                                isSel ? 'font-medium text-[#4b46d6]' : 'text-[#55545f]'
                              }`}>
                                {unit.title}
                              </span>
                            </button>
                            <RowMenu
                              label={unit.title}
                              onEdit={() => handleUnitEdit(unit)}
                              onDelete={() => handleUnitDelete(unit.id)}
                            />
                          </div>
                        </li>
                      )
                    })}

                    <li>
                      <button
                        onClick={() => { handleModuleSelect(module); setIsUnitModalOpen(true) }}
                        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] text-[#8b8a95] transition-colors hover:bg-[#f4f3f8] hover:text-[#16151b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4b46d6]"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Crear unidad
                      </button>
                    </li>
                  </ul>
                )}
              </div>
            )
          })
        )}
      </nav>

      <button
        onClick={() => setIsModuleModalOpen(true)}
        className="mb-1 ml-2 flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] text-[#8b8a95] transition-colors hover:bg-[#f4f3f8] hover:text-[#16151b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4b46d6]"
      >
        <Plus className="h-3.5 w-3.5" />
        Crear módulo
      </button>
    </div>
  )
}
