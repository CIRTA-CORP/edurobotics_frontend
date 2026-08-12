/**
 * UsersTab — registered users with course progress and role management (issue #36),
 * plus course assignment for teachers (#26 v2).
 *
 * Lists every user with how many courses they started/completed and lets an admin
 * promote another user to admin or return them to student (with confirmation).
 * Teachers get an extra "Cursos" action to assign them the courses they teach.
 * You can't change your own role; the backend also refuses to remove the last admin.
 */
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Users, Shield, GraduationCap, BookOpen, Loader2 } from 'lucide-react'
import { getAdminUsers, updateUserRole } from '@/features/courses/services/courses'
import {
  getUserAssignedCourses,
  assignCourseTeacher,
  unassignCourseTeacher,
} from '@/features/teacher/services/teacher'
import { getStoredUser } from '@/features/auth/services/auth'
import { useAdmin } from '@/features/admin/context/AdminContext'
import { Drawer } from '@/shared/components/Drawer'

// Badge look per role (teacher is read-only staff; admin has full control).
const ROLE_META = {
  admin: { label: 'Admin', icon: Shield, cls: 'bg-purple-100 text-purple-700' },
  teacher: { label: 'Profesor', icon: BookOpen, cls: 'bg-indigo-100 text-indigo-700' },
  student: { label: 'Estudiante', icon: GraduationCap, cls: 'bg-gray-100 text-gray-600' },
}
const ROLE_LABEL = { student: 'estudiante', teacher: 'profesor', admin: 'administrador' }

function fmtDate(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('es-CL', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return '—'
  }
}

/** Drawer to assign the courses a teacher manages (#26 v2). */
function TeacherCoursesDrawer({ teacher, onClose }) {
  const queryClient = useQueryClient()
  const { courses } = useAdmin()

  const { data, isLoading } = useQuery({
    queryKey: ['assigned-courses', teacher?.id],
    queryFn: () => getUserAssignedCourses(teacher.id),
    enabled: !!teacher,
    staleTime: 15_000,
  })
  const assigned = new Set(data?.courses || [])

  const toggleMutation = useMutation({
    mutationFn: ({ courseId, assign }) =>
      assign ? assignCourseTeacher(courseId, teacher.id) : unassignCourseTeacher(courseId, teacher.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assigned-courses', teacher?.id] })
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] })
    },
    onError: (err) => toast.error(err?.message || 'No se pudo actualizar la asignación'),
  })

  const toggle = (courseId, assign) => {
    toggleMutation.mutate({ courseId, assign })
  }

  return (
    <Drawer open={!!teacher} onClose={onClose} title={teacher ? `Cursos de ${teacher.name || teacher.username}` : ''}>
      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></div>
      ) : courses.length === 0 ? (
        <p className="text-sm text-gray-400">Aún no hay cursos que asignar.</p>
      ) : (
        <div className="space-y-1">
          {courses.map((c) => {
            const checked = assigned.has(c.id)
            return (
              <label key={c.id} className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={toggleMutation.isPending}
                  onChange={() => toggle(c.id, !checked)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-500"
                />
                <span className="truncate text-sm text-gray-700">{c.title}</span>
              </label>
            )
          })}
        </div>
      )}
    </Drawer>
  )
}

export function UsersTab() {
  const queryClient = useQueryClient()
  const me = getStoredUser()
  const [assignTeacher, setAssignTeacher] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: getAdminUsers,
    staleTime: 30_000,
  })

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }) => updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success('Rol actualizado')
    },
    onError: (err) => toast.error(err?.message || 'No se pudo cambiar el rol'),
  })

  const setRole = (user, nextRole) => {
    if (nextRole === user.role) return
    if (!window.confirm(`¿Cambiar a "${user.name || user.username}" a ${ROLE_LABEL[nextRole]}?`)) return
    roleMutation.mutate({ userId: user.id, role: nextRole })
  }

  const users = data?.users || []

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Users className="w-5 h-5 text-gray-700" />
        <h3 className="text-lg font-semibold text-gray-900">Usuarios registrados</h3>
        {!isLoading && <span className="text-sm text-gray-400">· {users.length}</span>}
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
        ) : users.length === 0 ? (
          <div className="p-6 text-center text-sm text-gray-400">Aún no hay usuarios.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                  <th className="px-4 py-3">Usuario</th>
                  <th className="px-4 py-3">Rol</th>
                  <th className="px-4 py-3 text-center">Iniciados</th>
                  <th className="px-4 py-3 text-center">Completados</th>
                  <th className="px-4 py-3">Registro</th>
                  <th className="px-4 py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const meta = ROLE_META[u.role] || ROLE_META.student
                  const RoleIcon = meta.icon
                  const isMe = me && u.id === me.id
                  return (
                    <tr key={u.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800">{u.name || u.username}</div>
                        <div className="text-xs text-gray-400">{u.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${meta.cls}`}>
                          <RoleIcon className="h-3 w-3" />
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-gray-900">{u.courses_started}</td>
                      <td className="px-4 py-3 text-center font-semibold text-gray-900">{u.courses_completed}</td>
                      <td className="px-4 py-3 text-gray-500">{fmtDate(u.created_at)}</td>
                      <td className="px-4 py-3 text-right">
                        {isMe ? (
                          <span className="text-xs text-gray-300">Tú</span>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            {u.role === 'teacher' && (
                              <button
                                onClick={() => setAssignTeacher(u)}
                                className="rounded-lg border border-indigo-200 bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
                              >
                                Cursos
                              </button>
                            )}
                            <select
                              value={u.role}
                              disabled={roleMutation.isPending}
                              onChange={(e) => setRole(u, e.target.value)}
                              className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                              aria-label={`Rol de ${u.name || u.username}`}
                            >
                              <option value="student">Estudiante</option>
                              <option value="teacher">Profesor</option>
                              <option value="admin">Admin</option>
                            </select>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p className="text-[11px] text-gray-400">
        "Iniciados" = cursos con algún avance. "Completados" = cursos con todo el contenido y los quizzes aprobados. No puedes cambiar tu propio rol. Los profesores editan solo los cursos que les asignas.
      </p>

      <TeacherCoursesDrawer teacher={assignTeacher} onClose={() => setAssignTeacher(null)} />
    </div>
  )
}

export default UsersTab
