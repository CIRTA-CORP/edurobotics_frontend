import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Bot, Blocks, Code2, Play, ArrowRight, GraduationCap,
  Building2, BookOpen, Cpu, CheckCircle2, Menu,
} from 'lucide-react'
import { Button } from '@/shared/components/button'
import { Card, CardContent } from '@/shared/components/card'
import { Badge } from '@/shared/components/badge'
import { getCourses } from '@/features/courses/services/courses'
import { getStoredUser } from '@/features/auth/services/auth'
import { AuthModal } from '@/features/auth/components/AuthModal'
import { getLandingContent } from '@/features/landing/services/landing'
import { mergeLandingContent } from '@/features/landing/landingContent'

/**
 * LandingPage — Página pública de marketing (ruta "/").
 *
 * Primer borrador inspirado en la academia de midudev, adaptado al
 * diferenciador de EduRobotics: el simulador de robótica 3D en el navegador.
 *
 * Reutiliza el sistema de diseño existente (Tailwind + shadcn/ui, paleta slate).
 * Los textos, números y placeholders son de muestra: ajústalos a la realidad.
 */

// ─────────────────────────────────────────────────────────────
// Nav
// ─────────────────────────────────────────────────────────────
function LandingNav({ onAuth, user }) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2.5">
          <img src="/cirtanitido.svg" alt="CIRTA" className="h-7" />
          <span className="h-5 w-px bg-gray-300" />
          <span className="text-lg font-bold tracking-tight">EduRobotics</span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
          <a href="#simulador" className="transition-colors hover:text-foreground">Simulador</a>
          <a href="#cursos" className="transition-colors hover:text-foreground">Cursos</a>
          <a href="#como-funciona" className="transition-colors hover:text-foreground">Cómo funciona</a>
          <a href="#universidades" className="transition-colors hover:text-foreground">Universidades</a>
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <Link to="/dashboard">
              <Button size="sm" className="gap-2">
                Ir a mi dashboard <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => onAuth('login')}>
                Iniciar sesión
              </Button>
              <Button size="sm" className="hidden sm:inline-flex" onClick={() => onAuth('register')}>
                Empezar gratis
              </Button>
            </>
          )}
          <button className="md:hidden p-2" aria-label="Menú">
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  )
}

// ─────────────────────────────────────────────────────────────
// Hero
// ─────────────────────────────────────────────────────────────
function Hero({ onAuth, user, data }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 lg:grid-cols-2 lg:py-28">
        <div>
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <Badge className="inline-flex items-center gap-1.5 bg-slate-900 text-white">
              {data.badge}
            </Badge>
            <Badge className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-700">
              100% Gratis
            </Badge>
          </div>
          <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            {data.title}
          </h1>
          <p className="mt-6 max-w-lg text-lg text-muted-foreground">
            {data.subtitle}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {user ? (
              <Link to="/dashboard">
                <Button size="lg" className="w-full gap-2 sm:w-auto">
                  Ir a mi dashboard <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Button size="lg" className="w-full gap-2 sm:w-auto" onClick={() => onAuth('register')}>
                Empezar gratis <ArrowRight className="h-4 w-4" />
              </Button>
            )}
            <a href="#simulador">
              <Button size="lg" variant="outline" className="w-full gap-2 sm:w-auto">
                <Play className="h-4 w-4" /> Ver el simulador
              </Button>
            </a>
          </div>
        </div>

        {/* Imagen del hero: la subida por la directora, o el mockup ilustrativo */}
        {data.imageUrl ? (
          <img
            src={data.imageUrl}
            alt="EduRobotics"
            className="w-full rounded-xl border border-gray-200 shadow-2xl"
          />
        ) : (
          <SimulatorMockup />
        )}
      </div>
    </section>
  )
}

