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
 */

import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getStoredUser } from '../services/auth'
import { getCourseDetail, checkPrerequisites } from '../services/courses'
import { getRoadmap } from '../services/progress'
import {
    ArrowLeft, BookOpen, ChevronDown, ChevronRight,
    PlayCircle, FileText, Link2, Loader2, CheckCircle,
    Lock, AlertTriangle, XCircle
} from 'lucide-react'

// ── Content type icon ─────────────────────────────────────────────────────────
const ContentIcon = ({ type }) => {
    switch (type) {
        case 'video': return <PlayCircle className="w-4 h-4 text-gray-400" />
        case 'text': return <FileText className="w-4 h-4 text-gray-400" />
        case 'resource': return <Link2 className="w-4 h-4 text-gray-400" />
        default: return <BookOpen className="w-4 h-4 text-gray-400" />
    }
}

// ── Collapsible module row ────────────────────────────────────────────────────
function ModuleRow({ module, index, defaultOpen = false }) {
    const [open, setOpen] = useState(defaultOpen)
    const unitCount = module.units?.length || 0
    const contentCount = (module.units || []).reduce((acc, u) => acc + (u.contents?.length || 0), 0)

    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
                onClick={() => setOpen(o => !o)}
            >
                <div>
                    <div className="font-semibold text-gray-800">{module.title}</div>
                    <div className="text-sm text-gray-500 mt-0.5">
                        Módulo {index + 1} · {unitCount} unidad{unitCount !== 1 ? 'es' : ''}
                        {contentCount > 0 && ` · ${contentCount} contenido${contentCount !== 1 ? 's' : ''}`}
                    </div>
                </div>
                {open
                    ? <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    : <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                }
            </button>

            {open && module.units && module.units.length > 0 && (
                <div className="border-t border-gray-100 divide-y divide-gray-100 bg-gray-50/50">
                    {module.units.map((unit, ui) => {
                        const firstContentType = unit.contents?.[0]?.content_type
                        return (
                            <div key={unit.id} className="flex items-center gap-3 px-5 py-3">
                                <ContentIcon type={firstContentType} />
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm text-gray-700 truncate">{unit.title}</div>
                                    <div className="text-xs text-gray-400">
                                        Unidad {index + 1}.{ui + 1}
                                        {unit.contents?.length > 0 && ` · ${unit.contents.length} contenido${unit.contents.length !== 1 ? 's' : ''}`}
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

// ── Level badge ───────────────────────────────────────────────────────────────
const LEVEL_LABELS = { beginner: 'Principiante', intermediate: 'Intermedio', advanced: 'Avanzado' }
const LEVEL_COLORS = {
    beginner: 'bg-green-100 text-green-700',
    intermediate: 'bg-yellow-100 text-yellow-700',
    advanced: 'bg-red-100 text-red-700',
}

// ── Prerequisite state helpers ────────────────────────────────────────────────
const STATE_LABELS = { completed: 'Completado', in_progress: 'En progreso', not_started: 'No iniciado' }
const STATE_COLORS = {
    completed: 'text-green-700',
    in_progress: 'text-blue-600',
    not_started: 'text-gray-500',
}

// ── Prerequisite panel ────────────────────────────────────────────────────────
function PrerequisitePanel({ details, onCourseClick }) {
    return (
        <div className="mb-6 max-w-sm rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span className="text-sm font-semibold text-amber-800">Prerequisitos requeridos</span>
            </div>
            <div className="space-y-2">
                {details.map(p => {
                    const done = p.state === 'completed'
                    return (
                        <button
                            key={p.prereq_id}
                            onClick={() => onCourseClick(p.prereq_id)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors text-left"
                        >
                            {done
                                ? <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
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

// ── Main component ────────────────────────────────────────────────────────────
function CoursePreviewPage() {
    const { courseId } = useParams()
    const navigate = useNavigate()
    const [user, setUser] = useState(null)
    const [course, setCourse] = useState(null)
    const [progress, setProgress] = useState(null)
    const [prereqCheck, setPrereqCheck] = useState(null) // { allowed, details, missing }
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // Load user
    useEffect(() => {
        const storedUser = getStoredUser()
        if (!storedUser) { navigate('/login'); return }
        setUser(storedUser)
    }, [navigate])

    // Load course detail
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

    // Load progress once user is available
    useEffect(() => {
        if (!user?.id) return
        getRoadmap(user.id, parseInt(courseId))
            .then(data => {
                const roadmap = data?.roadmap
                if (roadmap && typeof roadmap === 'object' && !Array.isArray(roadmap)) {
                    setProgress({ percentage: roadmap.percentage ?? 0, state: roadmap.state ?? 'not_started' })
                }
            })
            .catch(() => { })
    }, [user, courseId])

    // Check prerequisites once course and user are loaded
    // Admins skip the check (they can always access any course)
    useEffect(() => {
        if (!user?.id || !course) return
        if (user.role === 'admin') {
            setPrereqCheck({ allowed: true, details: [], missing: [] })
            return
        }
        // Only check if the course actually has prerequisites
        if (!course.prerequisites || course.prerequisites.length === 0) {
            setPrereqCheck({ allowed: true, details: [], missing: [] })
            return
        }
        checkPrerequisites(parseInt(courseId), user.id)
            .then(data => setPrereqCheck(data))
            .catch(() => {
                // On error, allow access (fail open — don't block students on API errors)
                setPrereqCheck({ allowed: true, details: [], missing: [] })
            })
    }, [user, course, courseId])

    const handleStartStudy = () => {
        navigate(`/courses/${courseId}/study`)
    }

    // ── Loading / Error ───────────────────────────────────────────────────────
    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
    )

    if (error || !course) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <p className="text-red-600 mb-4">{error || 'Curso no encontrado'}</p>
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
    const percentage = progress?.percentage ?? null
    const state = progress?.state ?? null
    const levelLabel = LEVEL_LABELS[course.level] || course.level
    const levelColor = LEVEL_COLORS[course.level] || 'bg-gray-100 text-gray-600'

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
            <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-3">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Volver a cursos
                </button>
                {user?.role && (
                    <span className="ml-auto text-xs text-gray-400 capitalize">{user.role}</span>
                )}
            </header>

            {/* ── Hero ── */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-5xl mx-auto px-6 py-10">
                    {/* Badges */}
                    <div className="flex items-center gap-2 mb-3">
                        {course.level && (
                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${levelColor}`}>
                                {levelLabel}
                            </span>
                        )}
                        {course.version && (
                            <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                                Versión {course.version}
                            </span>
                        )}
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl font-bold text-gray-900 mb-3">{course.title}</h1>

                    {/* Description */}
                    {course.description && (
                        <p className="text-gray-600 text-base leading-relaxed max-w-2xl mb-6">
                            {course.description}
                        </p>
                    )}

                    {/* Stats row */}
                    <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 mb-8">
                        <div className="flex items-center gap-1.5">
                            <BookOpen className="w-4 h-4 text-gray-400" />
                            <span><strong className="text-gray-800">{totalModules}</strong> módulo{totalModules !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <FileText className="w-4 h-4 text-gray-400" />
                            <span><strong className="text-gray-800">{totalUnits}</strong> unidad{totalUnits !== 1 ? 'es' : ''}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <PlayCircle className="w-4 h-4 text-gray-400" />
                            <span><strong className="text-gray-800">{totalContents}</strong> contenido{totalContents !== 1 ? 's' : ''}</span>
                        </div>
                    </div>

                    {/* Progress bar (if started) */}
                    {percentage !== null && (
                        <div className="mb-6 max-w-sm">
                            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                                <span>Tu progreso</span>
                                <span className="font-semibold text-gray-700">{percentage}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className={`h-2 rounded-full transition-all duration-500 ${percentage === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Prerequisite panel (shown when blocked) */}
                    {isBlocked && hasPrereqs && (
                        <PrerequisitePanel
                            details={prereqCheck.details}
                            onCourseClick={(id) => navigate(`/courses/${id}`)}
                        />
                    )}

                    {/* CTA */}
                    {totalModules > 0 ? (
                        prereqLoading ? (
                            // Still checking prerequisites
                            <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-500 font-medium px-6 py-3 rounded-lg">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Verificando acceso...
                            </div>
                        ) : isBlocked ? (
                            // Blocked — prerequisites not met
                            <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-500 font-medium px-6 py-3 rounded-lg cursor-not-allowed select-none">
                                <Lock className="w-4 h-4" />
                                Completá los prerequisitos primero
                            </div>
                        ) : (
                            // Allowed — show CTA
                            <button
                                onClick={handleStartStudy}
                                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors shadow-sm"
                            >
                                {state === 'completed'
                                    ? <CheckCircle className="w-5 h-5" />
                                    : <PlayCircle className="w-5 h-5" />
                                }
                                {ctaLabel}
                            </button>
                        )
                    ) : (
                        <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-500 font-medium px-6 py-3 rounded-lg">
                            <Lock className="w-4 h-4" />
                            Sin contenido disponible
                        </div>
                    )}
                </div>
            </div>

            {/* ── Module list ── */}
            <div className="max-w-5xl mx-auto px-6 py-10">
                <h2 className="text-xl font-bold text-gray-800 mb-5">Contenido del curso</h2>

                {totalModules === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
                        <p>Este curso aún no tiene módulos.</p>
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
        </div>
    )
}

export default CoursePreviewPage
