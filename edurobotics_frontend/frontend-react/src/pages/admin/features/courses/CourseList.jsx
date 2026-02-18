/**
 * Course List Component
 * 
 * Sidebar displaying all available courses with selection functionality.
 * Shows course details and allows admins to select a course for editing.
 */

import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/ui/card'
import { Badge } from '../../../../components/ui/badge'
import { BookOpen } from 'lucide-react'

export function CourseList({ courses, selectedCourse, onCourseSelect }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Mis Cursos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {courses.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">Sin cursos aún</p>
          ) : (
            courses.map((course) => (
              <button
                key={course.id}
                onClick={() => onCourseSelect(course)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${selectedCourse?.id === course.id
                    ? 'bg-black text-white border-black'
                    : 'bg-white hover:bg-gray-50 border-gray-200'
                  }`}
              >
                <div className="font-medium text-sm">{course.title}</div>
                <Badge variant="secondary" className="mt-1 text-xs">
                  {course.level}
                </Badge>
              </button>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
