/**
 * Roadmap Graph Component
 *
 * Visual course dependency graph organized by DEPTH (topological sort),
 * NOT by difficulty level. Similar to a university curriculum grid.
 *
 * - Row 0: courses with no prerequisites (entry points)
 * - Row N: courses whose deepest prerequisite is at depth N-1
 *
 * Each course node still shows its level badge (beginner/intermediate/advanced)
 * but the layout is purely based on prerequisite chains.
 *
 * SVG arrows connect prerequisite courses to the courses they unlock.
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    GraduationCap, Zap, Trophy, CheckCircle, Clock, Lock, Unlock,
    BookOpen
} from 'lucide-react'

// ── Level config (for badge only) ─────────────────────────────────────────────
const LEVEL_CONFIG = {
    beginner: { label: 'Principiante', icon: GraduationCap, color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    intermediate: { label: 'Intermedio', icon: Zap, color: 'bg-amber-100 text-amber-700 border-amber-200' },
    advanced: { label: 'Avanzado', icon: Trophy, color: 'bg-rose-100 text-rose-700 border-rose-200' },
}

// ── State config ──────────────────────────────────────────────────────────────
const STATE_CONFIG = {
    completed: { icon: CheckCircle, label: 'Completado', nodeClass: 'ring-2 ring-emerald-400', iconColor: 'text-emerald-500' },
    in_progress: { icon: Clock, label: 'En progreso', nodeClass: 'ring-2 ring-blue-400', iconColor: 'text-blue-500' },
    unlocked: { icon: Unlock, label: 'Disponible', nodeClass: 'ring-1 ring-gray-200', iconColor: 'text-gray-400' },
    locked: { icon: Lock, label: 'Bloqueado', nodeClass: 'ring-1 ring-gray-200', iconColor: 'text-gray-300' },
}

// ── Compute topological depth ─────────────────────────────────────────────────
function computeDepths(courses) {
    const courseMap = {}
    courses.forEach(c => { courseMap[c.id] = c })

    const depths = {}
    const visited = new Set()

    function getDepth(courseId) {
        if (depths[courseId] !== undefined) return depths[courseId]
        if (visited.has(courseId)) return 0 // cycle guard
        visited.add(courseId)

        const course = courseMap[courseId]
        if (!course || !course.prerequisites || course.prerequisites.length === 0) {
            depths[courseId] = 0
            return 0
        }

        let maxPrereqDepth = 0
        for (const prereqId of course.prerequisites) {
            if (courseMap[prereqId]) {
                maxPrereqDepth = Math.max(maxPrereqDepth, getDepth(prereqId))
            }
        }

        depths[courseId] = maxPrereqDepth + 1
        return depths[courseId]
    }

    courses.forEach(c => getDepth(c.id))
    return depths
}

// ── Compute course state ──────────────────────────────────────────────────────
function getCourseState(course, roadmapData) {
    const progress = roadmapData?.[course.id]
    if (progress) {
        if (progress.state === 'completed') return 'completed'
        if (progress.state === 'in_progress') return 'in_progress'
    }

    if (!course.prerequisites || course.prerequisites.length === 0) {
        return 'unlocked'
    }

    const allPrereqsMet = course.prerequisites.every(prereqId => {
        const prereqProgress = roadmapData?.[prereqId]
        return prereqProgress?.state === 'completed'
    })

    return allPrereqsMet ? 'unlocked' : 'locked'
}

// ── Course node ───────────────────────────────────────────────────────────────
function CourseNode({ course, state, progress, onClick, dimmed }) {
    const stateConf = STATE_CONFIG[state]
    const levelConf = LEVEL_CONFIG[course.level] || LEVEL_CONFIG.beginner
    const StateIcon = stateConf.icon
    const LevelIcon = levelConf.icon
    const percentage = progress?.percentage ?? 0

    const isLocked = state === 'locked'

    return (
        <button
            data-course-id={course.id}
            onClick={() => onClick(course.id)}
            className={`
                relative w-56 overflow-hidden rounded-xl bg-white text-left cursor-pointer
                shadow-sm transition-all duration-200
                ${stateConf.nodeClass}
                hover:shadow-md hover:-translate-y-0.5
                ${dimmed ? 'opacity-30 hover:opacity-60' : ''}
            `}
        >
            {/* Thumbnail header */}
            <div className="relative h-20 w-full overflow-hidden bg-slate-100">
                {course.image_url ? (
                    <img
                        src={course.image_url}
                        alt={course.title}
                        className={`absolute inset-0 h-full w-full object-cover ${isLocked ? 'grayscale' : ''}`}
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <LevelIcon className="h-7 w-7 text-slate-300" strokeWidth={1.5} />
                    </div>
                )}

                {/* Level badge */}
                <span className={`absolute left-2 top-2 inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-semibold ${levelConf.color}`}>
                    {levelConf.label}
                </span>
            </div>

            {/* Body */}
            <div className="p-3">
                <h3 className={`mb-1 line-clamp-2 text-[13px] font-semibold leading-snug ${isLocked ? 'text-gray-400' : 'text-gray-900'}`}>
                    {course.title}
                </h3>
                {course.description && (
                    <p className="mb-2 line-clamp-2 text-[11px] leading-snug text-gray-400">
                        {course.description}
                    </p>
                )}

                <div className={`flex items-center gap-1.5 text-[11px] ${stateConf.iconColor}`}>
                    <StateIcon className="h-3.5 w-3.5" />
                    <span className="font-medium">
                        {stateConf.label}
                        {state === 'in_progress' && percentage > 0 && ` · ${percentage}%`}
                    </span>
                </div>

                {/* Progress bar */}
                {state === 'in_progress' && percentage > 0 && (
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                        <div
                            className="h-1.5 rounded-full bg-blue-500 transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                        />
                    </div>
                )}
            </div>
        </button>
    )
}

