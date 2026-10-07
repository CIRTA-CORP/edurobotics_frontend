/**
 * Course Preview Page
 *
 * Landing page shown before entering study mode.
 * Displays course info: title, description, level, version,
 * module list with unit counts, and a CTA button to start/continue.
 *
 * Prerequisite validation:
 * - If the course has prerequisites and the user hasn't completed them,
 *   the CTA is locked and a panel shows the status of each prerequisite.
 * - Admins bypass prerequisite checks and can always enter any course.
 *
 * Flow: Dashboard → CoursePreviewPage → CoursePage (study mode)
 * Redesigned with modern hero section, glassmorphism, and visual hierarchy.
 */

import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { clearStoredUser, getStoredUser } from '@/features/auth/services/auth'
import { getCourseDetail, checkPrerequisites, getCoursesRoadmap } from '@/features/courses/services/courses'
import { getRoadmap } from '@/features/progress/services/progress'
import { StudentHeader } from '@/features/student/components/StudentHeader'
import { PublicNav } from '@/shared/components/PublicNav'
import { LogoutModal } from '@/shared/components/LogoutModal'
import { HeroBand } from '@/shared/components/HeroBand'
import {
    ArrowLeft, BookOpen, ChevronRight,
    PlayCircle, Loader2, CheckCircle,
    Lock, AlertTriangle, XCircle,
    Layers, Package, Shield, Map, ExternalLink,
    ClipboardCheck
} from 'lucide-react'
import { COURSE_LEVELS } from '@/shared/lib/courseLevel'
import { ModuleSidebar } from '@/features/courses/components/ModuleSidebar'

// ── Level config — label/icon from the shared source ──────────────────────────
const LEVEL_CONFIG = {
    beginner: { ...COURSE_LEVELS.beginner, color: 'bg-emerald-100 text-emerald-700' },
    intermediate: { ...COURSE_LEVELS.intermediate, color: 'bg-amber-100 text-amber-700' },
    advanced: { ...COURSE_LEVELS.advanced, color: 'bg-rose-100 text-rose-700' },
}

const STATE_LABELS = { completed: 'Completado', in_progress: 'En progreso', not_started: 'No iniciado' }
const STATE_COLORS = {
    completed: 'text-emerald-700',
    in_progress: 'text-[#16151b]',
    not_started: 'text-gray-500',
}

