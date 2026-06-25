/**
 * PublicNav — the single public navbar used across ALL public pages (landing,
 * FAQ, legal, course preview, roadmap). Keeping one navbar everywhere makes the
 * site feel like one product instead of stitched-together pages.
 *
 * - On the landing, pass `onAuth` so the auth buttons open the modal.
 * - On other pages (no onAuth), the auth buttons navigate to /login and /register.
 * - Section links point to /#anchor so they always lead back to the landing.
 */
import { Link } from 'react-router-dom'
import { ArrowRight, Menu } from 'lucide-react'
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

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2.5">
          <img src="/cirtanitido.svg" alt="CIRTA" className="h-7" />
          <span className="h-5 w-px bg-gray-300" />
          <span className="text-lg font-bold tracking-tight">EduRobotics</span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
          {SECTIONS.map((s) => (
            <a key={s.id} href={`/#${s.id}`} className="transition-colors hover:text-foreground">
              {s.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <Link to="/dashboard">
              <Button size="sm" className="gap-2">
                Ir a mi dashboard <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          ) : onAuth ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => onAuth('login')}>Iniciar sesión</Button>
              <Button size="sm" className="hidden sm:inline-flex" onClick={() => onAuth('register')}>Empezar gratis</Button>
            </>
          ) : (
            <>
              <Link to="/login"><Button variant="ghost" size="sm">Iniciar sesión</Button></Link>
              <Link to="/register"><Button size="sm" className="hidden sm:inline-flex">Empezar gratis</Button></Link>
            </>
          )}
          <button className="p-2 md:hidden" aria-label="Menú">
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  )
}

export default PublicNav
