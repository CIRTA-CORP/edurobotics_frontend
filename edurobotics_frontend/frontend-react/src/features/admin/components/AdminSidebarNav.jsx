/**
 * AdminSidebarNav — navegación lateral agrupada del panel admin.
 *
 * Dos niveles de acordeón:
 *   1. "Cursos" despliega/colapsa la lista completa de cursos (útil cuando hay
 *      muchos).
 *   2. Cada curso despliega sus secciones (Módulos, Unidades, Contenido,
 *      Evaluaciones).
 *
 * La expansión usa estado local (instantánea, no espera a la carga del curso).
 * Reutiliza el estado del AdminContext, así que no cambia ninguna lógica CRUD.
 */
import { useEffect, useState } from 'react'
import { useAdmin } from '@/features/admin/context/AdminContext'
import {
  BarChart3, BookOpen, Layers, FileText, Package, ClipboardCheck,
  GraduationCap, Globe, ChevronDown, ChevronRight, Settings,
} from 'lucide-react'

const LEVEL_DOT = {
  beginner: 'bg-emerald-500',
  intermediate: 'bg-amber-500',
  advanced: 'bg-rose-500',
}

function NavButton({ active, disabled, onClick, icon: Icon, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? 'bg-slate-900 text-white shadow-sm'
          : disabled
            ? 'cursor-not-allowed text-gray-300'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      {Icon && <Icon className="h-4 w-4 flex-shrink-0" />}
      <span className="truncate">{children}</span>
    </button>
  )
}

function SectionLabel({ children }) {
  return (
    <p className="px-3 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
      {children}
    </p>
  )
}

export function AdminSidebarNav() {
  const {
    activeTab, setActiveTab, courses, isCoursesLoading,
    selectedCourse, handleCourseSelect, selectedModule, selectedUnit,
  } = useAdmin()

  const [coursesOpen, setCoursesOpen] = useState(true) // acordeón de la lista
  const [openCourseId, setOpenCourseId] = useState(selectedCourse?.id ?? null)

  // Mantener expandido el curso seleccionado (incluye deep-link por URL)
  useEffect(() => {
    if (selectedCourse?.id) {
      setOpenCourseId(selectedCourse.id)
      setCoursesOpen(true)
    }
  }, [selectedCourse?.id])

  const onCourseClick = (course) => {
    setOpenCourseId((prev) => (prev === course.id ? null : course.id)) // expandir al instante
    handleCourseSelect(course)
    setActiveTab('cursos')
  }

  return (
    <nav className="rounded-xl border border-gray-200 bg-white p-2 lg:sticky lg:top-20">
      {/* ── Principal ── */}
      <NavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={BarChart3}>
        Dashboard
      </NavButton>

      {/* ── Contenido ── */}
      <SectionLabel>Contenido</SectionLabel>

      {/* "Cursos" = acordeón que despliega la lista */}
      <button
        onClick={() => setCoursesOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
      >
        <span className="flex items-center gap-2.5">
          <BookOpen className="h-4 w-4 flex-shrink-0" />
          Cursos
        </span>
        <span className="flex items-center gap-1.5">
          <span className="rounded-full bg-gray-100 px-1.5 text-[10px] text-gray-500">{courses.length}</span>
          {coursesOpen ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
        </span>
      </button>

      {/* Lista de cursos */}
      {coursesOpen && (
        <div className="mt-1 space-y-0.5">
          {isCoursesLoading ? (
            <p className="px-3 py-2 text-xs text-gray-400">Cargando…</p>
          ) : courses.length === 0 ? (
            <p className="px-3 py-2 text-xs text-gray-400">Sin cursos aún</p>
          ) : (
            courses.map((course) => {
              const isOpen = openCourseId === course.id
              const isSel = selectedCourse?.id === course.id
              return (
                <div key={course.id}>
                  <button
                    onClick={() => onCourseClick(course)}
                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                      isSel ? 'bg-blue-50 font-medium text-blue-700' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {isOpen ? <ChevronDown className="h-3.5 w-3.5 flex-shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />}
                    <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${LEVEL_DOT[course.level] || LEVEL_DOT.beginner}`} />
                    <span className="truncate">{course.title}</span>
                  </button>

                  {/* Sub-secciones del curso */}
                  {isOpen && (
                    <div className="my-1 ml-4 space-y-0.5 border-l border-gray-200 pl-2">
                      <NavButton active={activeTab === 'cursos'} onClick={() => setActiveTab('cursos')} icon={Settings}>
                        Detalle del curso
                      </NavButton>
                      <NavButton active={activeTab === 'modulos'} onClick={() => setActiveTab('modulos')} icon={Layers}>
                        Módulos
                      </NavButton>
                      <NavButton active={activeTab === 'unidades'} disabled={!selectedModule} onClick={() => setActiveTab('unidades')} icon={FileText}>
                        Unidades
                      </NavButton>
                      <NavButton active={activeTab === 'contenido'} disabled={!selectedUnit} onClick={() => setActiveTab('contenido')} icon={Package}>
                        Contenido
                      </NavButton>
                      <NavButton active={activeTab === 'evaluaciones'} disabled={!selectedUnit} onClick={() => setActiveTab('evaluaciones')} icon={ClipboardCheck}>
                        Evaluaciones
                      </NavButton>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Especializaciones es contenido (agrupa cursos) */}
      <NavButton active={activeTab === 'especializaciones'} onClick={() => setActiveTab('especializaciones')} icon={GraduationCap}>
        Especializaciones
      </NavButton>

      {/* ── Sitio ── */}
      <SectionLabel>Sitio</SectionLabel>
      <NavButton active={activeTab === 'landing'} onClick={() => setActiveTab('landing')} icon={Globe}>
        Landing
      </NavButton>
    </nav>
  )
}