// ── Prerequisite panel ────────────────────────────────────────────────────────
function PrerequisitePanel({ details, onCourseClick }) {
    return (
        <div className="mb-6 max-w-sm rounded-xl border border-amber-200 bg-amber-50/80 p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span className="text-sm font-semibold text-amber-800">Prerequisitos requeridos</span>
            </div>
            <div className="space-y-1.5">
                {details.map(p => {
                    const done = p.state === 'completed'
                    return (
                        <button
                            key={p.prereq_id}
                            onClick={() => onCourseClick(p.prereq_id)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all text-left"
                        >
                            {done
                                ? <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                : <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                            }
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-800 truncate">{p.title || `Curso CR-${p.prereq_id}`}</div>
                                <div className={`text-xs ${STATE_COLORS[p.state] || 'text-gray-400'}`}>
                                    {STATE_LABELS[p.state] || p.state}
                                    {p.percentage > 0 && ` · ${p.percentage}%`}
                                </div>
                            </div>
                            {!done && (
                                <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            )}
                        </button>
                    )
                })}
            </div>
            <p className="text-xs text-amber-700 mt-3">
                Completa los cursos anteriores para desbloquear este.
            </p>
        </div>
    )
}

// ── Mini Roadmap (contextual position in the course graph) ────────────────────
// Estado de un curso en la malla según el progreso del alumno
function getCourseState(course, roadmapData) {
    const progress = roadmapData?.[course.id]
    if (progress?.state === 'completed') return 'completed'
    if (progress?.state === 'in_progress') return 'in_progress'
    if (!course.prerequisites || course.prerequisites.length === 0) return 'unlocked'
    const allMet = course.prerequisites.every(pid => roadmapData?.[pid]?.state === 'completed')
    return allMet ? 'unlocked' : 'locked'
}

const MINI_NODE_STYLES = {
    completed: { ring: 'ring-emerald-400', bg: 'bg-white', text: 'text-gray-800', icon: CheckCircle, iconColor: 'text-emerald-500' },
    in_progress: { ring: 'ring-[#16151b]/30', bg: 'bg-white', text: 'text-gray-800', icon: Loader2, iconColor: 'text-[#16151b]' },
    unlocked: { ring: 'ring-gray-200', bg: 'bg-white', text: 'text-gray-700', icon: null, iconColor: '' },
    locked: { ring: 'ring-gray-200', bg: 'bg-gray-50', text: 'text-gray-400', icon: Lock, iconColor: 'text-gray-300' },
}

// Nodo de la mini malla. Vive fuera de MiniRoadmap para no recrear el componente en cada render.
function MiniNode({ course, isCurrent = false, roadmapData, navigate }) {
    const state = getCourseState(course, roadmapData)
    const style = MINI_NODE_STYLES[state] || MINI_NODE_STYLES.unlocked
    const isClickable = !isCurrent && state !== 'locked'
    const levelConf = LEVEL_CONFIG[course.level] || LEVEL_CONFIG.beginner
    const LevelIcon = levelConf.icon
    const StateIcon = style.icon
    // Solo los nodos a los que se puede ir son botones; el actual y los bloqueados
    // son tarjetas sin interacción, para que no sumen paradas vacías al tabular.
    const Node = isClickable ? 'button' : 'div'
    const nodeProps = isClickable
        ? { type: 'button', onClick: () => navigate(`/courses/${course.id}`) }
        : {}

    return (
        <Node
            {...nodeProps}
            className={`
                relative rounded-xl p-3 ring-2 transition-all text-left
                ${style.ring} ${style.bg}
                ${isCurrent ? 'ring-[#16151b] shadow-md scale-105' : ''}
                ${isClickable ? 'cursor-pointer hover:shadow-lg hover:-translate-y-0.5' : !isCurrent ? 'cursor-not-allowed opacity-60' : ''}
                ${isCurrent ? 'w-56' : 'w-44'}
            `}
        >
            {isCurrent && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#16151b] text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Curso actual
                </div>
            )}
            <div className="flex items-center justify-between mb-1 mt-1">
                <span className={`inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${levelConf.color}`}>
                    <LevelIcon className="w-2.5 h-2.5" />
                    {levelConf.label}
                </span>
                {StateIcon && <StateIcon className={`w-3.5 h-3.5 ${style.iconColor}`} />}
            </div>
            <h4 className={`text-xs font-semibold leading-snug truncate ${style.text}`}>
                {course.title}
            </h4>
        </Node>
    )
}

function Arrow() {
    return (
        <div className="flex-shrink-0 flex items-center px-1">
            <svg width="32" height="16" viewBox="0 0 32 16">
                <line x1="0" y1="8" x2="24" y2="8" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 2" />
                <polygon points="24,4 32,8 24,12" fill="#94a3b8" />
            </svg>
        </div>
    )
}

