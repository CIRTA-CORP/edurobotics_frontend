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
  BarChart3, BookOpen, Layers, GraduationCap, Globe,
  ChevronDown, ChevronRight, Plus, Settings, Upload, Users,
} from 'lucide-react'
import { useRef, useState as useLocalState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { importCourse } from '@/features/courses/services/courses'

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
  const {
    activeTab, setActiveTab, courses, isCoursesLoading, isTeacher,
    selectedCourse, handleCourseSelect, setIsCourseModalOpen,
  } = useAdmin()

  // Creating and importing courses sit with the list, which lives here.
  const queryClient = useQueryClient()
  const importInputRef = useRef(null)
  const [importing, setImporting] = useLocalState(false)

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0]
    if (importInputRef.current) importInputRef.current.value = ''
    if (!file) return
    setImporting(true)
    try {
      const data = JSON.parse(await file.text())
      const res = await importCourse(data)
      toast.success(`Curso "${res.title}" importado (queda despublicado para revisar)`)
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] })
    } catch (err) {
      toast.error(
        err?.message?.includes('JSON')
          ? 'El archivo no es un respaldo válido'
          : (err.message || 'No se pudo importar')
      )
    } finally {
      setImporting(false)
    }
  }

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
    setOpenCourseId(course.id)
    handleCourseSelect(course)
    // The workshop holds the tree, so picking a course lands straight in it —
    // no intermediate list, no "Gestionar" step.
    setActiveTab('taller')
  }

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

      {/* "Cursos" = acordeón que despliega la lista */}
      <button
        onClick={() => setCoursesOpen((o) => !o)}
        aria-expanded={coursesOpen}
        className="flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-[13.5px] font-medium text-[#55545f] transition-colors hover:bg-[#efeef3] hover:text-[#16151b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4b46d6]"
      >
        <span className="flex items-center gap-2.5">
          <BookOpen className="h-4 w-4 flex-shrink-0" strokeWidth={1.7} />
          Cursos
        </span>
        <span className="flex items-center gap-1.5">
          <span className="rounded-full bg-[#efeef3] px-1.5 font-mono text-[10px] tabular-nums text-[#8b8a95]">{courses.length}</span>
          {coursesOpen ? <ChevronDown className="h-4 w-4 text-[#b3b2be]" /> : <ChevronRight className="h-4 w-4 text-[#b3b2be]" />}
        </span>
      </button>

      {coursesOpen && !isTeacher && (
        <div className="mt-1 flex items-center gap-1 px-1">
          <button
            onClick={() => setIsCourseModalOpen(true)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#e9e9ee] bg-white py-1.5 text-[12px] font-semibold text-[#55545f] transition-colors hover:border-[#c4c3cd] hover:text-[#16151b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4b46d6]"
          >
            <Plus className="h-3.5 w-3.5" /> Crear curso
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleImportFile}
            className="hidden"
          />
          <button
            onClick={() => importInputRef.current?.click()}
            disabled={importing}
            title="Importar respaldo (.json)"
            aria-label="Importar respaldo"
            className="grid h-[30px] w-[30px] flex-shrink-0 place-items-center rounded-lg border border-[#e9e9ee] bg-white text-[#8b8a95] transition-colors hover:border-[#c4c3cd] hover:text-[#16151b] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4b46d6]"
          >
            <Upload className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Lista de cursos */}
      {coursesOpen && (
        <div className="mt-1 space-y-0.5">
          {isCoursesLoading ? (
            <p className="px-2.5 py-2 text-xs text-[#a9a8b4]">Cargando…</p>
          ) : courses.length === 0 ? (
            <p className="px-2.5 py-2 text-xs text-[#a9a8b4]">Sin cursos aún</p>
          ) : (
            courses.map((course) => {
              const isOpen = openCourseId === course.id
              const isSel = selectedCourse?.id === course.id
              return (
                <div key={course.id}>
                  <button
                    onClick={() => onCourseClick(course)}
                    className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4b46d6] ${
                      isSel ? 'bg-[#4b46d6]/[0.07] font-medium text-[#4b46d6]' : 'text-[#55545f] hover:bg-[#efeef3]'
                    }`}
                  >
                    {isOpen ? <ChevronDown className="h-3.5 w-3.5 flex-shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />}
                    <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${LEVEL_DOT[course.level] || LEVEL_DOT.beginner}`} />
                    <span className="truncate">{course.title}</span>
                  </button>

                  {/* El árbol del taller sustituye a las sub-pestañas: aquí solo
                      queda el detalle del curso, que no vive en el árbol. */}
                  {isOpen && isSel && !isTeacher && (
                    <div className="my-1 ml-4 space-y-0.5 border-l border-[#ececf1] pl-2">
                      <NavButton active={activeTab === 'taller'} onClick={() => setActiveTab('taller')} icon={Layers}>
                        Taller del curso
                      </NavButton>
                      <NavButton active={activeTab === 'cursos'} onClick={() => setActiveTab('cursos')} icon={Settings}>
                        Detalle del curso
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
