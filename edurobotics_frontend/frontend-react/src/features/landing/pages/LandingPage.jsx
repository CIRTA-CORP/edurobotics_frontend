// Public landing page. Its sections (hero, stats, simulator, etc.) and their
// texts/visibility are admin-editable via the Landing tab; this renders whatever
// the landing config returns, falling back to defaults when unset.
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Bot, Blocks, Code2, Play, ArrowRight, GraduationCap,
  Building2, BookOpen, Cpu, CheckCircle2, ChevronDown,
} from 'lucide-react'
import { Button } from '@/shared/components/button'
import { PublicNav } from '@/shared/components/PublicNav'
import { HeroBand } from '@/shared/components/HeroBand'
import { getCourses } from '@/features/courses/services/courses'
import { getStoredUser } from '@/features/auth/services/auth'
import { AuthModal } from '@/features/auth/components/AuthModal'
import { getLandingContent } from '@/features/landing/services/landing'
import { mergeLandingContent } from '@/features/landing/landingContent'
import { levelOf } from '@/shared/lib/courseLevel'

/**
 * LandingPage — Página pública de marketing (ruta "/").
 *
 * El diseño descansa en un cambio de fondo: la banda oscura de la marca abre y
 * cierra la página (hero y CTA final) y todo lo del medio es blanco separado por
 * filetes. Antes la banda estaba enterrada al medio, en "Cómo funciona", y las
 * secciones se separaban con degradados apilados.
 *
 * Los textos y la visibilidad de cada sección los edita la directora desde el
 * panel admin; aquí sólo se renderiza lo que devuelve la configuración.
 */

// ─────────────────────────────────────────────────────────────
// Hero
// ─────────────────────────────────────────────────────────────

// Renders a title where words wrapped in *asterisks* get a highlighted chip.
// Editable from the CMS (the director moves the *). On the dark band the chip is
// a glass outline, not a colour — the page has one accent and this isn't it.
function renderHeroTitle(title) {
  const parts = (title || '').split(/(\*[^*]+\*)/g)
  return parts.map((part, i) => {
    if (part.length > 2 && part.startsWith('*') && part.endsWith('*')) {
      return (
        <span
          key={i}
          className="mx-1 inline-block rounded-2xl border border-white/25 bg-white/[0.08] px-3 py-0.5"
        >
          {part.slice(1, -1)}
        </span>
      )
    }
    return <span key={i}>{part}</span>
  })
}

/**
 * Hero — now the brand band itself.
 *
 * The dark band used to be buried mid-page under "Cómo funciona"; it opens and
 * closes the landing instead, and everything between is white with hairlines.
 */
function Hero({ onAuth, user, data, loading }) {
  return (
    <HeroBand className="on-brand-band">
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 py-20 lg:grid-cols-2 lg:py-24">
        <div>
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <span className="inline-flex h-7 items-center rounded-full border border-white/15 bg-white/10 px-3 text-[11.5px] font-semibold text-white">
              {data.badge}
            </span>
            <span className="inline-flex h-7 items-center rounded-full bg-emerald-400/[0.16] px-3 text-[11.5px] font-semibold text-emerald-300">
              100% gratis
            </span>
          </div>
          <h1 className="text-4xl font-bold leading-[1.06] tracking-tight text-white sm:text-5xl lg:text-[54px]">
            {renderHeroTitle(data.title)}
          </h1>
          <p className="mt-6 max-w-lg text-[17px] leading-relaxed text-white/60">
            {data.subtitle}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {user ? (
              <Link to="/dashboard">
                <Button size="lg" variant="onBrand" className="w-full gap-2 sm:w-auto">
                  Ir a mi dashboard <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Button size="lg" variant="onBrand" className="w-full gap-2 sm:w-auto" onClick={() => onAuth('register')}>
                Empezar gratis <ArrowRight className="h-4 w-4" />
              </Button>
            )}
            <a href="#simulador">
              <Button
                size="lg"
                className="w-full gap-2 border border-white/25 bg-transparent text-white hover:bg-white/10 sm:w-auto"
              >
                <Play className="h-4 w-4" /> Ver el simulador
              </Button>
            </a>
          </div>
        </div>

        {/* Panel del simulador; su vista 3D usa la foto subida por la directora */}
        <SimulatorMockup imageUrl={data.imageUrl} loading={loading} />
      </div>
    </HeroBand>
  )
}

