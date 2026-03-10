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

import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getStoredUser } from '../services/auth'
import { getCourseDetail, checkPrerequisites, getCoursesRoadmap } from '../services/courses'
import { getRoadmap } from '../services/progress'
import {
    ArrowLeft, BookOpen, ChevronDown, ChevronRight,
    PlayCircle, FileText, Link2, Loader2, CheckCircle,
    Lock, AlertTriangle, XCircle, GraduationCap, Zap,
    Trophy, Layers, Package, Shield, Map, ExternalLink,
    ClipboardCheck
} from 'lucide-react'

// ── Level config ──────────────────────────────────────────────────────────────
const LEVEL_CONFIG = {
    beginner: { label: 'Principiante', icon: GraduationCap, color: 'bg-emerald-100 text-emerald-700', gradient: 'from-emerald-500 to-teal-600' },
    intermediate: { label: 'Intermedio', icon: Zap, color: 'bg-amber-100 text-amber-700', gradient: 'from-amber-500 to-orange-600' },
    advanced: { label: 'Avanzado', icon: Trophy, color: 'bg-rose-100 text-rose-700', gradient: 'from-rose-500 to-red-600' },
}

// ── Content type icon ─────────────────────────────────────────────────────────
const ContentIcon = ({ type }) => {
    switch (type) {
        case 'video': return <PlayCircle className="w-4 h-4" />
        case 'text': return <FileText className="w-4 h-4" />
        case 'resource': return <Link2 className="w-4 h-4" />
        default: return <BookOpen className="w-4 h-4" />
    }
}

const CONTENT_TYPE_COLORS = {
    video: 'text-purple-500',
    text: 'text-blue-500',
    resource: 'text-amber-500',
}

