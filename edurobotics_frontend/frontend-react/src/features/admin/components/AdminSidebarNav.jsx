/**
 * AdminSidebarNav — el rail: solo secciones del panel.
 *
 * La lista de cursos y el árbol viven en la segunda columna (`CourseColumn`),
 * que es donde se usan. Aquí queda "Cursos" como una entrada más, con su
 * contador.
 */
import { useAdmin } from '@/features/admin/context/AdminContext'
import { BarChart3, BookOpen, GraduationCap, Globe, Users } from 'lucide-react'

const LEVEL_DOT = {
  beginner: 'bg-emerald-500',
  intermediate: 'bg-amber-500',
  advanced: 'bg-rose-500',
}

function NavButton({ active, disabled, onClick, icon: Icon, children, count }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4b46d6] ${
        active
          ? 'bg-[#16151b] text-white'
          : disabled
            ? 'cursor-not-allowed text-[#d3d2da]'
            : 'text-[#55545f] hover:bg-[#efeef3] hover:text-[#16151b]'
      }`}
    >
      {Icon && <Icon className="h-4 w-4 flex-shrink-0" strokeWidth={1.7} />}
      <span className="truncate">{children}</span>
      {count !== undefined && (
        <span
          className={`ml-auto rounded-full px-1.5 font-mono text-[10px] tabular-nums ${
            active ? 'bg-white/20 text-white' : 'bg-[#efeef3] text-[#8b8a95]'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  )
}

function SectionLabel({ children }) {
  return (
    <p className="px-2.5 pb-2.5 pt-5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#a9a8b4]">
      {children}
    </p>
  )
}

export function AdminSidebarNav() {
  const { activeTab, setActiveTab, courses, isTeacher } = useAdmin()

  return (
    <nav className="h-full border-[#ececf1] bg-[#fafafa] p-3 lg:sticky lg:top-14 lg:w-[236px] lg:flex-shrink-0 lg:border-r lg:px-3 lg:py-4">
      <SectionLabel>Panel</SectionLabel>
      {/* ── Principal ── */}
      {!isTeacher && (
        <>
          <NavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={BarChart3}>
            Dashboard
          </NavButton>
          <NavButton active={activeTab === 'usuarios'} onClick={() => setActiveTab('usuarios')} icon={Users}>
            Usuarios
          </NavButton>
        </>
      )}
      {/* Progreso es la vista del profesor (sus alumnos); también disponible para admin. */}
      <NavButton active={activeTab === 'progreso'} onClick={() => setActiveTab('progreso')} icon={GraduationCap}>
        Progreso
      </NavButton>
      {/* Analítica es compartida: el profesor ve las métricas de SUS cursos. */}
      <NavButton active={activeTab === 'analitica'} onClick={() => setActiveTab('analitica')} icon={BarChart3}>
        Analítica
      </NavButton>

      {/* ── Contenido ── */}
      <SectionLabel>Contenido</SectionLabel>

      {/* La lista de cursos vive en la segunda columna, no aquí. */}
      <NavButton
        active={activeTab === 'taller' || activeTab === 'cursos'}
        onClick={() => setActiveTab('cursos')}
        icon={BookOpen}
        count={courses.length}
      >
        Cursos
      </NavButton>

      {/* Especializaciones es contenido (agrupa cursos) */}
      {!isTeacher && (
        <NavButton active={activeTab === 'especializaciones'} onClick={() => setActiveTab('especializaciones')} icon={GraduationCap}>
          Especializaciones
        </NavButton>
      )}

      {/* ── Sitio ── */}
      {!isTeacher && (
        <>
          <SectionLabel>Sitio</SectionLabel>
          <NavButton active={activeTab === 'landing'} onClick={() => setActiveTab('landing')} icon={Globe}>
            Landing
          </NavButton>
        </>
      )}

      {isTeacher && (
        <p className="mt-6 px-2.5 text-[11px] leading-relaxed text-[#b3b2be]">
          Como profesor ves Progreso, Analítica y los cursos que tienes asignados.
        </p>
      )}
    </nav>
  )
}
