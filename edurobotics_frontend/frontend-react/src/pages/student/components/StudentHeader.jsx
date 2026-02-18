/**
 * Student Header Component
 * 
 * Header for the student dashboard with logo, user greeting, and logout.
 * Logout button can be conditionally hidden when embedded in admin view.
 */

import { Button } from '../../../components/ui/button'
import { LogOut, Layout } from 'lucide-react'

export function StudentHeader({ user, hideLogout, onLogout, adminView, setAdminView }) {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/cirtaimagen.jpg" alt="CIRTA" className="h-12 mix-blend-multiply" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">EduRobotics</h1>
              <p className="text-xs text-gray-600">Plataforma de cursos</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-700">
              Hola, <span className="font-medium">{user.first_name}</span>
            </span>
            {adminView && setAdminView && (
              <Button variant="outline" size="sm" onClick={() => setAdminView('admin')}>
                <Layout className="w-4 h-4 mr-2" />
                Volver a Admin
              </Button>
            )}
            {!hideLogout && (
              <Button variant="outline" size="sm" onClick={onLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar sesión
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
