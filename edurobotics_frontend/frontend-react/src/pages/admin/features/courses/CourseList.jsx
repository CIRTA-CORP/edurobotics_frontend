/**
 * Course List Component
 *
 * Sidebar displaying all available courses with selection functionality.
 * Shows level badges and visual selection indicator.
 */

import { Card, CardContent } from '../../../../components/ui/card'
import { BookOpen, GraduationCap, Zap, Trophy, ChevronRight } from 'lucide-react'

const LEVEL_CONFIG = {
  beginner: { label: 'Principiante', color: 'text-emerald-600 bg-emerald-50', icon: GraduationCap },
  intermediate: { label: 'Intermedio', color: 'text-amber-600 bg-amber-50', icon: Zap },
  advanced: { label: 'Avanzado', color: 'text-rose-600 bg-rose-50', icon: Trophy },
}

export function CourseList({ courses, selectedCourse, onCourseSelect }) {
  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
          <BookOpen className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900">Mis Cursos</h3>
          <p className="text-[11px] text-gray-500">{courses.length} curso{courses.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Course items */}
      <div className="space-y-2">
        {courses.length === 0 ? (
          <Card className="border-dashed border-2 border-gray-200">
            <CardContent className="py-8 text-center">
              <BookOpen className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Sin cursos aún</p>
            </CardContent>
          </Card>
        ) : (
          courses.map((course) => {
            const isSelected = selectedCourse?.id === course.id
            const level = LEVEL_CONFIG[course.level] || LEVEL_CONFIG.beginner
            const LevelIcon = level.icon

            return (
              <button
                key={course.id}
                onClick={() => onCourseSelect(course)}
                className={`w-full text-left p-3 rounded-xl border transition-all duration-200 group ${isSelected
                    ? 'bg-slate-800 text-white border-slate-700 shadow-md'
                    : 'bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium text-sm truncate ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                      {course.title}
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-white/15 text-white/80' : level.color
                        }`}>
                        <LevelIcon className="w-2.5 h-2.5" />
                        {level.label}
                      </span>
                      <span className={`text-[10px] font-mono ${isSelected ? 'text-white/50' : 'text-gray-400'}`}>
                        CR-{course.id}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 flex-shrink-0 transition-transform ${isSelected ? 'text-white/60' : 'text-gray-300 group-hover:translate-x-0.5'
                    }`} />
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
