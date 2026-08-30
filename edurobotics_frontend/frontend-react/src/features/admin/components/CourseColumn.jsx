/**
 * CourseColumn — la segunda columna del panel: la lista de cursos y, al abrir
 * uno, su árbol de módulos y unidades.
 *
 * El rail (columna 1) solo lleva secciones; la lista vive aquí, que es donde se
 * la usa, y por eso «Crear curso» e «Importar respaldo» están en su cabecera.
 * Seleccionar una unidad abre su editor en la columna de trabajo.
 */
import { useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ChevronDown, ChevronRight, Plus, Upload } from 'lucide-react'
import { importCourse } from '@/features/courses/services/courses'
import { useAdmin } from '@/features/admin/context/AdminContext'
import { CourseTreeNodes } from '@/features/admin/features/workshop/CourseTree'

const LEVEL_DOT = {
  beginner: 'bg-emerald-500',
  intermediate: 'bg-amber-500',
  advanced: 'bg-rose-500',
}

export function CourseColumn() {
  const {
    courses, isCoursesLoading, selectedCourse, handleCourseSelect,
    setIsCourseModalOpen, setActiveTab, isTeacher,
  } = useAdmin()

  const queryClient = useQueryClient()
  const importInputRef = useRef(null)
  const [importing, setImporting] = useState(false)

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0]
    if (importInputRef.current) importInputRef.current.value = ''
    if (!file) return
    setImporting(true)
    try {
      const res = await importCourse(JSON.parse(await file.text()))
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

  return (
    <div className="flex min-h-0 flex-col border-r border-[#ececf1] bg-white lg:w-[260px] lg:flex-shrink-0">
      {!isTeacher && (
        <div className="flex items-center gap-2 border-b border-[#ececf1] p-3">
          <button
            onClick={() => setIsCourseModalOpen(true)}
            className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-[#16151b] text-[13.5px] font-semibold text-white transition-colors hover:bg-[#2b2b26] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4b46d6] focus-visible:ring-offset-2"
          >
            <Plus className="h-4 w-4" /> Crear curso
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
            className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl border border-[#e9e9ee] text-[#8b8a95] transition-colors hover:border-[#c4c3cd] hover:text-[#16151b] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4b46d6]"
          >
            <Upload className="h-4 w-4" />
          </button>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto p-2" aria-label="Cursos">
        {isCoursesLoading ? (
          <p className="px-3 py-3 text-[13px] text-[#a9a8b4]">Cargando…</p>
        ) : courses.length === 0 ? (
          <p className="px-3 py-3 text-[13px] text-[#a9a8b4]">Sin cursos aún</p>
        ) : (
          courses.map((course) => {
            const isSel = selectedCourse?.id === course.id
            return (
              <div key={course.id}>
                <button
                  onClick={() => { handleCourseSelect(course); setActiveTab('taller') }}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4b46d6] ${
                    isSel
                      ? 'bg-[#4b46d6]/[0.07] shadow-[inset_2.5px_0_0_0_#4b46d6]'
                      : 'hover:bg-[#f4f3f8]'
                  }`}
                >
                  {isSel
                    ? <ChevronDown className="h-3.5 w-3.5 flex-shrink-0 text-[#4b46d6]" />
                    : <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-[#c4c3cd]" />}
                  <span className={`h-2 w-2 flex-shrink-0 rounded-full ${LEVEL_DOT[course.level] || LEVEL_DOT.beginner}`} />
                  <span className={`min-w-0 flex-1 truncate text-[13.5px] ${
                    isSel ? 'font-semibold text-[#4b46d6]' : 'text-[#33323b]'
                  }`}>
                    {course.title}
                  </span>
                  <span className="flex-shrink-0 font-mono text-[10px] tabular-nums text-[#b3b2be]">
                    #{course.id}
                  </span>
                </button>

                {/* El curso abierto despliega su árbol aquí mismo */}
                {isSel && <CourseTreeNodes />}
              </div>
            )
          })
        )}
      </nav>
    </div>
  )
}
