/**
 * StudentsTab — "Progreso" (#26): the teacher's view of their students, in the
 * shared panel's design language.
 *
 * A teacher sees the students of THEIR courses (the backend scopes the list);
 * an admin sees everyone. Each row shows course progress, quiz pass rate and an
 * "sin actividad reciente" flag, and opens a drawer with the student's per-course
 * roadmap. Read-only by design — no role changes, no editing here.
 */
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Loader2, GraduationCap, AlertCircle, ChevronRight, Users,
  ClipboardCheck, Activity,
} from 'lucide-react'
import { getTeacherStudents, getTeacherStudentDetail } from '@/features/teacher/services/teacher'
import { Drawer } from '@/shared/components/Drawer'

function fmtDate(iso) {
  if (!iso) return 'Sin actividad'
  try {
    return new Date(iso).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return 'Sin actividad'
  }
}

function initials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  return (parts[0]?.[0] || '') + (parts[1]?.[0] || '').toUpperCase()
}

/** Drawer with one student's per-course progress. */
function StudentDetail({ studentId, onClose }) {
  const { data, isLoading } = useQuery({
    queryKey: ['teacher-student', studentId],
    queryFn: () => getTeacherStudentDetail(studentId),
    enabled: !!studentId,
  })
  const s = data?.student

  return (
    <Drawer open={!!studentId} onClose={onClose} title={s ? s.name : 'Alumno'}>
      {isLoading || !s ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
      ) : (
        <div className="space-y-5">
          {/* Identity card */}
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-sm font-bold text-indigo-700">
              {initials(s.name)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900">{s.name}</p>
              <p className="truncate text-xs text-gray-400">@{s.username} · última actividad {fmtDate(s.last_activity)}</p>
            </div>
          </div>

          {s.inactive && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              Sin actividad reciente (14 días)
            </div>
          )}

          {/* Per-course progress */}
          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Progreso por curso</p>
            {(s.roadmap || []).length === 0 ? (
              <p className="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-400">
                Sin cursos iniciados.
              </p>
            ) : (
              <div className="space-y-2.5">
                {(s.roadmap || []).map((c) => (
                  <div key={c.id} className="rounded-xl border border-gray-100 bg-white p-3.5 shadow-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium text-gray-800" title={c.title}>{c.title}</span>
                      <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                        c.percentage >= 100 ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-50 text-blue-700'
                      }`}>
                        {c.percentage}%
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={`h-full rounded-full ${c.percentage >= 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                        style={{ width: `${c.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Drawer>
  )
}

export function StudentsTab() {
  const [selected, setSelected] = useState(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['teacher-students'],
    queryFn: getTeacherStudents,
    staleTime: 30_000,
  })
  const students = data?.students || []

  const withPassRate = students.filter((s) => s.quiz_pass_rate != null)
  const avgPassRate = withPassRate.length
    ? Math.round(withPassRate.reduce((acc, s) => acc + s.quiz_pass_rate, 0) / withPassRate.length)
    : null
  const inactiveCount = students.filter((s) => s.inactive).length

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <GraduationCap className="h-5 w-5 text-indigo-600" />
        <h3 className="text-lg font-semibold text-gray-900">Progreso de alumnos</h3>
        {!isLoading && <span className="text-sm text-gray-400">· {students.length}</span>}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            <Users className="h-3.5 w-3.5" /> Alumnos
          </div>
          <div className="mt-1 text-2xl font-bold text-gray-900">{isLoading ? '…' : students.length}</div>
          <div className="text-xs text-gray-400">en tus cursos</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            <ClipboardCheck className="h-3.5 w-3.5" /> Aprobación en quizzes
          </div>
          <div className="mt-1 text-2xl font-bold text-gray-900">
            {isLoading || avgPassRate == null ? '—' : `${avgPassRate}%`}
          </div>
          <div className="text-xs text-gray-400">promedio entre alumnos con intentos</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            <Activity className="h-3.5 w-3.5" /> Sin actividad reciente
          </div>
          <div className={`mt-1 text-2xl font-bold ${inactiveCount > 0 ? 'text-amber-600' : 'text-gray-900'}`}>
            {isLoading ? '…' : inactiveCount}
          </div>
          <div className="text-xs text-gray-400">14 días sin señal</div>
        </div>
      </div>

      {/* Students table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
        ) : isError ? (
          <p className="px-5 py-12 text-center text-sm text-gray-400">No se pudo cargar el progreso.</p>
        ) : students.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
              <GraduationCap className="h-6 w-6 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-600">Aún no hay alumnos en tus cursos</p>
            <p className="mt-1 text-xs text-gray-400">Cuando un alumno abra uno de tus cursos, aparecerá aquí.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                  <th className="px-4 py-3">Alumno</th>
                  <th className="px-4 py-3 text-center">Iniciados</th>
                  <th className="px-4 py-3 text-center">Completados</th>
                  <th className="px-4 py-3 text-center">Quizzes</th>
                  <th className="px-4 py-3 text-right">Actividad</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr
                    key={s.id}
                    onClick={() => setSelected(s.id)}
                    className="cursor-pointer border-b border-gray-50 last:border-0 transition-colors hover:bg-gray-50/60"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-700">
                          {initials(s.name || s.username)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-gray-800">{s.name || s.username}</p>
                          <p className="truncate text-xs text-gray-400">@{s.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-gray-900">{s.courses_started}</td>
                    <td className="px-4 py-3 text-center font-semibold text-gray-900">{s.courses_completed}</td>
                    <td className="px-4 py-3 text-center">
                      {s.quiz_pass_rate == null ? (
                        <span className="text-xs text-gray-300">—</span>
                      ) : (
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          s.quiz_pass_rate >= 80 ? 'bg-emerald-100 text-emerald-700' :
                          s.quiz_pass_rate >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                        }`}>
                          {s.quiz_pass_rate}%
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {s.inactive ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                            <AlertCircle className="h-3 w-3" /> Sin actividad
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">{fmtDate(s.last_activity)}</span>
                        )}
                        <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-[11px] text-gray-400">
        "Iniciados"/"Completados" cuentan solo tus cursos. "Sin actividad" = sin señal (clase, quiz o inicio de sesión) en 14 días.
      </p>

      <StudentDetail studentId={selected} onClose={() => setSelected(null)} />
    </div>
  )
}

export default StudentsTab
