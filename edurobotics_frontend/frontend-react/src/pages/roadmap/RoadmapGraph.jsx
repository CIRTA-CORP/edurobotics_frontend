/**
 * Roadmap Graph Component
 *
 * Visual course dependency tree organized by level (beginner → intermediate → advanced).
 * Uses CSS grid + SVG arrows for connections. No external dependencies.
 *
 * Each node shows:
 * - Course title and level badge
 * - State: completed ✅, in progress ⏳, unlocked 🔓, locked 🔒
 * - Progress bar (if in progress)
 * - Click navigates to /courses/:id
 *
 * SVG arrows connect prerequisite courses to the courses they unlock.
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    GraduationCap, Zap, Trophy, CheckCircle, Clock, Lock, Unlock,
    BookOpen
} from 'lucide-react'

// ── Level config ──────────────────────────────────────────────────────────────
const LEVEL_CONFIG = {
    beginner: { label: 'Principiante', icon: GraduationCap, order: 0, gradient: 'from-emerald-500 to-teal-600', border: 'border-emerald-300', bg: 'bg-emerald-50' },
    intermediate: { label: 'Intermedio', icon: Zap, order: 1, gradient: 'from-amber-500 to-orange-600', border: 'border-amber-300', bg: 'bg-amber-50' },
    advanced: { label: 'Avanzado', icon: Trophy, order: 2, gradient: 'from-rose-500 to-red-600', border: 'border-rose-300', bg: 'bg-rose-50' },
}

const LEVEL_LABELS = {
    beginner: 'Principiante',
    intermediate: 'Intermedio',
    advanced: 'Avanzado',
}

// ── State config ──────────────────────────────────────────────────────────────
const STATE_CONFIG = {
    completed: { icon: CheckCircle, label: 'Completado', nodeClass: 'ring-2 ring-emerald-400 bg-white', iconColor: 'text-emerald-500' },
    in_progress: { icon: Clock, label: 'En progreso', nodeClass: 'ring-2 ring-blue-400 bg-white', iconColor: 'text-blue-500' },
    unlocked: { icon: Unlock, label: 'Desbloqueado', nodeClass: 'ring-1 ring-gray-200 bg-white', iconColor: 'text-gray-400' },
    locked: { icon: Lock, label: 'Bloqueado', nodeClass: 'ring-1 ring-gray-200 bg-gray-50', iconColor: 'text-gray-300' },
}

// ── Compute course state ──────────────────────────────────────────────────────
function getCourseState(course, roadmapData, allCourses) {
    // Check roadmap data for progress
    const progress = roadmapData?.[course.id]
    if (progress) {
        if (progress.state === 'completed') return 'completed'
        if (progress.state === 'in_progress') return 'in_progress'
    }

    // Check if prerequisites are met
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
    const isClickable = state !== 'locked'

    return (
        <button
            data-course-id={course.id}
            onClick={() => isClickable && onClick(course.id)}
            className={`
        relative w-52 rounded-xl p-4 transition-all duration-200 text-left
        ${stateConf.nodeClass}
        ${isClickable ? 'cursor-pointer hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98]' : 'cursor-not-allowed opacity-60'}
      `}
        >
            {/* State icon */}
            <div className="flex items-center justify-between mb-2">
                <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${levelConf.bg} ${levelConf.border} border`}>
                    <LevelIcon className="w-3 h-3" />
                    {levelConf.label}
                </span>
                <StateIcon className={`w-4 h-4 ${stateConf.iconColor}`} />
            </div>

            {/* Title */}
            <h3 className={`text-sm font-semibold leading-snug mb-1 ${state === 'locked' ? 'text-gray-400' : 'text-gray-800'}`}>
                {course.title}
            </h3>

            {/* State label */}
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
        // Compute on mount and resize
        const timer = setTimeout(computeArrows, 100)
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

    // Group courses by level
    const levels = ['beginner', 'intermediate', 'advanced']
    const grouped = {}
    levels.forEach(level => {
        grouped[level] = courses.filter(c => c.level === level)
    })

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
        <div ref={containerRef} className="relative py-6">
            {/* SVG arrows */}
            <ArrowLayer courses={courses} containerRef={containerRef} />

            {/* Level rows */}
            <div className="relative space-y-12" style={{ zIndex: 1 }}>
                {levels.map(level => {
                    const levelCourses = grouped[level]
                    if (levelCourses.length === 0) return null

                    return (
                        <div key={level}>
                            {/* Level header */}
                            <div className="flex items-center gap-2 mb-4">
                                <div className={`w-1 h-6 rounded-full bg-gradient-to-b ${LEVEL_CONFIG[level].gradient}`} />
                                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                                    {LEVEL_LABELS[level]}
                                </span>
                                <div className="flex-1 h-px bg-gray-100" />
                            </div>

                            {/* Course cards */}
                            <div className="flex flex-wrap gap-6 justify-center sm:justify-start pl-3">
                                {levelCourses.map(course => {
                                    const state = getCourseState(course, roadmapData, courses)
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
