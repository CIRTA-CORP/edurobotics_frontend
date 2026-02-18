/**
 * Admin Header Component
 * 
 * Displays the admin dashboard header with view toggle and logout functionality.
 * Includes logo, app title, and navigation between admin/student views.
 */

import { Button } from '../../../components/ui/button'
import { Eye, Layout, LogOut } from 'lucide-react'

export function AdminHeader({ adminView, onViewChange, onLogout, onLogoClick }) {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={onLogoClick}
              className="cursor-pointer hover:opacity-75 transition-opacity"
              title="Volver al inicio"
            >
              <img src="/cirtaimagen.jpg" alt="CIRTA" className="h-12 mix-blend-multiply" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Panel Admin</h1>
              <p className="text-sm text-gray-600">Gestión de cursos y módulos</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">Vista:</span>
            <div className="flex gap-2">
              <Button
                variant={adminView === 'student' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onViewChange('student')}
              >
                <Eye className="w-4 h-4 mr-2" />
                Estudiante
              </Button>
              <Button
                variant={adminView === 'admin' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onViewChange('admin')}
              >
                <Layout className="w-4 h-4 mr-2" />
                Admin
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={onLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Salir
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