function SimulatorMockup() {
  return (
    <div className="relative">
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl">
        {/* Barra de ventana */}
        <div className="flex items-center gap-1.5 border-b border-gray-200 bg-gray-50 px-4 py-3">
          <span className="h-3 w-3 rounded-full bg-red-400" />
          <span className="h-3 w-3 rounded-full bg-yellow-400" />
          <span className="h-3 w-3 rounded-full bg-green-400" />
          <span className="ml-3 text-xs text-muted-foreground">edurobotics.cl/simulator</span>
        </div>
        {/* Cuerpo: editor de bloques + escena 3D */}
        <div className="grid grid-cols-5">
          <div className="col-span-2 space-y-2 border-r border-gray-200 bg-slate-50 p-4">
            <div className="rounded-md bg-blue-500 px-3 py-2 text-xs font-medium text-white shadow-sm">
              ▸ mover articulación 1
            </div>
            <div className="ml-3 rounded-md bg-emerald-500 px-3 py-2 text-xs font-medium text-white shadow-sm">
              ▸ esperar 1s
            </div>
            <div className="rounded-md bg-amber-500 px-3 py-2 text-xs font-medium text-white shadow-sm">
              ▸ cerrar gripper
            </div>
            <div className="ml-3 rounded-md bg-purple-500 px-3 py-2 text-xs font-medium text-white shadow-sm">
              ▸ repetir x3
            </div>
          </div>
          <div className="col-span-3 flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 p-8">
            <Bot className="h-28 w-28 text-blue-400" strokeWidth={1.2} />
          </div>
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        Vista previa ilustrativa · reemplazar por captura real del simulador
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Banda de estadísticas
// ─────────────────────────────────────────────────────────────
function Stats() {
  const stats = [
    { value: 'UR5', label: 'Robot industrial simulado' },
    { value: '3D', label: 'Visor en el navegador' },
    { value: '0', label: 'Instalaciones necesarias' },
    { value: '2', label: 'Modos: bloques y código' },
  ]
  return (
    <section className="border-y border-gray-200 bg-white">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 py-12 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <div className="text-3xl font-bold tracking-tight sm:text-4xl">{s.value}</div>
            <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────
// Sección estrella: el simulador
// ─────────────────────────────────────────────────────────────
function SimulatorSection({ data }) {
  const features = [
    { icon: Blocks, title: 'Programación por bloques', text: 'Arrastra bloques tipo Scratch para construir la lógica del robot. Ideal para empezar sin saber programar.' },
    { icon: Code2, title: 'Editor de código', text: 'Pasa a código real cuando estés listo. Los bloques se sincronizan con el editor automáticamente.' },
    { icon: Cpu, title: 'Ejecución en vivo', text: 'Tu programa corre y el robot 3D se mueve al instante. Ves el resultado de cada cambio en tiempo real.' },
  ]
  return (
    <section id="simulador" className="bg-gradient-to-b from-white to-gray-50 py-20 lg:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="secondary" className="mb-4">Lo que nos distingue</Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {data.title}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {data.subtitle}
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title} className="border-gray-200 transition-shadow hover:shadow-lg">
              <CardContent className="pt-6">
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────
// Tarjeta de curso estilo midu: imagen full-bleed, info superpuesta,
// descripción + CTA que se revelan al pasar el mouse.
// ─────────────────────────────────────────────────────────────
function CourseCard({ title, level, description, imageUrl }) {
  return (
    <Link
      to="/register"
      className="group relative block aspect-[4/3] overflow-hidden rounded-2xl border border-gray-200 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={title}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-900">
          <BookOpen className="h-12 w-12 text-blue-300" strokeWidth={1.5} />
        </div>
      )}

      {/* Gradient scrim */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

      {/* Level badge */}
      <div className="absolute inset-x-0 top-0 p-3">
        <span className="inline-flex items-center rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium capitalize text-gray-800 shadow-sm backdrop-blur-sm">
          {level}
        </span>
      </div>

      {/* Bottom: title always, description + CTA on hover */}
      <div className="absolute inset-x-0 bottom-0 p-4">
        <h3 className="text-lg font-bold leading-tight text-white line-clamp-2 drop-shadow-md">
          {title}
        </h3>
        <div className="max-h-0 overflow-hidden opacity-0 transition-all duration-300 ease-out group-hover:mt-2 group-hover:max-h-40 group-hover:opacity-100">
          <p className="mb-3 line-clamp-2 text-sm text-white/80">{description}</p>
          <span className="flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-sm">
            Ver curso <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  )
}

// ─────────────────────────────────────────────────────────────
// Catálogo de cursos (datos reales si el backend está disponible)
// ─────────────────────────────────────────────────────────────
function CoursesPreview({ data }) {
  const { data: coursesResp } = useQuery({
    queryKey: ['public-courses'],
    queryFn: getCourses,
    staleTime: 60_000,
    retry: false,
  })
  const courses = (Array.isArray(coursesResp) ? coursesResp : coursesResp?.courses || []).slice(0, 6)

  return (
    <section id="cursos" className="py-20 lg:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="secondary" className="mb-4">Catálogo</Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{data.title}</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {data.subtitle}
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.length > 0 ? (
            courses.map((c) => (
              <CourseCard
                key={c.id}
                title={c.title}
                level={c.level || 'beginner'}
                description={c.description || 'Curso interactivo de robótica con simulador integrado.'}
                imageUrl={c.image_url}
              />
            ))
          ) : (
            // Placeholders cuando no hay backend / aún no hay cursos publicados
            ['Fundamentos de Robótica', 'Programación con Bloques', 'Manipulación con UR5'].map((title, i) => (
              <CourseCard
                key={i}
                title={title}
                level="beginner"
                description="Curso interactivo de robótica con simulador integrado."
              />
            ))
          )}
        </div>

        <div className="mt-12 text-center">
          <Link to="/register">
            <Button size="lg" variant="outline" className="gap-2">
              Ver todos los cursos <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────
// Cómo funciona (3 pasos)
// ─────────────────────────────────────────────────────────────
function HowItWorks({ data }) {
  const steps = [
    { n: '1', title: 'Elige un curso', text: 'Selecciona un curso según tu nivel y avanza por módulos y unidades.' },
    { n: '2', title: 'Programa el robot', text: 'Usa bloques visuales o escribe código para definir el comportamiento del robot.' },
    { n: '3', title: 'Ejecuta y aprende', text: 'Corre tu programa y observa al robot 3D moverse. Itera y mejora al instante.' },
  ]
  return (
    <section id="como-funciona" className="bg-slate-900 py-20 text-white lg:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <Badge className="mb-4 bg-white/10 text-white">Cómo funciona</Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{data.title}</h2>
        </div>
        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-lg font-bold">
                {s.n}
              </div>
              <h3 className="mt-5 text-xl font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-white/70">{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────
// Para quién (estudiantes / universidades)
// ─────────────────────────────────────────────────────────────
function ForWho() {
  const audiences = [
    {
      icon: GraduationCap,
      title: 'Para estudiantes',
      points: ['Aprende a tu ritmo', 'Sin hardware costoso', 'Del bloque al código real'],
    },
    {
      icon: Building2,
      title: 'Para universidades',
      points: ['Plataforma lista para tu curso', 'Seguimiento del progreso', 'Programa piloto disponible'],
    },
  ]
  return (
    <section id="universidades" className="py-20 lg:py-28">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 md:grid-cols-2">
        {audiences.map((a) => (
          <Card key={a.title} className="border-gray-200">
            <CardContent className="pt-6">
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-slate-900 text-white">
                <a.icon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold">{a.title}</h3>
              <ul className="mt-4 space-y-2">
                {a.points.map((p) => (
                  <li key={p} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-blue-600" /> {p}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────
// CTA final
// ─────────────────────────────────────────────────────────────
function FinalCTA({ onAuth, user, data }) {
  return (
    <section className="bg-gradient-to-b from-gray-50 to-white py-20 lg:py-28">
      <div className="mx-auto max-w-3xl px-4 text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {data.title}
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          {user
            ? 'Continúa donde lo dejaste y sigue avanzando en tus cursos.'
            : data.subtitle}
        </p>
        <div className="mt-8 flex justify-center">
          {user ? (
            <Link to="/dashboard">
              <Button size="lg" className="gap-2">
                Ir a mi dashboard <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <Button size="lg" className="gap-2" onClick={() => onAuth('register')}>
              Crear cuenta gratis <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────
// Footer
// ─────────────────────────────────────────────────────────────
function LandingFooter() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-10 sm:flex-row">
        <div className="flex items-center gap-2">
          <img src="/cirtanitido.svg" alt="CIRTA" className="h-6" />
          <span className="font-semibold">EduRobotics</span>
        </div>
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} CIRTA CORP · Plataforma educativa de robótica
        </p>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <Link to="/login" className="hover:text-foreground">Iniciar sesión</Link>
          <Link to="/register" className="hover:text-foreground">Registro</Link>
        </div>
      </div>
    </footer>
  )
}

// ─────────────────────────────────────────────────────────────
export default function LandingPage() {
  // null = cerrado; 'login' o 'register' = modal abierto en esa vista
  const [authView, setAuthView] = useState(null)
  const openAuth = (view) => setAuthView(view)
  const closeAuth = () => setAuthView(null)

  // Si el usuario ya tiene sesión, los CTA lo llevan a su dashboard
  const user = getStoredUser()

  // Contenido editable de la landing (lo gestiona la directora desde el admin)
  const { data: stored } = useQuery({
    queryKey: ['landing-content'],
    queryFn: getLandingContent,
    staleTime: 60_000,
    retry: false,
  })
  const content = mergeLandingContent(stored)

  return (
    <div className="min-h-screen bg-white text-foreground">
      <LandingNav onAuth={openAuth} user={user} />
      <main>
        {content.hero.visible && <Hero onAuth={openAuth} user={user} data={content.hero} />}
        {content.stats.visible && <Stats />}
        {content.simulator.visible && <SimulatorSection data={content.simulator} />}
        {content.courses.visible && <CoursesPreview data={content.courses} />}
        {content.howItWorks.visible && <HowItWorks data={content.howItWorks} />}
        {content.forWho.visible && <ForWho />}
        {content.finalCta.visible && <FinalCTA onAuth={openAuth} user={user} data={content.finalCta} />}
      </main>
      <LandingFooter />

      <AuthModal
        isOpen={authView !== null}
        onClose={closeAuth}
        initialView={authView || 'login'}
      />
    </div>
  )
}
