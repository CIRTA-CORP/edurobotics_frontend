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

import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Eye, FileText } from 'lucide-react'
import { ContentForm } from '@/features/admin/features/content/ContentForm'
import { QuizEditor } from '@/features/admin/features/quizzes/QuizEditor'
import { UnitForm } from '@/features/admin/features/units/UnitForm'
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
    expandedSections, toggleSection, handleContentDelete, contentHooks,
    unitHooks,
  } = useAdmin()

  const [editorTab, setEditorTab] = useState('contenido')
  const navigate = useNavigate()
  const richEditorRef = useRef(null)
  const [lastSavedAt, setLastSavedAt] = useState(null)

  const quizCount = selectedUnit?.quizzes?.length || 0
  const hasModules = (selectedCourse?.modules || []).length > 0

  const tab = (id, label, count) => (
    <button
      key={id}
      onClick={() => setEditorTab(id)}
      className={`inline-flex h-[34px] items-center gap-2 rounded-lg px-4 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4b46d6] ${
        editorTab === id
          ? 'bg-white text-[#16151b] shadow-[0_1px_3px_rgba(22,21,27,0.09)]'
          : 'text-[#8b8a95] hover:text-[#16151b]'
      }`}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span
          className={`rounded-full px-1.5 py-[1px] font-mono text-[9.5px] font-bold tabular-nums ${
            editorTab === id ? 'bg-[#4b46d6]/[0.08] text-[#4b46d6]' : 'bg-[#e7e6ee] text-[#8b8a95]'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  )

  return (
    <>
      <div className="min-h-[calc(100vh-8rem)] overflow-hidden rounded-2xl border border-[#e9e9ee] bg-white">
        <div className="min-w-0">
          {!selectedUnit ? (
            <EmptyEditor hasModules={hasModules} />
          ) : (
            <>
              <div className="border-b border-[#ececf1] px-5 pt-4 sm:px-6">
                {/* Fila de acciones: contexto a la izquierda, acciones a la derecha */}
                <div className="flex items-center justify-between gap-5">
                  <p className="min-w-0 truncate font-mono text-[10.5px] uppercase tracking-[0.1em] text-[#a9a8b4]">
                    {selectedModule?.title}
                  </p>
                  {editorTab === 'contenido' && (
                    <div className="flex flex-shrink-0 items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => navigate(`/courses/${selectedCourse?.id}/study`)}
                        className="inline-flex h-9 items-center gap-2 rounded-[10px] border border-[#e3e2ea] px-3.5 text-[12.5px] font-semibold text-[#55545f] transition-colors hover:border-[#c4c3cd] hover:text-[#16151b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4b46d6]"
                      >
                        <Eye className="h-4 w-4" strokeWidth={1.8} /> Ver como alumno
                      </button>
                      <button
                        type="button"
                        onClick={() => richEditorRef.current?.save()}
                        disabled={contentHooks.saving}
                        className="inline-flex h-9 items-center gap-2 rounded-[10px] bg-[#16151b] px-4 text-[12.5px] font-semibold text-white transition-colors hover:bg-[#2b2b26] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#16151b]"
                      >
                        <Check className="h-4 w-4" strokeWidth={2.4} />
                        {contentHooks.saving ? 'Guardando…' : 'Guardar'}
                      </button>
                    </div>
                  )}
                </div>

                <h2
                  className="mt-3.5 truncate font-bold tracking-[-0.014em] text-[#16151b]"
                  style={{ fontFamily: "'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif", fontSize: 28, lineHeight: 1.16 }}
                >
                  {selectedUnit.title}
                </h2>
                <div className="mb-4 mt-[18px] inline-flex items-center gap-[3px] rounded-[10px] bg-[#f4f3f8] p-[3px]">
                  {tab('contenido', 'Contenido')}
                  {tab('evaluacion', 'Evaluación', quizCount)}
                  {tab('ajustes', 'Ajustes')}
                </div>
              </div>

              <div className="p-5 sm:p-6">
                {editorTab === 'contenido' && (
                  <ContentForm
                    selectedUnit={selectedUnit}
                    editorRef={richEditorRef}
                    hideEditorSave
                    lastSavedAt={lastSavedAt}
                    onRichContentSave={(html) =>
                      contentHooks
                        .handleRichContentSave(html, selectedUnit, selectedCourse)
                        .then(() => setLastSavedAt(new Date()))
                    }
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
    </>
  )
}
