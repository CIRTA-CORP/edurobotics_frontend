/**
 * Roadmap Page
 *
 * Full-page visual roadmap showing all courses as a dependency graph.
 * Each course node shows its state (completed, in progress, unlocked, locked)
 * based on the student's progress and prerequisite completion.
 *
 * Route: /roadmap
 */

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getStoredUser } from '@/features/auth/services/auth'
import { getCoursesRoadmap } from '@/features/courses/services/courses'
import { getRoadmap } from '@/features/progress/services/progress'
import { ArrowLeft, Map, Loader2, Shield } from 'lucide-react'
import RoadmapGraph from '@/features/roadmap/pages/RoadmapGraph'

function RoadmapPage() {
    const navigate = useNavigate()
    const [user, setUser] = useState(() => getStoredUser())

    // Load user
    useEffect(() => {
        if (!user) { navigate('/login'); return }
    }, [navigate, user])

    const { data: coursesResp, isLoading: coursesLoading, error: coursesError } = useQuery({
        queryKey: ['courses-roadmap'],
        queryFn: getCoursesRoadmap,
        enabled: !!user,
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
                <button onClick={() => navigate('/dashboard')} className="text-blue-600 hover:underline text-sm">
                    ← Volver al dashboard
                </button>
            </div>
        </div>
    )

    return (
        <div className="min-h-screen bg-gray-50">
            {/* ── Header ── */}
            <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 px-6 py-2.5 flex items-center justify-between sticky top-0 z-40">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="hidden sm:inline">Volver</span>
                    </button>

                    <div className="h-5 w-px bg-gray-200" />

                    <div className="flex items-center gap-2">
                        <Map className="w-4 h-4 text-blue-500" />
                        <h1 className="text-sm font-semibold text-gray-900">Hoja de Ruta</h1>
                    </div>
                </div>

                {user && (
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">
                            {(user.first_name?.[0] || '') + (user.last_name?.[0] || '')}
                        </div>
                        {user.role === 'admin' && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-white">
                                <Shield className="w-2 h-2" />
                                ADMIN
                            </span>
                        )}
                    </div>
                )}
            </header>

            {/* ── Hero banner ── */}
            <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white px-6 py-8">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-2xl md:text-3xl font-bold mb-2">Malla de Cursos</h2>
                    <p className="text-white/60 text-sm max-w-xl">
                        Visualiza tu progreso y las dependencias entre cursos.
                        Los cursos bloqueados requieren completar prerequisitos primero.
                    </p>
                </div>
            </div>

            {/* ── Graph ── */}
            <div className="max-w-5xl mx-auto px-6 py-6">
                <RoadmapGraph courses={courses} roadmapData={roadmapData} />
            </div>

            {/* ── Legend ── */}
            <div className="max-w-5xl mx-auto px-6 pb-10">
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Leyenda</h3>
                    <div className="flex flex-wrap gap-4 text-xs">
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-emerald-200" />
                            <span className="text-gray-600">Completado</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-blue-400 ring-2 ring-blue-200" />
                            <span className="text-gray-600">En progreso</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-gray-300 ring-1 ring-gray-200" />
                            <span className="text-gray-600">Desbloqueado</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-gray-200 ring-1 ring-gray-100" />
                            <span className="text-gray-600">Bloqueado</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <svg width="24" height="12">
                                <line x1="0" y1="6" x2="24" y2="6" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 2" />
                            </svg>
                            <span className="text-gray-600">Dependencia</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default RoadmapPage