function MiniRoadmap({ currentCourseId, allCourses, roadmapData, navigate }) {
    if (!allCourses || allCourses.length === 0) return null

    const currentCourse = allCourses.find(c => c.id === currentCourseId)
    if (!currentCourse) return null

    // Find prerequisite courses
    const prereqs = (currentCourse.prerequisites || [])
        .map(id => allCourses.find(c => c.id === id))
        .filter(Boolean)

    // Find courses that this one unlocks (courses that have currentCourseId as prerequisite)
    const unlocks = allCourses.filter(c =>
        c.prerequisites && c.prerequisites.includes(currentCourseId)
    )

    // If no connections exist, don't show the section
    if (prereqs.length === 0 && unlocks.length === 0) return null

    return (
        <div className="max-w-5xl mx-auto px-6 pb-10">
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                        <Map className="w-4 h-4 text-[#8b8a95]" />
                        <h2 className="text-sm font-bold text-gray-800">Posición en la Malla</h2>
                    </div>
                    <button
                        onClick={() => navigate('/roadmap')}
                        className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[#16151b] hover:text-[#4b46d6] transition-colors"
                    >
                        <ExternalLink className="w-3 h-3" />
                        Ver malla completa
                    </button>
                </div>

                {/* Mini flow */}
                <div className="flex items-center justify-center gap-2 overflow-x-auto py-4">
                    {/* Prerequisites */}
                    {prereqs.length > 0 && (
                        <>
                            <div className="flex flex-col gap-2 flex-shrink-0">
                                {prereqs.map(c => <MiniNode key={c.id} course={c} roadmapData={roadmapData} navigate={navigate} />)}
                            </div>
                            <Arrow />
                        </>
                    )}

                    {/* Current course */}
                    <div className="flex-shrink-0">
                        <MiniNode course={currentCourse} isCurrent roadmapData={roadmapData} navigate={navigate} />
                    </div>

                    {/* Courses unlocked */}
                    {unlocks.length > 0 && (
                        <>
                            <Arrow />
                            <div className="flex flex-col gap-2 flex-shrink-0">
                                {unlocks.map(c => <MiniNode key={c.id} course={c} roadmapData={roadmapData} navigate={navigate} />)}
                            </div>
                        </>
                    )}
                </div>

                {/* Context text */}
                <div className="text-center mt-3">
                    <p className="text-[11px] text-gray-400">
                        {prereqs.length > 0 && unlocks.length > 0
                            ? `Este curso requiere ${prereqs.length} prerequisito${prereqs.length > 1 ? 's' : ''} y desbloquea ${unlocks.length} curso${unlocks.length > 1 ? 's' : ''}`
                            : prereqs.length > 0
                                ? `Este curso requiere ${prereqs.length} prerequisito${prereqs.length > 1 ? 's' : ''}`
                                : `Este curso desbloquea ${unlocks.length} curso${unlocks.length > 1 ? 's' : ''}`
                        }
                    </p>
                </div>
            </div>
        </div>
    )
}

// ── Main component ────────────────────────────────────────────────────────────
function CoursePreviewPage() {
    const { courseId } = useParams()
    const navigate = useNavigate()
    const [user] = useState(() => getStoredUser())
    const [showLogout, setShowLogout] = useState(false)
    const numericCourseId = Number.parseInt(courseId, 10)

    // Public access: visitors without an account can browse the course OUTLINE
    // (modules/units) and the roadmap. Entering study mode still requires login.

    const {
        data: course,
        isLoading: courseLoading,
        error: courseError,
    } = useQuery({
        queryKey: ['course-detail', numericCourseId],
        queryFn: () => getCourseDetail(numericCourseId),
        enabled: Number.isFinite(numericCourseId),
        staleTime: 60_000,
    })

    const { data: singleRoadmap } = useQuery({
        queryKey: ['roadmap-single', user?.id, numericCourseId],
        queryFn: () => getRoadmap(user.id, numericCourseId),
        enabled: !!user?.id && Number.isFinite(numericCourseId),
        staleTime: 15_000,
    })

    const { data: fullRoadmap } = useQuery({
        queryKey: ['roadmap-full', user?.id],
        queryFn: () => getRoadmap(user.id),
        enabled: !!user?.id,
        staleTime: 20_000,
    })

    const { data: coursesRoadmap } = useQuery({
        queryKey: ['courses-roadmap'],
        queryFn: getCoursesRoadmap,
        staleTime: 60_000,
    })

    const { data: prereqData } = useQuery({
        queryKey: ['prereq-check', numericCourseId, user?.id],
        queryFn: () => checkPrerequisites(numericCourseId, user.id),
        enabled: !!user?.id && Number.isFinite(numericCourseId),
        staleTime: 10_000,
    })

    const progress = useMemo(() => {
        const roadmap = singleRoadmap?.roadmap
        if (roadmap && typeof roadmap === 'object' && !Array.isArray(roadmap)) {
            return { percentage: roadmap.percentage ?? 0, state: roadmap.state ?? 'not_started' }
        }
        return null
    }, [singleRoadmap])

    const roadmapData = useMemo(() => {
        if (!fullRoadmap?.roadmap || !Array.isArray(fullRoadmap.roadmap)) return {}
        return fullRoadmap.roadmap.reduce((acc, c) => {
            acc[c.id] = c
            return acc
        }, {})
    }, [fullRoadmap])

    const allCourses = coursesRoadmap?.courses || []
    const prereqLoading = !!user?.id && !prereqData
    const prereqCheck = prereqData || { allowed: true, details: [], missing: [] }

    const handleStartStudy = () => {
        // Reading the lessons requires an account.
        if (!user) { navigate('/login'); return }
        navigate(`/courses/${courseId}/study`)
    }

    // ── Loading / Error ───────────────────────────────────────────────────────
    if (courseLoading) return (
        <div className="min-h-screen bg-gray-50 animate-pulse">
            {/* Nav skeleton */}
            <header className="bg-white border-b border-gray-200 px-6 py-2.5 flex items-center justify-between">
                <div className="w-24 h-4 bg-gray-200 rounded" />
                <div className="w-7 h-7 bg-gray-200 rounded-full" />
            </header>
            {/* Hero skeleton */}
            <div className="bg-[#0a0a0c]">
                <div className="max-w-5xl mx-auto px-6 py-12 space-y-4">
                    <div className="flex gap-2">
                        <div className="w-24 h-6 bg-white/10 rounded-full" />
                        <div className="w-12 h-6 bg-white/10 rounded-full" />
                    </div>
                    <div className="w-2/3 h-8 bg-white/10 rounded" />
                    <div className="w-full h-4 bg-white/5 rounded" />
                    <div className="w-3/4 h-4 bg-white/5 rounded" />
                    <div className="flex gap-6 mt-4">
                        {[1, 2, 3].map(i => <div key={i} className="w-20 h-4 bg-white/10 rounded" />)}
                    </div>
                    <div className="w-40 h-12 bg-white/10 rounded-xl mt-6" />
                </div>
            </div>
            {/* Module list skeleton */}
            <div className="max-w-5xl mx-auto px-6 py-10 space-y-3">
                <div className="w-48 h-5 bg-gray-200 rounded mb-5" />
                {[1, 2, 3].map(i => (
                    <div key={i} className="rounded-xl border border-gray-100 p-5">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-200 rounded-lg" />
                            <div className="space-y-1.5">
                                <div className="w-48 h-4 bg-gray-200 rounded" />
                                <div className="w-32 h-3 bg-gray-100 rounded" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )

    if (courseError || !course) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
                    <BookOpen className="w-6 h-6 text-red-500" />
                </div>
                <p className="text-red-600 mb-4 text-sm">{courseError?.message || 'Curso no encontrado'}</p>
                <button onClick={() => navigate(user ? '/dashboard' : '/')} className="text-[#16151b] hover:underline text-sm">
                    {user ? '← Volver al dashboard' : '← Volver al inicio'}
                </button>
            </div>
        </div>
    )

    // ── Derived values ────────────────────────────────────────────────────────
    const totalModules = course.modules?.length || 0
    const totalUnits = (course.modules || []).reduce((acc, m) => acc + (m.units?.length || 0), 0)
    const totalContents = (course.modules || []).reduce(
        (acc, m) => acc + (m.units || []).reduce((a, u) => a + (u.contents?.length || 0), 0), 0
    )
    const totalQuizzes = (course.modules || []).reduce(
        (acc, m) => acc + (m.units || []).reduce((a, u) => a + (u.quizzes?.length || 0), 0), 0
    )
    const percentage = progress?.percentage ?? null
    const state = progress?.state ?? null
    const levelConf = LEVEL_CONFIG[course.level] || LEVEL_CONFIG.beginner
    const LevelIcon = levelConf.icon

    // Per-unit completion for the programme timeline, read from this course's
    // roadmap. Without it every unit simply shows as pending.
    const doneUnitIds = new Set(
        (singleRoadmap?.roadmap?.modules || [])
            .flatMap(m => m.units || [])
            .filter(u => u.state === 'completed')
            .map(u => u.id)
    )
    const unitsDone = doneUnitIds.size
    // The programme is the study-mode index in read-only mode, fed with the
    // roadmap's per-unit state: a unit is 1/1 or 0/1, a module counts its units.
    const getUnitProgress = (unitId) => {
        const done = doneUnitIds.has(unitId)
        return { total: 1, completed: done ? 1 : 0, percentage: done ? 100 : 0 }
    }
    const getModuleProgress = (moduleId) => {
        const units = course.modules?.find(m => m.id === moduleId)?.units || []
        const completed = units.filter(u => doneUnitIds.has(u.id)).length
        return {
            total: units.length,
            completed,
            percentage: units.length > 0 ? Math.round((completed / units.length) * 100) : 0,
        }
    }

    // Prerequisite state
    const isBlocked = prereqCheck?.allowed === false
    const hasPrereqs = prereqCheck?.details?.length > 0

    const ctaLabel = !user
        ? 'Inicia sesión para empezar'
        : state === 'completed'
            ? 'Revisar curso'
            : state === 'in_progress'
                ? 'Continuar curso'
                : 'Comenzar curso'

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

            {/* ── Hero ── */}
            <HeroBand className="on-brand-band">
                <div className="max-w-5xl mx-auto px-6 py-12">
                    {/* Badges */}
                    <div className="flex items-center gap-2 mb-4">
                        {course.level && (
                            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${levelConf.color}`}>
                                <LevelIcon className="w-3 h-3" />
                                {levelConf.label}
                            </span>
                        )}
                        {course.version && (
                            <span className="text-xs text-white/50 bg-white/10 px-2.5 py-1 rounded-full">
                                v{course.version}
                            </span>
                        )}
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl md:text-4xl font-bold mb-3 leading-tight">{course.title}</h1>

                    {/* Description */}
                    {course.description && (
                        <p className="text-white/70 text-base leading-relaxed max-w-2xl mb-8">
                            {course.description}
                        </p>
                    )}

                    {/* Stats row */}
                    <div className="flex flex-wrap items-center gap-6 text-sm text-white/60 mb-8">
                        <div className="flex items-center gap-1.5">
                            <BookOpen className="w-4 h-4" />
                            <span><strong className="font-mono tabular-nums text-white">{totalModules}</strong> módulo{totalModules !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Layers className="w-4 h-4" />
                            <span><strong className="font-mono tabular-nums text-white">{totalUnits}</strong> unidad{totalUnits !== 1 ? 'es' : ''}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Package className="w-4 h-4" />
                            <span><strong className="font-mono tabular-nums text-white">{totalContents}</strong> contenido{totalContents !== 1 ? 's' : ''}</span>
                        </div>
                        {totalQuizzes > 0 && (
                            <div className="flex items-center gap-1.5">
                                <ClipboardCheck className="w-4 h-4" />
                                <span><strong className="font-mono tabular-nums text-white">{totalQuizzes}</strong> evaluación{totalQuizzes !== 1 ? 'es' : ''}</span>
                            </div>
                        )}
                    </div>

                    {/* Progress bar (if started) */}
                    {percentage !== null && (
                        <div className="mb-6 max-w-sm">
                            <div className="flex items-center justify-between text-xs text-white/50 mb-1.5">
                                <span>Tu progreso</span>
                                <span className="font-mono font-semibold tabular-nums text-white">{percentage}%</span>
                            </div>
                            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                                <div
                                    className={`h-2 rounded-full transition-all duration-700 ${percentage === 100 ? 'bg-emerald-400' : 'bg-emerald-400/90'}`}
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Prerequisite panel (only shown if there are incomplete prereqs) */}
                    {hasPrereqs && prereqCheck.details.some(p => p.state !== 'completed') && (
                        <PrerequisitePanel
                            details={prereqCheck.details.filter(p => p.state !== 'completed')}
                            onCourseClick={(id) => navigate(`/courses/${id}`)}
                        />
                    )}

                    {/* CTA — Blocked while prereqs load, blocked if prereqs fail */}
                    {totalModules > 0 ? (
                        isBlocked ? (
                            <div className="space-y-3">
                                <div className="inline-flex items-center gap-2 bg-white/10 text-white/50 font-medium px-6 py-3 rounded-xl cursor-not-allowed select-none backdrop-blur-sm">
                                    <Lock className="w-4 h-4" />
                                    Completa los prerequisitos primero
                                </div>
                                {user?.role === 'admin' && (
                                    <div>
                                        <button
                                            onClick={handleStartStudy}
                                            className="inline-flex items-center gap-2 text-xs font-medium text-white/40 hover:text-white/70 transition-colors"
                                        >
                                            <Shield className="w-3 h-3" />
                                            Acceder como admin
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : prereqLoading ? (
                            <button
                                disabled
                                className="inline-flex h-11 items-center gap-2.5 rounded-xl bg-white/20 px-6 font-semibold text-white/70 cursor-not-allowed"
                            >
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Verificando acceso...
                            </button>
                        ) : (
                            <button
                                onClick={handleStartStudy}
                                className="inline-flex h-11 items-center gap-2.5 rounded-xl bg-white px-6 font-semibold text-[#16151b] transition-colors hover:bg-white/90 active:scale-[0.98]"
                            >
                                {state === 'completed'
                                    ? <CheckCircle className="w-5 h-5" />
                                    : <PlayCircle className="w-5 h-5" />
                                }
                                {ctaLabel}
                            </button>
                        )
                    ) : (
                        <div className="inline-flex items-center gap-2 bg-white/10 text-white/50 font-medium px-6 py-3 rounded-xl backdrop-blur-sm">
                            <Lock className="w-4 h-4" />
                            Sin contenido disponible
                        </div>
                    )}
                </div>
            </HeroBand>

            {/* ── Programme: the same line of modules the student meets inside ── */}
            <div className="max-w-5xl mx-auto px-6 pt-14 pb-10">
                <div className="flex items-end justify-between gap-6">
                    <div>
                        <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#a9a8b4]">
                            Programa
                        </div>
                        <h2 className="mt-3 text-[28px] font-bold leading-tight tracking-[-0.012em] text-[#16151b]">
                            Contenido del curso
                        </h2>
                    </div>
                    {totalUnits > 0 && (
                        <p className="text-[13px] text-[#8b8a95]">
                            {unitsDone > 0
                                ? `Ya completaste ${unitsDone} de ${totalUnits} ${totalUnits === 1 ? 'unidad' : 'unidades'}`
                                : `${totalUnits} ${totalUnits === 1 ? 'unidad' : 'unidades'} por delante`}
                        </p>
                    )}
                </div>

                {totalModules === 0 ? (
                    <div className="mt-8 text-center py-16 rounded-2xl border-2 border-dashed border-gray-200">
                        <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                        <p className="text-sm text-gray-400">Este curso aún no tiene módulos.</p>
                    </div>
                ) : (
                    <div className="mt-8">
                        <ModuleSidebar
                            readOnly
                            modules={course.modules}
                            getModuleProgress={getModuleProgress}
                            getUnitProgress={getUnitProgress}
                            defaultExpandedModuleId={course.modules[0]?.id}
                            className=""
                        />
                    </div>
                )}
            </div>

            {/* ── Mini Roadmap ── */}
            <MiniRoadmap
                currentCourseId={parseInt(courseId)}
                allCourses={allCourses}
                roadmapData={roadmapData}
                navigate={navigate}
            />
        </div>
    )
}

export default CoursePreviewPage
