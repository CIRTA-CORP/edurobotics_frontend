/**
 * CourseSidebar — the course material column (viewer redesign).
 *
 * A single, quiet section: "Material del curso" with modules → units. Progress now
 * lives in the thin top bar + per-module rules, so there are no "Progreso" or
 * "Hoja de ruta" sub-sections. The header carries a collapse toggle (focus mode).
 */
import { PanelLeftClose } from 'lucide-react'
import { ModuleSidebar } from './ModuleSidebar'

export function CourseSidebar({
    modules,
    selectedUnitId,
    onUnitClick,
    getModuleProgress,
    getUnitProgress,
    progressData,
    onHide,
}) {
    return (
        <div className="flex flex-col h-full">
            {/* Section header + collapse (focus) toggle */}
            <div className="flex items-center justify-between px-4 pt-4 pb-3">
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-[0.14em] font-mono">
                    Material del curso
                </span>
                {onHide && (
                    <button
                        onClick={onHide}
                        title="Ocultar índice (modo foco)"
                        aria-label="Ocultar índice"
                        className="text-gray-400 hover:text-gray-800 transition-colors p-1 -mr-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    >
                        <PanelLeftClose className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Modules + units */}
            <div className="flex-1 pb-4">
                <ModuleSidebar
                    modules={modules}
                    selectedUnitId={selectedUnitId}
                    onUnitClick={onUnitClick}
                    getModuleProgress={getModuleProgress}
                    getUnitProgress={getUnitProgress}
                    progressData={progressData}
                />
            </div>
        </div>
    )
}