// ── SVG Arrow Layer ───────────────────────────────────────────────────────────
function ArrowLayer({ courses, containerRef, highlightIds }) {
    const [arrows, setArrows] = useState([])

    const computeArrows = useCallback(() => {
        if (!containerRef.current) return
        const container = containerRef.current
        const containerRect = container.getBoundingClientRect()
        const newArrows = []

        courses.forEach(course => {
            if (!course.prerequisites) return
            course.prerequisites.forEach(prereqId => {
                const fromEl = container.querySelector(`[data-course-id="${prereqId}"]`)
                const toEl = container.querySelector(`[data-course-id="${course.id}"]`)
                if (!fromEl || !toEl) return

                const fromRect = fromEl.getBoundingClientRect()
                const toRect = toEl.getBoundingClientRect()

                const x1 = fromRect.left + fromRect.width / 2 - containerRect.left
                const y1 = fromRect.bottom - containerRect.top
                const x2 = toRect.left + toRect.width / 2 - containerRect.left
                const y2 = toRect.top - containerRect.top

                // An arrow belongs to the highlighted sub-malla only when BOTH of
                // its endpoints are in the selected specialization.
                const active = !highlightIds || (highlightIds.has(prereqId) && highlightIds.has(course.id))

                newArrows.push({ x1, y1, x2, y2, active, key: `${prereqId}->${course.id}` })
            })
        })

        setArrows(newArrows)
    }, [courses, containerRef, highlightIds])

    useEffect(() => {
        const timer = setTimeout(computeArrows, 150)
        window.addEventListener('resize', computeArrows)
        return () => {
            clearTimeout(timer)
            window.removeEventListener('resize', computeArrows)
        }
    }, [computeArrows])

    if (arrows.length === 0) return null

    return (
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
            <defs>
                <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                    <polygon points="0 0, 8 3, 0 6" fill="#94a3b8" />
                </marker>
            </defs>
            {arrows.map(({ x1, y1, x2, y2, active, key }) => {
                const midY = (y1 + y2) / 2
                return (
                    <path
                        key={key}
                        d={`M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`}
                        stroke="#cbd5e1"
                        strokeWidth="2"
                        fill="none"
                        markerEnd="url(#arrowhead)"
                        strokeDasharray="6 3"
                        className="transition-opacity duration-300"
                        style={{ opacity: active ? 1 : 0.2 }}
                    />
                )
            })}
        </svg>
    )
}

// ── Main RoadmapGraph ─────────────────────────────────────────────────────────
export default function RoadmapGraph({ courses, roadmapData, highlightIds = null }) {
    const navigate = useNavigate()
    const containerRef = useRef(null)

    // Compute topological depths and group by depth
    const depths = computeDepths(courses)
    const maxDepth = Math.max(0, ...Object.values(depths))

    const rows = []
    for (let d = 0; d <= maxDepth; d++) {
        rows.push(courses.filter(c => depths[c.id] === d))
    }

    const handleCourseClick = (courseId) => {
        navigate(`/courses/${courseId}`)
    }

    if (courses.length === 0) {
        return (
            <div className="text-center py-20">
                <BookOpen className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-400">No hay cursos disponibles aún.</p>
            </div>
        )
    }

    return (
        <div ref={containerRef} className="relative py-4">
            {/* SVG arrows */}
            <ArrowLayer courses={courses} containerRef={containerRef} highlightIds={highlightIds} />

            {/* Depth rows */}
            <div className="relative space-y-10" style={{ zIndex: 1 }}>
                {rows.map((rowCourses, depth) => {
                    if (rowCourses.length === 0) return null

                    return (
                        <div key={depth}>
                            {/* Row header — plain level marker */}
                            <div className="mb-3 flex items-center gap-2">
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-500">
                                    {depth + 1}
                                </span>
                                <div className="h-px flex-1 bg-gray-100" />
                            </div>

                            {/* Course cards */}
                            <div className="flex flex-wrap gap-5 justify-center sm:justify-start sm:pl-8">
                                {rowCourses.map(course => {
                                    const state = getCourseState(course, roadmapData)
                                    const progress = roadmapData?.[course.id]
                                    const dimmed = highlightIds ? !highlightIds.has(course.id) : false
                                    return (
                                        <CourseNode
                                            key={course.id}
                                            course={course}
                                            state={state}
                                            progress={progress}
                                            onClick={handleCourseClick}
                                            dimmed={dimmed}
                                        />
                                    )
                                })}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
