/**
 * CourseSidebar Component
 *
 * Coursera-style sidebar with collapsible top-level sections:
 * - Material del Curso (modules + units)
 * - Progreso (progress bar + state)
 * - Hoja de Ruta (placeholder for future roadmap)
 *
 * Redesigned with modern icons and better visual hierarchy.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronRight, BookOpen, TrendingUp, Map, ExternalLink } from 'lucide-react'
import { ModuleSidebar } from './ModuleSidebar'
import CourseRoadmap from './CourseRoadmap'

// Generic collapsible section wrapper
function SidebarSection({ id, title, icon: Icon, defaultOpen = false, children }) {
    const [open, setOpen] = useState(defaultOpen)

    return (
        <div className="border-b border-gray-100 last:border-b-0">
            <button
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50/80 transition-colors group"
                onClick={() => setOpen(o => !o)}
            >
                <div className="flex items-center gap-2">
                    {Icon && <Icon className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />}
                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{title}</span>
                </div>
                {open
                    ? <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    : <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
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
    const navigate = useNavigate()

    return (
        <div>
            {/* Section 1: Modules */}
            <SidebarSection id="modules" title="Material del Curso" icon={BookOpen} defaultOpen={true}>
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
            <SidebarSection id="progress" title="Progreso" icon={TrendingUp} defaultOpen={true}>
                <div className="px-4 py-2">
                    <CourseRoadmap
                        userId={userId}
                        courseId={courseId}
                        onNavigateUnit={onNavigateUnit}
                    />
                </div>
            </SidebarSection>

            {/* Section 3: Hoja de Ruta */}
            <SidebarSection id="roadmap" title="Hoja de Ruta" icon={Map} defaultOpen={false}>
                <div className="px-4 py-4 text-center">
                    <Map className="w-8 h-8 text-blue-200 mx-auto mb-2" />
                    <p className="text-xs text-gray-500 mb-3">
                        Visualiza la malla de cursos y sus dependencias.
                    </p>
                    <button
                        onClick={() => navigate('/roadmap')}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                    >
                        <ExternalLink className="w-3 h-3" />
                        Ver malla de cursos
                    </button>
                </div>
            </SidebarSection>
        </div>
    )
}
