/**
 * Teacher Dashboard (#26) — READ-ONLY view of student progress.
 *
 * A teacher sees every student with their course progress, quiz pass rate and an
 * "sin actividad reciente" flag, and can drill into one student's per-course progress.
 * No admin actions here (no role changes, no editing) — the backend also enforces this.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Loader2, LogOut, GraduationCap, AlertCircle, ChevronRight, BookOpen } from 'lucide-react'
import { clearStoredUser, getStoredUser } from '@/features/auth/services/auth'
import { getTeacherStudents, getTeacherStudentDetail } from '@/features/teacher/services/teacher'
import { LogoutModal } from '@/shared/components/LogoutModal'
import { Drawer } from '@/shared/components/Drawer'

function fmtDate(iso) {
  if (!iso) return 'Sin actividad'
  return new Date(iso).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })
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
        <div className="space-y-4">
          <p className="text-sm text-gray-500">@{s.username} · última actividad {fmtDate(s.last_activity)}</p>
          {s.inactive && (
            <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-100 px-3 py-2 text-xs text-amber-700">
              <AlertCircle className="h-4 w-4" /> Sin actividad reciente
            </div>
          )}
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Progreso por curso</p>
            {(s.roadmap || []).length === 0 && <p className="text-sm text-gray-400">Sin cursos iniciados.</p>}
            <div className="space-y-2">
              {(s.roadmap || []).map((c) => (
                <div key={c.id} className="rounded-lg border border-gray-100 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-800">{c.title}</span>
                    <span className="text-sm font-semibold text-gray-900">{c.percentage}%</span>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full bg-blue-500" style={{ width: `${c.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Drawer>
  )
}

export default function TeacherDashboardPage() {
  const navigate = useNavigate()
  const [user] = useState(() => getStoredUser())
  const [showLogout, setShowLogout] = useState(false)
  const [selected, setSelected] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['teacher-students'],
    queryFn: getTeacherStudents,
    enabled: !!user,
    staleTime: 30_000,
  })
  const students = data?.students || []

  return (
    <div className="min-h-screen bg-gray-50">
      <LogoutModal
        isOpen={showLogout}
        onConfirm={() => { clearStoredUser(); navigate('/') }}
        onCancel={() => setShowLogout(false)}
      />

      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-indigo-600" />
            <div>
              <h1 className="text-sm font-bold text-gray-900">Panel del profesor</h1>
              <p className="text-xs text-gray-400">Seguimiento del avance de los alumnos</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
            >
              <BookOpen className="h-3.5 w-3.5" />
              Gestionar mis cursos
            </button>
            <span className="text-sm text-gray-600">{user?.first_name} {user?.last_name}</span>
            <button onClick={() => setShowLogout(true)} className="text-gray-400 hover:text-gray-700" title="Salir">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
        ) : (
          <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
            <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-5 py-3 border-b border-gray-100 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
              <span>Alumno</span>
              <span className="w-16 text-right">Iniciados</span>
              <span className="w-20 text-right">Completados</span>
              <span className="w-16 text-right">Quizzes</span>
              <span className="w-28 text-right">Actividad</span>
            </div>
            {students.length === 0 && (
              <p className="px-5 py-10 text-center text-sm text-gray-400">Aún no hay alumnos registrados.</p>
            )}
            {students.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelected(s.id)}
                className="grid w-full grid-cols-[1fr_auto_auto_auto_auto] items-center gap-4 px-5 py-3 border-b border-gray-50 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-800">{s.name || s.username}</p>
                  <p className="truncate text-xs text-gray-400">@{s.username}</p>
                </div>
                <span className="w-16 text-right text-sm text-gray-700">{s.courses_started}</span>
                <span className="w-20 text-right text-sm text-gray-700">{s.courses_completed}</span>
                <span className="w-16 text-right text-sm text-gray-700">
                  {s.quiz_pass_rate == null ? '—' : `${s.quiz_pass_rate}%`}
                </span>
                <span className="w-28 flex items-center justify-end gap-1.5">
                  {s.inactive ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                      <AlertCircle className="h-3 w-3" /> Sin actividad
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">{fmtDate(s.last_activity)}</span>
                  )}
                  <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
                </span>
              </button>
            ))}
          </div>
        )}
      </main>

      <StudentDetail studentId={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
