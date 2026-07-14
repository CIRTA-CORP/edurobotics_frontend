/**
 * Roadmap Page
 *
 * Full-page visual roadmap showing all courses as a dependency graph.
 * Each course node shows its state (completed, in progress, unlocked, locked)
 * based on the student's progress and prerequisite completion.
 *
 * Route: /roadmap
 */

import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { clearStoredUser, getStoredUser } from '@/features/auth/services/auth'
import { getCoursesRoadmap } from '@/features/courses/services/courses'
import { getRoadmap } from '@/features/progress/services/progress'
import { getSpecializations } from '@/features/specializations/services/specializations'
import { buildCourseSpecMap, specColor } from '@/features/specializations/specStyle'
import {
    Map, Loader2, Layers,
    CheckCircle, Clock, Unlock, Lock,
} from 'lucide-react'
import RoadmapGraph from '@/features/roadmap/pages/RoadmapGraph'
import { StudentHeader } from '@/features/student/components/StudentHeader'
import { PublicNav } from '@/shared/components/PublicNav'
import { LogoutModal } from '@/shared/components/LogoutModal'
import { HeroBand } from '@/shared/components/HeroBand'

function RoadmapPage() {
    const navigate = useNavigate()
    const [user] = useState(() => getStoredUser())
    const [showLogout, setShowLogout] = useState(false)
    // null = "Todas" (full malla). Otherwise the id of the specialization whose
    // sub-malla is highlighted.
    const [selectedSpecId, setSelectedSpecId] = useState(null)

    // Public access: visitors without an account can view the roadmap (without
    // personal progress). Logged-in users also see their progress overlaid.

    const { data: coursesResp, isLoading: coursesLoading, error: coursesError } = useQuery({
        queryKey: ['courses-roadmap'],
        queryFn: getCoursesRoadmap,
        staleTime: 60_000,
    })

    // Specializations are public; shared cache key with the dashboard section.
    const { data: specializations = [] } = useQuery({
        queryKey: ['specializations-public'],
        queryFn: getSpecializations,
        staleTime: 60_000,
    })

    const { data: roadmapResp } = useQuery({
        queryKey: ['roadmap-full', user?.id],
        queryFn: () => getRoadmap(user.id),
        enabled: !!user?.id,
        staleTime: 20_000,
    })

    const courses = coursesResp?.courses || []
    const roadmapData = {}
    if (roadmapResp?.roadmap && Array.isArray(roadmapResp.roadmap)) {
        roadmapResp.roadmap.forEach(c => { roadmapData[c.id] = c })
    }
    const loading = coursesLoading
    const error = coursesError?.message || null

    // Map courseId → specialization colour/name, so every node is colour-coded
    // by its specialization (not only when a filter chip is selected).
    const specMap = useMemo(() => buildCourseSpecMap(specializations), [specializations])

    // Set of course ids belonging to the selected specialization (its sub-malla).
    const highlightIds = useMemo(() => {
        if (!selectedSpecId) return null
        const spec = specializations.find(s => s.id === selectedSpecId)
        if (!spec) return null
        return new Set((spec.courses || []).map(c => c.id))
    }, [selectedSpecId, specializations])

    // ── Loading ──────────────────────────────────────────────────────────────
    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <span className="text-sm text-gray-500">Cargando hoja de ruta...</span>
            </div>
        </div>
    )

    if (error) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
                    <Map className="w-6 h-6 text-red-500" />
                </div>
                <p className="text-sm text-red-600 mb-4">{error}</p>
                <button onClick={() => navigate(user ? '/dashboard' : '/')} className="text-blue-600 hover:underline text-sm">
                    {user ? '← Volver al dashboard' : '← Volver al inicio'}
                </button>
            </div>
        </div>
    )

    return (
        <div className="min-h-screen bg-gray-50">
            <LogoutModal
                isOpen={showLogout}
                onConfirm={() => { clearStoredUser(); navigate('/') }}
                onCancel={() => setShowLogout(false)}
            />
            {/* Logged-in: app shell. Public visitor: sign-in bar. */}
            {user
                ? <StudentHeader user={user} onLogout={() => setShowLogout(true)} />
                : <PublicNav />}

            {/* ── Hero banner ── */}
            <HeroBand>
                <div className="max-w-5xl mx-auto px-6 py-12">
                    <h2 className="text-2xl md:text-3xl font-bold mb-2">Malla de Cursos</h2>
                    <p className="text-slate-300 text-sm max-w-xl">
                        Visualiza tu progreso y las dependencias entre cursos.
                        Los cursos bloqueados requieren completar prerequisitos primero.
                    </p>
                </div>
            </HeroBand>

            {/* ── Specialization filter chips ── */}
            {specializations.length > 0 && (
                <div className="max-w-5xl mx-auto px-6 pt-6">
                    <div className="flex items-center gap-2 mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                        <Layers className="w-3.5 h-3.5" />
                        Filtrar por especialización
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setSelectedSpecId(null)}
                            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                                selectedSpecId === null
                                    ? 'bg-slate-900 text-white'
                                    : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            Todas
                        </button>
                        {specializations.map((spec, i) => (
                            <button
                                key={spec.id}
                                onClick={() => setSelectedSpecId(spec.id)}
                                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                                    selectedSpecId === spec.id
                                        ? 'bg-slate-900 text-white'
                                        : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <span className={`h-2 w-2 shrink-0 rounded-full ${specColor(i).bar}`} />
                                {spec.title}
                                <span className={`text-[11px] ${selectedSpecId === spec.id ? 'text-slate-300' : 'text-gray-400'}`}>
                                    {spec.course_count ?? spec.courses?.length ?? 0}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Graph ── */}
            <div className="max-w-5xl mx-auto px-6 py-6">
                <RoadmapGraph courses={courses} roadmapData={roadmapData} highlightIds={highlightIds} specMap={specMap} />
            </div>

            {/* ── Legend ── */}
            <div className="max-w-5xl mx-auto px-6 pb-10">
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> Completado</span>
                    <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-blue-500" /> En progreso</span>
                    <span className="flex items-center gap-1.5"><Unlock className="h-3.5 w-3.5 text-gray-400" /> Disponible</span>
                    <span className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5 text-gray-300" /> Bloqueado</span>
                    <span className="flex items-center gap-1.5">
                        <svg width="22" height="10"><line x1="0" y1="5" x2="22" y2="5" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 2" /></svg>
                        Prerequisito
                    </span>
                </div>
            </div>
        </div>
    )
}

export default RoadmapPage
