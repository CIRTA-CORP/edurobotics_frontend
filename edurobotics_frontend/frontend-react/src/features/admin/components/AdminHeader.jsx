/**
 * Admin Header Component
 *
 * Displays the admin dashboard header with glassmorphism effect,
 * view toggle (admin/student), and logout functionality.
 */

import { Button } from '@/shared/components/button'
import { Link } from 'react-router-dom'
import { Eye, Layout, LogOut, Shield, Terminal } from 'lucide-react'

export function AdminHeader({ adminView, onViewChange, onLogout, onLogoClick }) {
  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={onLogoClick}
              className="cursor-pointer hover:opacity-75 transition-opacity"
              title="Volver al inicio"
            >
              <img src="/cirtaimagen.jpg" alt="CIRTA" className="h-10 mix-blend-multiply" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-gray-900 leading-tight">EduRobotics</h1>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-white">
                  <Shield className="w-2.5 h-2.5" />
                  ADMIN
                </span>
              </div>
              <p className="text-[11px] text-gray-500 leading-tight">Gestión de cursos y módulos</p>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* View toggle */}
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => onViewChange('admin')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${adminView === 'admin'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                <Layout className="w-3.5 h-3.5" />
                Admin
              </button>
              <button
                onClick={() => onViewChange('student')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${adminView === 'student'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                <Eye className="w-3.5 h-3.5" />
                Estudiante
              </button>
              
              <div className="w-px h-6 bg-gray-200 mx-1 self-center" />
              
              <Link
                to="/simulator"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all text-purple-600 hover:bg-purple-50 hover:text-purple-700"
              >
                <Terminal className="w-3.5 h-3.5" />
                Simulador
              </Link>
            </div>

            <div className="w-px h-6 bg-gray-200" />

            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              className="text-gray-500 hover:text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