// ── Collapsible module row ────────────────────────────────────────────────────
function ModuleRow({ module, index, defaultOpen = false }) {
    const [open, setOpen] = useState(defaultOpen)
    const unitCount = module.units?.length || 0
    const contentCount = (module.units || []).reduce((acc, u) => acc + (u.contents?.length || 0), 0)
    const quizCount = (module.units || []).reduce((acc, u) => acc + (u.quizzes?.length || 0), 0)

    return (
        <div className={`rounded-xl border transition-all ${open ? 'border-gray-200 shadow-sm' : 'border-gray-100 hover:border-gray-200'}`}>
            <button
                className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors"
                onClick={() => setOpen(o => !o)}
            >
                <div className="flex items-center gap-3.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${open ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'
                        }`}>
                        {index + 1}
                    </div>
                    <div>
                        <div className="font-semibold text-gray-800 text-sm">{module.title}</div>
                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                            <span className="inline-flex items-center gap-1">
                                <Layers className="w-3 h-3" />
                                {unitCount} unidad{unitCount !== 1 ? 'es' : ''}
                            </span>
                            {contentCount > 0 && (
                                <span className="inline-flex items-center gap-1">
                                    <Package className="w-3 h-3" />
                                    {contentCount} contenido{contentCount !== 1 ? 's' : ''}
                                </span>
                            )}
                            {quizCount > 0 && (
                                <span className="inline-flex items-center gap-1">
                                    <ClipboardCheck className="w-3 h-3" />
                                    {quizCount} evaluación{quizCount !== 1 ? 'es' : ''}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && module.units && module.units.length > 0 && (
                <div className="border-t border-gray-100 bg-gray-50/50 rounded-b-xl">
                    {module.units.map((unit, ui) => {
                        const firstContentType = unit.contents?.[0]?.content_type
                        return (
                            <div key={unit.id} className="px-5 py-2.5 pl-16 border-b border-gray-100 last:border-b-0">
                                <div className="flex items-center gap-3">
                                    <div className={CONTENT_TYPE_COLORS[firstContentType] || 'text-gray-400'}>
                                        <ContentIcon type={firstContentType} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm text-gray-700 truncate">{unit.title}</div>
                                        <div className="text-[10px] text-gray-400 mt-0.5">
                                            {index + 1}.{ui + 1}
                                            {unit.contents?.length > 0 && ` · ${unit.contents.length} contenido${unit.contents.length !== 1 ? 's' : ''}`}
                                            {unit.quizzes?.length > 0 && ` · ${unit.quizzes.length} evaluación${unit.quizzes.length !== 1 ? 'es' : ''}`}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}


const STATE_LABELS = { completed: 'Completado', in_progress: 'En progreso', not_started: 'No iniciado' }
const STATE_COLORS = {
    completed: 'text-emerald-700',
    in_progress: 'text-blue-600',
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

    const getCourseState = (course) => {
        const progress = roadmapData?.[course.id]
        if (progress?.state === 'completed') return 'completed'
        if (progress?.state === 'in_progress') return 'in_progress'
        if (!course.prerequisites || course.prerequisites.length === 0) return 'unlocked'
        const allMet = course.prerequisites.every(pid => roadmapData?.[pid]?.state === 'completed')
        return allMet ? 'unlocked' : 'locked'
    }

    const stateStyles = {
        completed: { ring: 'ring-emerald-400', bg: 'bg-white', text: 'text-gray-800', icon: CheckCircle, iconColor: 'text-emerald-500' },
        in_progress: { ring: 'ring-blue-400', bg: 'bg-white', text: 'text-gray-800', icon: Loader2, iconColor: 'text-blue-500' },
        unlocked: { ring: 'ring-gray-200', bg: 'bg-white', text: 'text-gray-700', icon: null, iconColor: '' },
        locked: { ring: 'ring-gray-200', bg: 'bg-gray-50', text: 'text-gray-400', icon: Lock, iconColor: 'text-gray-300' },
    }

    const MiniNode = ({ course, isCurrent = false }) => {
        const state = isCurrent ? getCourseState(currentCourse) : getCourseState(course)
        const style = stateStyles[state] || stateStyles.unlocked
        const isClickable = !isCurrent && state !== 'locked'
        const levelConf = LEVEL_CONFIG[course.level] || LEVEL_CONFIG.beginner
        const LevelIcon = levelConf.icon
        const StateIcon = style.icon

        return (
            <button
                onClick={() => isClickable && navigate(`/courses/${course.id}`)}
                className={`
                    relative rounded-xl p-3 ring-2 transition-all text-left
                    ${style.ring} ${style.bg}
                    ${isCurrent ? 'ring-blue-500 shadow-md scale-105' : ''}
                    ${isClickable ? 'cursor-pointer hover:shadow-lg hover:-translate-y-0.5' : !isCurrent ? 'cursor-not-allowed opacity-60' : ''}
                    ${isCurrent ? 'w-56' : 'w-44'}
                `}
            >
                {isCurrent && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
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
            </button>
        )
    }

    const Arrow = () => (
        <div className="flex-shrink-0 flex items-center px-1">
            <svg width="32" height="16" viewBox="0 0 32 16">
                <line x1="0" y1="8" x2="24" y2="8" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 2" />
                <polygon points="24,4 32,8 24,12" fill="#94a3b8" />
            </svg>
        </div>
    )

    return (
        <div className="max-w-5xl mx-auto px-6 pb-10">
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                        <Map className="w-4 h-4 text-blue-500" />
                        <h2 className="text-sm font-bold text-gray-800">Posición en la Malla</h2>
                    </div>
                    <button
                        onClick={() => navigate('/roadmap')}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition-colors"
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
                                {prereqs.map(c => <MiniNode key={c.id} course={c} />)}
                            </div>
                            <Arrow />
                        </>
                    )}

                    {/* Current course */}
                    <div className="flex-shrink-0">
                        <MiniNode course={currentCourse} isCurrent />
                    </div>

                    {/* Courses unlocked */}
                    {unlocks.length > 0 && (
                        <>
                            <Arrow />
                            <div className="flex flex-col gap-2 flex-shrink-0">
                                {unlocks.map(c => <MiniNode key={c.id} course={c} />)}
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
    const [user, setUser] = useState(null)
    const [course, setCourse] = useState(null)
    const [progress, setProgress] = useState(null)
    const [prereqCheck, setPrereqCheck] = useState(null)
    const [allCourses, setAllCourses] = useState([])
    const [roadmapData, setRoadmapData] = useState({})
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // Load user
    useEffect(() => {
        const storedUser = getStoredUser()
        if (!storedUser) { navigate('/login'); return }
        setUser(storedUser)
    }, [navigate])

    // Load course detail IMMEDIATELY (no user dependency)
    useEffect(() => {
        const load = async () => {
            try {
                const data = await getCourseDetail(courseId)
                setCourse(data)
            } catch (err) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [courseId])

    // Load user-dependent data in parallel (roadmap + prereqs)
    useEffect(() => {
        if (!user?.id) return

        Promise.all([
            getRoadmap(user.id, parseInt(courseId)).catch(() => null),
            getRoadmap(user.id).catch(() => null),
            getCoursesRoadmap().catch(() => null),
            checkPrerequisites(parseInt(courseId), user.id).catch(() => null),
        ]).then(([singleRoadmap, fullRoadmap, coursesRoadmap, prereqData]) => {
            // Single course progress
            const roadmap = singleRoadmap?.roadmap
            if (roadmap && typeof roadmap === 'object' && !Array.isArray(roadmap)) {
                setProgress({ percentage: roadmap.percentage ?? 0, state: roadmap.state ?? 'not_started' })
            }
            // Full roadmap data
            if (fullRoadmap?.roadmap && Array.isArray(fullRoadmap.roadmap)) {
                const map = {}
                fullRoadmap.roadmap.forEach(c => { map[c.id] = c })
                setRoadmapData(map)
            }
            // All courses for mini roadmap
            if (coursesRoadmap?.courses) {
                setAllCourses(coursesRoadmap.courses)
            }
            // Prerequisites
            if (prereqData) {
                if (user.role === 'admin') {
                    setPrereqCheck({ ...prereqData, allowed: true })
                } else {
                    setPrereqCheck(prereqData)
                }
            } else {
                setPrereqCheck({ allowed: true, details: [], missing: [] })
            }
        })
    }, [user, courseId])

    const handleStartStudy = () => {
        navigate(`/courses/${courseId}/study`)
    }

    // ── Loading / Error ───────────────────────────────────────────────────────
    if (loading) return (
        <div className="min-h-screen bg-gray-50 animate-pulse">
            {/* Nav skeleton */}
            <header className="bg-white border-b border-gray-200 px-6 py-2.5 flex items-center justify-between">
                <div className="w-24 h-4 bg-gray-200 rounded" />
                <div className="w-7 h-7 bg-gray-200 rounded-full" />
            </header>
            {/* Hero skeleton */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
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

    if (error || !course) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
                    <BookOpen className="w-6 h-6 text-red-500" />
                </div>
                <p className="text-red-600 mb-4 text-sm">{error || 'Curso no encontrado'}</p>
                <button onClick={() => navigate('/dashboard')} className="text-blue-600 hover:underline text-sm">
                    ← Volver al dashboard
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

    // Prerequisite state
    const prereqLoading = prereqCheck === null
    const isBlocked = !prereqLoading && prereqCheck?.allowed === false
    const hasPrereqs = prereqCheck?.details?.length > 0

    const ctaLabel = state === 'completed'
        ? 'Revisar curso'
        : state === 'in_progress'
            ? 'Continuar curso'
            : 'Comenzar curso'

    return (
        <div className="min-h-screen bg-gray-50">
            {/* ── Top nav ── */}
            <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 px-6 py-2.5 flex items-center justify-between sticky top-0 z-40">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Volver a cursos</span>
                </button>
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

            {/* ── Hero ── */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
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
                            <span><strong className="text-white">{totalModules}</strong> módulo{totalModules !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Layers className="w-4 h-4" />
                            <span><strong className="text-white">{totalUnits}</strong> unidad{totalUnits !== 1 ? 'es' : ''}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Package className="w-4 h-4" />
                            <span><strong className="text-white">{totalContents}</strong> contenido{totalContents !== 1 ? 's' : ''}</span>
                        </div>
                        {totalQuizzes > 0 && (
                            <div className="flex items-center gap-1.5">
                                <ClipboardCheck className="w-4 h-4" />
                                <span><strong className="text-white">{totalQuizzes}</strong> evaluación{totalQuizzes !== 1 ? 'es' : ''}</span>
                            </div>
                        )}
                    </div>

                    {/* Progress bar (if started) */}
                    {percentage !== null && (
                        <div className="mb-6 max-w-sm">
                            <div className="flex items-center justify-between text-xs text-white/50 mb-1.5">
                                <span>Tu progreso</span>
                                <span className="font-bold text-white">{percentage}%</span>
                            </div>
                            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                                <div
                                    className={`h-2 rounded-full transition-all duration-700 ${percentage === 100 ? 'bg-emerald-400' : 'bg-blue-400'}`}
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

                    {/* CTA — Optimistic: show button immediately, block only if prereqs fail */}
                    {totalModules > 0 ? (
                        isBlocked ? (
                            <div className="inline-flex items-center gap-2 bg-white/10 text-white/50 font-medium px-6 py-3 rounded-xl cursor-not-allowed select-none backdrop-blur-sm">
                                <Lock className="w-4 h-4" />
                                Completa los prerequisitos primero
                            </div>
                        ) : (
                            <button
                                onClick={handleStartStudy}
                                className={`inline-flex items-center gap-2.5 font-semibold px-7 py-3.5 rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-[0.98] ${state === 'completed'
                                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                                    }`}
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
            </div>

            {/* ── Module list ── */}
            <div className="max-w-5xl mx-auto px-6 py-10">
                <h2 className="text-lg font-bold text-gray-800 mb-5">Contenido del curso</h2>

                {totalModules === 0 ? (
                    <div className="text-center py-16 rounded-2xl border-2 border-dashed border-gray-200">
                        <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                        <p className="text-sm text-gray-400">Este curso aún no tiene módulos.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {course.modules.map((module, i) => (
                            <ModuleRow
                                key={module.id}
                                module={module}
                                index={i}
                                defaultOpen={i === 0}
                            />
                        ))}
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
