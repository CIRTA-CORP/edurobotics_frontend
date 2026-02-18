/**
 * Course Grid Component
 * 
 * Responsive grid displaying course cards with details and navigation.
 * Shows empty state when no courses are available.
 */

import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { BookOpen, ArrowRight, Check } from 'lucide-react'

export function CourseGrid({ courses, onCourseClick }) {
  if (courses.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Aún no tienes cursos activos.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.map((course) => {
        const summary = course.roadmapSummary || null
        const state = summary ? summary.state : 'no_data'
        const percentage = summary ? summary.percentage : null
        const code = `CR-${course.id}`
        const completed = state === 'completed'

        return (
          <article
            key={course.id}
            aria-labelledby={`course-${course.id}-title`}
            className={`transform transition duration-200 ease-out hover:scale-[1.02] hover:-translate-y-1 hover:shadow-2xl rounded-lg focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-300 bg-white border`}
          >
            <Card className="border-none shadow-none bg-transparent">
              <CardHeader>
                <div className="flex items-center justify-between mb-2 px-4 pt-4">
                  <div className="flex items-center gap-2">
                    <div id={`course-${course.id}-title`} className="text-sm font-semibold text-gray-900">{course.title}</div>
                    {state === 'completed' && (
                      <Check className="w-4 h-4 text-green-600" aria-hidden="true" />
                    )}
                  </div>
                  <div className="text-xs text-gray-400">{code}</div>
                </div>
              </CardHeader>
              <CardContent className="flex items-center justify-between px-4 pb-4">
                <div>
                  <div className={`text-sm ${completed ? 'text-green-700' : 'text-gray-600'}`}>
                    {state === 'completed' ? 'Completado' : state === 'in_progress' ? 'En progreso' : state === 'not_started' ? 'No iniciado' : '—'}
                  </div>
                  {percentage !== null && (
                    <div className="text-xs text-gray-500 mt-1">{percentage}%</div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    className="ml-4"
                    onClick={() => onCourseClick(course.id)}
                    aria-label={`Continuar curso ${course.title}`}
                  >
                    Continuar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </article>
        )
      })}
    </div>
  )
}
