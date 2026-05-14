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
    completed: { icon: CheckCircle, label: 'Completado', nodeClass: 'ring-2 ring-emerald-400 bg-white', iconColor: 'text-emerald-500', dotColor: 'bg-emerald-400' },
    in_progress: { icon: Clock, label: 'En progreso', nodeClass: 'ring-2 ring-blue-400 bg-white', iconColor: 'text-blue-500', dotColor: 'bg-blue-400' },
    unlocked: { icon: Unlock, label: 'Disponible', nodeClass: 'ring-1 ring-gray-200 bg-white', iconColor: 'text-gray-400', dotColor: 'bg-gray-300' },
    locked: { icon: Lock, label: 'Bloqueado', nodeClass: 'ring-1 ring-gray-200 bg-gray-50/80', iconColor: 'text-gray-300', dotColor: 'bg-gray-200' },
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
function CourseNode({ course, state, progress, onClick }) {
    const stateConf = STATE_CONFIG[state]
    const levelConf = LEVEL_CONFIG[course.level] || LEVEL_CONFIG.beginner
    const StateIcon = stateConf.icon
    const LevelIcon = levelConf.icon
    const percentage = progress?.percentage ?? 0

    return (
        <button
            data-course-id={course.id}
            onClick={() => onClick(course.id)}
            className={`
                relative w-48 rounded-xl p-3.5 transition-all duration-200 text-left cursor-pointer
                ${stateConf.nodeClass}
                hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98]
            `}
        >
            {/* Level badge + state icon */}
            <div className="flex items-center justify-between mb-1.5">
                <span className={`inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${levelConf.color}`}>
                    <LevelIcon className="w-2.5 h-2.5" />
                    {levelConf.label}
                </span>
                <StateIcon className={`w-4 h-4 ${stateConf.iconColor}`} />
            </div>

            {/* Title */}
            <h3 className={`text-[13px] font-semibold leading-snug mb-1 line-clamp-2 ${state === 'locked' ? 'text-gray-500' : 'text-gray-800'}`}>
                {course.title}
            </h3>

            {/* State */}
            <div className={`text-[10px] ${stateConf.iconColor} font-medium`}>
                {stateConf.label}
                {state === 'in_progress' && percentage > 0 && ` · ${percentage}%`}
            </div>

            {/* Progress bar */}
            {state === 'in_progress' && percentage > 0 && (
                <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div
                        className="h-1.5 rounded-full bg-blue-500 transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                    />
                </div>
            )}
        </button>
    )
}

// ── SVG Arrow Layer ───────────────────────────────────────────────────────────
function ArrowLayer({ courses, containerRef }) {
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

                newArrows.push({ x1, y1, x2, y2, key: `${prereqId}->${course.id}` })
            })
        })

        setArrows(newArrows)
    }, [courses, containerRef])

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
            {arrows.map(({ x1, y1, x2, y2, key }) => {
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
                    />
                )
            })}
        </svg>
    )
}

// ── Main RoadmapGraph ─────────────────────────────────────────────────────────
export default function RoadmapGraph({ courses, roadmapData }) {
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
            <ArrowLayer courses={courses} containerRef={containerRef} />

            {/* Depth rows */}
            <div className="relative space-y-10" style={{ zIndex: 1 }}>
                {rows.map((rowCourses, depth) => {
                    if (rowCourses.length === 0) return null

                    return (
                        <div key={depth}>
                            {/* Row header — subtle depth indicator */}
                            <div className="flex items-center gap-2 mb-3">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-[10px] font-bold text-slate-500">
                                    {depth + 1}
                                </span>
                                <div className="flex-1 h-px bg-gray-100" />
                            </div>

                            {/* Course cards */}
                            <div className="flex flex-wrap gap-5 justify-center sm:justify-start pl-8">
                                {rowCourses.map(course => {
                                    const state = getCourseState(course, roadmapData)
                                    const progress = roadmapData?.[course.id]
                                    return (
                                        <CourseNode
                                            key={course.id}
                                            course={course}
                                            state={state}
                                            progress={progress}
                                            onClick={handleCourseClick}
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
