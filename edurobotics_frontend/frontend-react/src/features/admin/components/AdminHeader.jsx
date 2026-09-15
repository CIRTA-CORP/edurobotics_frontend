/**
 * Admin Header Component
 *
 * The panel bar: identity on the left, the admin/student segmented control and
 * the standing shortcuts on the right. Every control keeps the job it had —
 * what changed is that the view toggle is a real segmented control and the
 * shortcuts are quiet icons instead of coloured buttons.
 *
 * Responsive: labels drop on narrow screens so nothing overflows.
 */

import { Link } from 'react-router-dom'
import { Home, LogOut, Terminal } from 'lucide-react'
import { useAdmin } from '@/features/admin/context/AdminContext'

function IconAction({ to, onClick, title, children }) {
  const className =
    'grid h-8 w-8 place-items-center rounded-lg text-[#8b8a95] transition-colors hover:bg-[#f4f3f8] hover:text-[#16151b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4b46d6]'
  if (to) {
    return (
      <Link to={to} title={title} aria-label={title} className={className}>
        {children}
      </Link>
    )
  }
  return (
    <button onClick={onClick} title={title} aria-label={title} className={className}>
      {children}
    </button>
  )
}

export function AdminHeader({ adminView, onViewChange, onLogout, onLogoClick, initials = '' }) {
  const { isTeacher } = useAdmin()

  const segment = (active) =>
    `grid h-[30px] place-items-center rounded-lg px-3.5 text-[12.5px] font-semibold transition-colors ${
      active ? 'bg-white text-[#16151b] shadow-sm' : 'text-[#8b8a95] hover:text-[#16151b]'
    }`

  return (
    <header className="sticky top-0 z-50 flex h-14 flex-shrink-0 items-center justify-between border-b border-[#ececf1] bg-white px-4 sm:px-[18px]">
      <div className="flex min-w-0 items-center gap-3.5">
        <Link
          to="/"
          onClick={onLogoClick}
          title="Ir a la página principal"
          className="flex items-center gap-2.5 transition-opacity hover:opacity-75"
        >
          <img src="/cirtanitido.svg" alt="CIRTA" className="h-7" />
          <span className="hidden text-[14.5px] font-semibold tracking-[-0.01em] text-[#16151b] sm:inline">
            EduRobotics
          </span>
        </Link>
        <span className="rounded-full bg-[#16151b] px-2.5 py-[3px] font-mono text-[9.5px] font-bold tracking-[0.08em] text-white">
          {isTeacher ? 'PROFESOR' : 'ADMIN'}
        </span>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Teachers get their own panel, so the toggle is admin-only. */}
        {!isTeacher && (
          <div className="flex items-center gap-[3px] rounded-[10px] bg-[#f4f3f8] p-[3px]">
            <button onClick={() => onViewChange('admin')} className={segment(adminView === 'admin')}>
              <span className="hidden sm:inline">Vista admin</span>
              <span className="sm:hidden">Admin</span>
            </button>
            <button onClick={() => onViewChange('student')} className={segment(adminView === 'student')}>
              <span className="hidden sm:inline">Vista estudiante</span>
              <span className="sm:hidden">Alumno</span>
            </button>
          </div>
        )}

        <div className="hidden h-5 w-px bg-[#ececf1] sm:block" />

        <IconAction to="/simulator" title="Simulador">
          <Terminal className="h-[17px] w-[17px]" />
        </IconAction>
        <IconAction to="/" title="Ir a la página principal">
          <Home className="h-[17px] w-[17px]" />
        </IconAction>

        {initials && (
          <div className="grid h-7 w-7 place-items-center rounded-full bg-[#16151b] text-[10.5px] font-bold text-white">
            {initials}
          </div>
        )}

        <IconAction onClick={onLogout} title="Cerrar sesión">
          <LogOut className="h-[17px] w-[17px]" />
        </IconAction>
      </div>
    </header>
  )
}
