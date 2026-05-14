/**
 * Course Header Component
 * 
 * Header for course detail page with course info and student details.
 * Includes back button to return to the dashboard.
 */

import { Button } from '@/shared/components/button'
import { Badge } from '@/shared/components/badge'
import { ArrowLeft } from 'lucide-react'

export function CourseHeader({ course, user, onBack }) {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a cursos
        </Button>

        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline">{course.level}</Badge>
              <span className="text-sm text-gray-500">Versión {course.version}</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{course.title}</h1>
            <p className="text-gray-600">
              {course.description || 'Curso sin descripción.'}
            </p>
          </div>
          {user && (
            <div className="text-right">
              <p className="text-sm text-gray-500">Estudiante</p>
              <p className="font-medium text-gray-900">{user.first_name} {user.last_name}</p>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
