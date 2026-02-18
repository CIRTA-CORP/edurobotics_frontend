/**
 * CourseSidebar Component
 *
 * Coursera-style sidebar with collapsible top-level sections:
 * - Material del Curso (modules + units)
 * - Progreso (progress bar + state)
 * - Hoja de Ruta (placeholder for future roadmap)
 *
 * Each section can be expanded/collapsed independently.
 * New sections can be added easily in the future.
 */

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { ModuleSidebar } from './ModuleSidebar'
import CourseRoadmap from './CourseRoadmap'

// Generic collapsible section wrapper
function SidebarSection({ id, title, defaultOpen = false, children }) {
    const [open, setOpen] = useState(defaultOpen)

    return (
        <div className="border-b border-gray-200 last:border-b-0">
            <button
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                onClick={() => setOpen(o => !o)}
            >
                <span className="text-sm font-semibold text-gray-700">{title}</span>
                {open
                    ? <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    : <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                }
            </button>
            {open && (
                <div className="pb-2">
                    {children}
                </div>
            )}
        </div>
    )
}

export function CourseSidebar({
    modules,
    selectedUnitId,
    onUnitClick,
    getModuleProgress,
    getUnitProgress,
    progressData,
    userId,
    courseId,
    onNavigateUnit,
}) {
    return (
        <div className="divide-y divide-gray-200">
            {/* Section 1: Modules */}
            <SidebarSection id="modules" title="Material del Curso" defaultOpen={true}>
                <ModuleSidebar
                    modules={modules}
                    selectedUnitId={selectedUnitId}
                    onUnitClick={onUnitClick}
                    getModuleProgress={getModuleProgress}
                    getUnitProgress={getUnitProgress}
                    progressData={progressData}
                />
            </SidebarSection>

            {/* Section 2: Progress */}
            <SidebarSection id="progress" title="Progreso" defaultOpen={true}>
                <div className="px-4 py-2">
                    <CourseRoadmap
                        userId={userId}
                        courseId={courseId}
                        onNavigateUnit={onNavigateUnit}
                    />
                </div>
            </SidebarSection>

            {/* Section 3: Hoja de Ruta (placeholder — Fase 2) */}
            <SidebarSection id="roadmap" title="Hoja de Ruta" defaultOpen={false}>
                <div className="px-4 py-4 text-center">
                    <p className="text-xs text-gray-400">
                        Próximamente: visualización de la malla de cursos y rutas de especialización.
                    </p>
                </div>
            </SidebarSection>
        </div>
    )
}
