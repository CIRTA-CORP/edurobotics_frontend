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

import { useNavigate } from 'react-router-dom'
import { BookOpen, ExternalLink } from 'lucide-react'
import { ModuleSidebar } from './ModuleSidebar'

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
        <div className="flex flex-col h-full">
            {/* Section header — reinforces this column as its own section */}
            <div className="flex items-center gap-2 px-4 pt-4 pb-3">
                <BookOpen className="w-4 h-4 text-gray-400" />
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-[0.12em] font-mono">
                    Material del curso
                </span>
            </div>

            {/* Modules + units (progress now lives in the thin top bar + per-module rules) */}
            <div className="flex-1">
                <ModuleSidebar
                    modules={modules}
                    selectedUnitId={selectedUnitId}
                    onUnitClick={onUnitClick}
                    getModuleProgress={getModuleProgress}
                    getUnitProgress={getUnitProgress}
                    progressData={progressData}
                />
            </div>

            {/* Roadmap: a discreet link, not a full section */}
            <div className="border-t border-gray-200 px-4 py-3 mt-auto">
                <button
                    onClick={() => navigate('/roadmap')}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-blue-600 transition-colors"
                >
                    <ExternalLink className="w-3 h-3" />
                    Ver la malla del curso
                </button>
            </div>
        </div>
    )
}
