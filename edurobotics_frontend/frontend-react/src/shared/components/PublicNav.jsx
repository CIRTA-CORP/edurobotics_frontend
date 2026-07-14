/**
 * PublicNav — the single public navbar used across ALL public pages (landing,
 * FAQ, legal, course preview, roadmap). Keeping one navbar everywhere makes the
 * site feel like one product instead of stitched-together pages.
 *
 * - On the landing, pass `onAuth` so the auth buttons open the modal.
 * - On other pages (no onAuth), the auth buttons navigate to /login and /register.
 * - Section links point to /#anchor so they always lead back to the landing.
 * - Below `md`, everything collapses into a working hamburger menu.
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Menu, X } from 'lucide-react'
import { Button } from '@/shared/components/button'
import { getStoredUser } from '@/features/auth/services/auth'

const SECTIONS = [
  { id: 'simulador', label: 'Simulador' },
  { id: 'cursos', label: 'Cursos' },
  { id: 'como-funciona', label: 'Cómo funciona' },
  { id: 'universidades', label: 'Universidades' },
]

export function PublicNav({ onAuth }) {
  const user = getStoredUser()
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  // Auth actions, reused in the desktop bar and the mobile menu.
  // `full` makes buttons stretch full width (mobile menu).
  const renderAuth = (full = false) => {
    const cls = full ? 'w-full justify-center' : ''
    if (user) {
      return (
        <Link to="/dashboard" onClick={close} className={full ? 'w-full' : ''}>
          <Button size="sm" className={`gap-2 ${cls}`}>Ir a mi dashboard <ArrowRight className="h-4 w-4" /></Button>
        </Link>
      )
    }
    if (onAuth) {
      return (
        <>
          <Button variant="ghost" size="sm" className={cls} onClick={() => { onAuth('login'); close() }}>Iniciar sesión</Button>
          <Button size="sm" className={cls} onClick={() => { onAuth('register'); close() }}>Empezar gratis</Button>
        </>
      )
    }
    return (
      <>
        <Link to="/login" onClick={close} className={full ? 'w-full' : ''}><Button variant="ghost" size="sm" className={cls}>Iniciar sesión</Button></Link>
        <Link to="/register" onClick={close} className={full ? 'w-full' : ''}><Button size="sm" className={cls}>Empezar gratis</Button></Link>
      </>
    )
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2.5" onClick={close}>
          <img src="/cirtanitido.svg" alt="CIRTA" className="h-7" />
          <span className="h-5 w-px bg-gray-300" />
          <span className="text-lg font-bold tracking-tight">EduRobotics</span>
        </Link>

        {/* Desktop: section links */}
        <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
          {SECTIONS.map((s) => (
            <a key={s.id} href={`/#${s.id}`} className="transition-colors hover:text-foreground">
              {s.label}
            </a>
          ))}
        </nav>

        {/* Desktop: auth buttons */}
        <div className="hidden items-center gap-2 md:flex">
          {renderAuth()}
        </div>

        {/* Mobile: hamburger */}
        <button
          className="p-2 md:hidden"
          aria-label="Menú"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile: dropdown panel */}
      {open && (
        <div className="border-t border-gray-100 bg-white md:hidden">
          <nav className="flex flex-col px-4 py-2">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`/#${s.id}`}
                onClick={close}
                className="rounded-lg px-2 py-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-foreground"
              >
                {s.label}
              </a>
            ))}
          </nav>
          <div className="flex flex-col gap-2 border-t border-gray-100 px-4 py-3">
            {renderAuth(true)}
          </div>
        </div>
      )}
    </header>
  )
}

export default PublicNav