/**
 * SimulatorMockup — the product running in a browser tab.
 *
 * The chrome earns its place: "sin instalar nada" is the promise, and the URL
 * is what proves it. The window dots stay neutral instead of the toy-coloured
 * traffic lights. Below it, the two real modes, switchable.
 */
function SimulatorMockup({ imageUrl, loading }) {
  const [mode, setMode] = useState('blocks')

  const blocks = [
    { label: 'mover articulación 1 a 90°', indent: false },
    { label: 'esperar 1 s', indent: true },
    { label: 'cerrar gripper', indent: false },
    { label: 'repetir x3', indent: true },
  ]

  const tab = (active) =>
    `h-7 rounded-lg px-3 text-[12px] font-semibold transition-colors ${
      active ? 'bg-white/[0.14] text-white' : 'text-white/50 hover:text-white/80'
    }`

  return (
    <div className="overflow-hidden rounded-[18px] border border-white/[0.14] bg-[#111114] shadow-2xl">
      {/* Browser chrome: the address is the proof that nothing gets installed */}
      <div className="flex h-9 items-center gap-3 border-b border-white/[0.07] px-3.5">
        <div className="flex flex-shrink-0 items-center gap-[5px]" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-white/[0.16]" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/[0.16]" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/[0.16]" />
        </div>
        <div className="flex h-[22px] min-w-0 flex-1 items-center justify-center rounded-md bg-white/[0.05] px-3">
          <span className="truncate font-mono text-[10.5px] text-white/40">
            www.edurobotics.cl/simulator
          </span>
        </div>
      </div>

      {/* Toolbar: the two modes, the robot, and the run affordance */}
      <div className="flex h-[46px] items-center justify-between border-b border-white/[0.09] px-3.5">
        <div className="flex items-center gap-0.5 rounded-[9px] bg-white/[0.07] p-[3px]">
          <button onClick={() => setMode('blocks')} className={tab(mode === 'blocks')}>Bloques</button>
          <button onClick={() => setMode('code')} className={tab(mode === 'code')}>Código</button>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-[10.5px] text-white/40">UR5</span>
          <span className="inline-flex h-7 items-center gap-1.5 rounded-lg bg-emerald-400/[0.16] px-3 text-[11.5px] font-semibold text-emerald-300">
            <Play className="h-2.5 w-2.5 fill-current" />
            Ejecutar
          </span>
        </div>
      </div>

      <div className="grid min-h-[296px] grid-cols-[170px_minmax(0,1fr)] sm:grid-cols-[200px_minmax(0,1fr)]">
        <div className="border-r border-white/[0.09] p-3.5">
          {mode === 'blocks' ? (
            <div className="flex flex-col gap-2">
              {blocks.map((b, i) => (
                <div
                  key={b.label}
                  className={`flex h-8 items-center rounded-lg px-3 text-[12px] font-semibold text-white ${b.indent ? 'ml-4' : ''}`}
                  style={{ background: ['#4b46d6', '#6b66e0', '#8e8ae8', '#a5a1ee'][i] }}
                >
                  {b.label}
                </div>
              ))}
            </div>
          ) : (
            <div className="font-mono text-[11px] leading-[1.95] text-white/75">
              <div><span className="text-[#a5a1ee]">robot</span>.move_j(<span className="text-emerald-300">90</span>, <span className="text-emerald-300">-45</span>)</div>
              <div><span className="text-[#a5a1ee]">wait</span>(<span className="text-emerald-300">1.0</span>)</div>
              <div><span className="text-[#a5a1ee]">gripper</span>.close()</div>
              <div className="text-white/40"># repetir x3</div>
            </div>
          )}
        </div>

        <div className="bg-[#0a0a0c]">
          {loading ? (
            // Mientras llega el contenido del backend, no mostramos el robot
            // (evita el parpadeo robot→foto); solo un panel oscuro con pulso.
            <div className="h-full w-full animate-pulse bg-white/[0.04]" />
          ) : imageUrl ? (
            <img src={imageUrl} alt="Simulador EduRobotics" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center p-8">
              <Bot className="h-24 w-24 text-white/25" strokeWidth={1.2} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Banda de estadísticas
// ─────────────────────────────────────────────────────────────
/** Un grupo de la cinta. El segundo es un duplicado visual: va aria-hidden. */
function FactsTrack({ items, hidden }) {
  return (
    <div className="facts-marquee__track" aria-hidden={hidden || undefined}>
      {items.map((s, i) => (
        <span key={`${s.label}-${i}`} className="flex flex-shrink-0 items-center">
          <span className="flex items-baseline gap-2.5 px-7">
            <span className="font-mono text-[19px] font-bold tracking-tight text-[#16151b]">
              {s.value}
            </span>
            <span className="whitespace-nowrap text-[13px] text-[#8b8a95]">{s.label}</span>
          </span>
          <span className="h-1.5 w-1.5 rotate-45 bg-[#dcdbe4]" aria-hidden="true" />
        </span>
      ))}
    </div>
  )
}

/**
 * Stats — la cinta de hechos, en movimiento continuo.
 *
 * Técnica de letigre.run: dos grupos idénticos de al menos el ancho de la
 * pantalla; desplazar uno el 100% de su propio ancho lo saca justo cuando el
 * otro ocupa su sitio, así el bucle no deja hueco. Los textos se repiten dentro
 * de cada grupo para que `space-around` no los separe en pantallas anchas.
 */
function Stats() {
  const stats = [
    { value: 'UR5', label: 'Robot industrial simulado' },
    { value: '3D', label: 'Visor en el navegador' },
    { value: '0', label: 'Instalaciones necesarias' },
    { value: '2', label: 'Modos: bloques y código' },
  ]
  // Repetidos dentro del grupo: evita huecos cuando la pantalla es más ancha
  // que el contenido.
  const repeated = [...stats, ...stats]

  return (
    <section className="border-y border-[#ececf1] bg-white py-5">
      <div className="facts-marquee" style={{ '--facts-duration': '34s' }}>
        <FactsTrack items={repeated} />
        <FactsTrack items={repeated} hidden />
      </div>
    </section>
  )
}

// Shared section furniture: the mono eyebrow and the section heading.
function SectionLabel({ children }) {
  return (
    <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#a9a8b4]">
      {children}
    </div>
  )
}

function SectionTitle({ children, className = '' }) {
  return (
    <h2 className={`mt-3 text-[28px] font-bold leading-tight tracking-[-0.012em] text-[#16151b] sm:text-[32px] ${className}`}>
      {children}
    </h2>
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
    <section id="simulador" className="mx-auto max-w-6xl px-4 pt-22 lg:pt-24">
      <SectionLabel>Lo que nos distingue</SectionLabel>
      <SectionTitle className="max-w-3xl">{data.title}</SectionTitle>
      <p className="mt-4 max-w-2xl text-[16.5px] leading-relaxed text-[#55545f]">{data.subtitle}</p>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {features.map((f) => (
          <div key={f.title} className="rounded-[14px] border border-[#e9e9ee] p-6">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#4b46d6]/[0.07] text-[#4b46d6]">
              <f.icon className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-[16.5px] font-semibold tracking-[-0.008em] text-[#16151b]">{f.title}</h3>
            <p className="mt-2 text-[14.5px] leading-relaxed text-[#55545f]">{f.text}</p>
          </div>
        ))}
      </div>

      {/* Blocks become code: the one idea the product rests on, shown rather
          than described. Stacks vertically on narrow screens. */}
      <div className="mt-6 grid overflow-hidden rounded-[14px] border border-[#e9e9ee] md:grid-cols-[minmax(0,1fr)_64px_minmax(0,1fr)]">
        <div className="p-6">
          <SectionLabel>Arrastras esto</SectionLabel>
          <div className="mt-3.5 flex flex-col gap-[7px]">
            {[
              { label: 'mover articulación 1 a 90°', bg: '#4b46d6', indent: false },
              { label: 'esperar 1 s', bg: '#6b66e0', indent: true },
              { label: 'cerrar gripper', bg: '#8e8ae8', indent: false },
            ].map((b) => (
              <div
                key={b.label}
                className={`flex h-8 items-center rounded-lg px-3 text-[12px] font-semibold text-white ${b.indent ? 'ml-4' : ''}`}
                style={{ background: b.bg }}
              >
                {b.label}
              </div>
            ))}
          </div>
        </div>

        <div className="grid place-items-center border-y border-[#f2f1f6] bg-[#fafafa] py-3 md:border-x md:border-y-0 md:py-0">
          <ArrowRight className="h-5 w-5 rotate-90 text-[#b3b2be] md:rotate-0" />
        </div>

        <div className="bg-[#0a0a0c] p-6">
          <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
            Se escribe esto
          </div>
          <div className="mt-4 font-mono text-[12px] leading-[2.05] text-white/[0.78]">
            <div><span className="text-[#a5a1ee]">robot</span>.move_j(base=<span className="text-emerald-300">90</span>)</div>
            <div><span className="text-[#a5a1ee]">wait</span>(<span className="text-emerald-300">1.0</span>)</div>
            <div><span className="text-[#a5a1ee]">gripper</span>.close()</div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────
// Tarjeta de curso estilo midu: imagen full-bleed, info superpuesta,
// descripción + CTA que se revelan al pasar el mouse.
// ─────────────────────────────────────────────────────────────
function CourseCard({ title, level, description, imageUrl, courseId }) {
  return (
    <Link
      to={courseId ? `/courses/${courseId}` : '/register'}
      className="group relative block aspect-[4/3] overflow-hidden rounded-2xl border border-gray-200 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={title}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0c]">
          <BookOpen className="h-12 w-12 text-white/30" strokeWidth={1.5} />
        </div>
      )}

      {/* Gradient scrim */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

      {/* Level badge */}
      <div className="absolute inset-x-0 top-0 p-3">
        <span className="inline-flex items-center rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-gray-800 shadow-sm backdrop-blur-sm">
          {levelOf(level).label}
        </span>
      </div>

      {/* Bottom: title always, description + CTA on hover */}
      <div className="absolute inset-x-0 bottom-0 p-4">
        <h3 className="text-lg font-bold leading-tight text-white line-clamp-2 drop-shadow-md">
          {title}
        </h3>
        <div className="max-h-0 overflow-hidden opacity-0 transition-all duration-300 ease-out group-hover:mt-2 group-hover:max-h-40 group-hover:opacity-100">
          <p className="mb-3 line-clamp-2 text-sm text-white/80">{description}</p>
          <span className="flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-[#16151b] shadow-sm">
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
    <section id="cursos" className="mx-auto max-w-6xl px-4 pt-22 lg:pt-24">
      <div>
        <div className="max-w-2xl">
          <SectionLabel>Catálogo</SectionLabel>
          <SectionTitle>{data.title}</SectionTitle>
          <p className="mt-4 text-[16.5px] leading-relaxed text-[#55545f]">
            {data.subtitle}
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.length > 0 ? (
            courses.map((c) => (
              <CourseCard
                key={c.id}
                courseId={c.id}
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

        <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
          <Link to="/roadmap">
            <Button size="lg" variant="outline" className="gap-2">
              Ver la malla de cursos <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link to="/register">
            <Button size="lg" className="gap-2">
              Empezar gratis <ArrowRight className="h-4 w-4" />
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
    <section id="como-funciona" className="mx-auto max-w-6xl px-4 pt-23 lg:pt-26">
      <SectionLabel>Cómo funciona</SectionLabel>
      <SectionTitle>{data.title}</SectionTitle>

      <div className="relative mt-11">
        {/* The rule joining the three nodes, behind them. */}
        <div className="absolute left-[16.6%] right-[16.6%] top-4 hidden h-0.5 bg-[#eceaf2] md:block" aria-hidden="true" />
        <div className="relative grid gap-8 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="text-center">
              <span className="mx-auto grid h-9 w-9 place-items-center rounded-full bg-[#16151b] font-mono text-[15px] font-bold text-white">
                {s.n}
              </span>
              <h3 className="mt-5 text-[21px] font-semibold text-[#16151b]">{s.title}</h3>
              <p className="mx-auto mt-2.5 max-w-[300px] text-[14.5px] leading-relaxed text-[#55545f]">{s.text}</p>
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
    <section id="universidades" className="mx-auto max-w-6xl px-4 pt-23 lg:pt-26">
      <SectionLabel>Para quién es</SectionLabel>
      <div className="mt-7 grid gap-6 md:grid-cols-2">
        {audiences.map((a) => (
          <div key={a.title} className="rounded-[14px] border border-[#e9e9ee] p-7">
            <div className="inline-flex h-[42px] w-[42px] items-center justify-center rounded-xl bg-[#16151b] text-white">
              <a.icon className="h-5 w-5" />
            </div>
            <h3 className="mt-5 text-[22px] font-semibold text-[#16151b]">{a.title}</h3>
            <ul className="mt-4 space-y-2.5">
              {a.points.map((p) => (
                <li key={p} className="flex items-center gap-2.5 text-[14.5px] text-[#33323b]">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-[#4b46d6]" /> {p}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────
// CTA final
// ─────────────────────────────────────────────────────────────
function FinalCTA({ onAuth, user, data }) {
  // The second brand band: the page opens dark and closes dark, with everything
  // between it white.
  return (
    <HeroBand className="on-brand-band mt-23 lg:mt-26">
      <div className="mx-auto max-w-3xl px-4 py-20 text-center lg:py-22">
        <h2 className="text-[32px] font-bold leading-[1.1] tracking-[-0.018em] text-white sm:text-[42px]">
          {data.title}
        </h2>
        <p className="mt-4.5 text-[16.5px] leading-relaxed text-white/60">
          {user
            ? 'Continúa donde lo dejaste y sigue avanzando en tus cursos.'
            : data.subtitle}
        </p>
        <div className="mt-8 flex justify-center">
          {user ? (
            <Link to="/dashboard">
              <Button size="lg" variant="onBrand" className="gap-2">
                Ir a mi dashboard <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <Button size="lg" variant="onBrand" className="gap-2" onClick={() => onAuth('register')}>
              Crear cuenta gratis <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </HeroBand>
  )
}

// ─────────────────────────────────────────────────────────────
// Preguntas frecuentes (editable desde el admin)
// ─────────────────────────────────────────────────────────────
function FAQ({ data }) {
  const [open, setOpen] = useState(null)
  const items = data.items || []
  if (items.length === 0) return null

  return (
    <section id="faq" className="mx-auto max-w-3xl px-4 pt-23 lg:pt-26">
      <SectionLabel>Dudas frecuentes</SectionLabel>
      <SectionTitle>{data.title}</SectionTitle>
      {data.subtitle && (
        <p className="mt-4 text-[16.5px] leading-relaxed text-[#55545f]">{data.subtitle}</p>
      )}

      <div className="mt-8 flex flex-col gap-2.5">
        {items.map((it, i) => {
          const isOpen = open === i
          return (
            <div
              key={i}
              className={`overflow-hidden rounded-xl border ${isOpen ? 'border-[#e9e9ee]' : 'border-[#f2f1f6]'}`}
            >
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-5 px-5 py-4 text-left transition-colors hover:bg-[#fafafa]"
              >
                <span className="text-[15px] font-semibold text-[#16151b]">{it.question}</span>
                <ChevronDown
                  className={`h-4 w-4 flex-shrink-0 text-[#b3b2be] transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  aria-hidden="true"
                />
              </button>
              {isOpen && (
                <p className="max-w-[640px] px-5 pb-5 text-[14.5px] leading-relaxed text-[#55545f]">
                  {it.answer}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────
// Footer
// ─────────────────────────────────────────────────────────────
function LandingFooter() {
  return (
    <footer className="mt-0 border-t border-[#ececf1] bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <img src="/cirtanitido.svg" alt="CIRTA" className="h-6" />
            <span className="font-semibold">EduRobotics</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
            <Link to="/login" className="hover:text-foreground">Iniciar sesión</Link>
            <Link to="/register" className="hover:text-foreground">Registro</Link>
            <Link to="/legal" className="hover:text-foreground">Términos</Link>
            <Link to="/privacidad" className="hover:text-foreground">Privacidad</Link>
            <Link to="/cookies" className="hover:text-foreground">Cookies</Link>
          </div>
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground sm:text-left">
          © {new Date().getFullYear()} CIRTA CORP · Plataforma educativa de robótica
        </p>
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
  const { data: stored, isLoading: landingLoading } = useQuery({
    queryKey: ['landing-content'],
    queryFn: getLandingContent,
    staleTime: 60_000,
    retry: false,
  })
  const content = mergeLandingContent(stored)

  return (
    <div className="min-h-screen bg-white text-foreground">
      <PublicNav onAuth={openAuth} />
      <main>
        {content.hero.visible && <Hero onAuth={openAuth} user={user} data={content.hero} loading={landingLoading} />}
        {content.stats.visible && <Stats />}
        {content.simulator.visible && <SimulatorSection data={content.simulator} />}
        {content.courses.visible && <CoursesPreview data={content.courses} />}
        {content.howItWorks.visible && <HowItWorks data={content.howItWorks} />}
        {content.forWho.visible && <ForWho />}
        {content.faq.visible && <FAQ data={content.faq} />}
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
