/**
 * Student Header Component
 *
 * Sticky header with logo, user avatar with initials, and action buttons.
 * Logout button can be conditionally hidden when embedded in admin view.
 */

import { useNavigate } from 'react-router-dom'
import { Button } from '../../../components/ui/button'
import { LogOut, Layout, Map } from 'lucide-react'

function UserAvatar({ user }) {
  const initials = `${(user.first_name || '')[0] || ''}${(user.last_name || '')[0] || ''}`.toUpperCase()

  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
        {initials || '?'}
      </div>
      <div className="hidden sm:block">
        <div className="text-sm font-medium text-gray-900">{user.first_name} {user.last_name}</div>
        <div className="text-xs text-gray-500">@{user.username}</div>
      </div>
    </div>
  )
}

export function StudentHeader({ user, hideLogout, onLogout, adminView, setAdminView }) {
  const navigate = useNavigate()

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img src="/cirtaimagen.jpg" alt="CIRTA" className="h-10 mix-blend-multiply" />
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">EduRobotics</h1>
              <p className="text-[11px] text-gray-500 leading-tight">Plataforma de cursos</p>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {adminView && setAdminView && (
              <Button variant="outline" size="sm" onClick={() => setAdminView('admin')}>
                <Layout className="w-4 h-4 mr-2" />
                Volver a Admin
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/roadmap')}
              className="text-gray-500 hover:text-blue-600 hover:bg-blue-50"
              title="Malla de cursos"
            >
              <Map className="w-4 h-4" />
              <span className="hidden sm:inline ml-1.5 text-xs">Malla</span>
            </Button>

            <UserAvatar user={user} />

            {!hideLogout && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onLogout}
                className="text-gray-500 hover:text-red-600 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

