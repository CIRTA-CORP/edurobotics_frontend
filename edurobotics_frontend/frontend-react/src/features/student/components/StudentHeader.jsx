/**
 * Student Header / Navigation Bar
 *
 * Full navigation bar with logo, nav links, user avatar, and actions.
 * Active route is highlighted. Responsive: collapses to hamburger on mobile.
 * Prepared for future links (About, Contact, Terms).
 */

import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Button } from '@/shared/components/button'
import {
  LogOut, Layout, Menu, X
} from 'lucide-react'

/* ── Navigation links ───────────────────────────── */
// NOTE: the simulator is intentionally NOT a top-level link. Students can only
// reach it from inside a course unit that the admin marked with a "Simulador 3D"
// block (see ContentViewer's "Abrir simulador" button + the /simulator guard).
const NAV_LINKS = [
  { label: 'Inicio', path: '/student' },
  { label: 'Malla', path: '/roadmap' },
]

/* ── User Avatar ────────────────────────────────── */
function UserAvatar({ user, compact = false }) {
  const initials = `${(user.first_name || '')[0] || ''}${(user.last_name || '')[0] || ''}`.toUpperCase()

  return (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white text-xs font-bold shadow-sm ring-2 ring-white">
        {initials || '?'}
      </div>
      {!compact && (
        <div className="hidden md:block text-right">
          <div className="text-sm font-medium text-gray-900 leading-tight">
            {user.first_name} {user.last_name}
          </div>
          <div className="text-[11px] text-gray-400 leading-tight">@{user.username}</div>
        </div>
      )}
    </div>
  )
}

/* ── Nav Link ───────────────────────────────────── */
function NavLink({ label, path, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`
        relative px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
        ${isActive
          ? 'text-blue-600 bg-blue-50/80'
          : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
        }
      `}
    >
      {label}
      {isActive && (
        <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-blue-600 rounded-full" />
      )}
    </button>
  )
}

/* ── Mobile Nav Link ────────────────────────────── */
function MobileNavLink({ label, path, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center px-4 py-3 text-sm font-medium transition-colors
        ${isActive
          ? 'text-blue-600 bg-blue-50 border-l-2 border-blue-600'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-l-2 border-transparent'
        }
      `}
    >
      {label}
    </button>
  )
}

/* ── Main Header Component ──────────────────────── */
export function StudentHeader({ user, hideLogout, onLogout, adminView, setAdminView }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isActive = (path) => {
    if (path === '/student') return location.pathname === '/student'
    return location.pathname.startsWith(path)
  }

  const handleNav = (path) => {
    navigate(path)
    setMobileMenuOpen(false)
  }

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/80 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">

          {/* ── Left: Logo ── */}
          <div
            className="flex items-center gap-2.5 cursor-pointer select-none"
            onClick={() => handleNav('/student')}
          >
            <img src="/cirtanitido.svg" alt="CIRTA" className="h-8" />
            <div className="hidden sm:block">
              <h1 className="text-base font-bold text-gray-900 leading-tight">EduRobotics</h1>
              <p className="text-[10px] text-gray-400 leading-tight tracking-wide">Plataforma de cursos</p>
            </div>
          </div>

          {/* ── Center: Nav Links (desktop) ── */}
          <nav className="hidden sm:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.path}
                {...link}
                isActive={isActive(link.path)}
                onClick={() => handleNav(link.path)}
              />
            ))}
          </nav>

          {/* ── Right: Actions ── */}
          <div className="flex items-center gap-2">
            {/* Admin toggle (when embedded in admin view) */}
            {adminView && setAdminView && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAdminView('admin')}
                className="hidden sm:inline-flex text-xs"
              >
                <Layout className="w-3.5 h-3.5 mr-1.5" />
                Admin
              </Button>
            )}

            {/* User avatar — click to open profile */}
            <div
              onClick={() => handleNav('/profile')}
              className="cursor-pointer hover:opacity-80 transition-opacity"
              title="Mi Perfil"
            >
              <UserAvatar user={user} />
            </div>

            {/* Logout (desktop) */}
            {!hideLogout && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onLogout}
                className="hidden sm:inline-flex text-gray-400 hover:text-red-600 hover:bg-red-50"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile dropdown menu ── */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-gray-100 bg-white/95 backdrop-blur-md animate-in slide-in-from-top-2 duration-200">
          <nav className="py-2">
            {NAV_LINKS.map((link) => (
              <MobileNavLink
                key={link.path}
                {...link}
                isActive={isActive(link.path)}
                onClick={() => handleNav(link.path)}
              />
            ))}
          </nav>

          {/* Mobile: admin + logout */}
          <div className="border-t border-gray-100 px-4 py-3 flex items-center gap-2">
            {adminView && setAdminView && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setAdminView('admin'); setMobileMenuOpen(false) }}
                className="flex-1 text-xs"
              >
                <Layout className="w-3.5 h-3.5 mr-1.5" />
                Admin
              </Button>
            )}
            {!hideLogout && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { onLogout(); setMobileMenuOpen(false) }}
                className="text-red-500 hover:bg-red-50 flex-1"
              >
                <LogOut className="w-4 h-4 mr-1.5" />
                Cerrar sesión
              </Button>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
