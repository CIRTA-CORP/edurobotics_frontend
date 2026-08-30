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
import { BookOpen, Loader2, Search } from 'lucide-react'
import { getAdminUsers, updateUserRole } from '@/features/courses/services/courses'
import {
  getUserAssignedCourses,
  assignCourseTeacher,
  unassignCourseTeacher,
} from '@/features/teacher/services/teacher'
import { getStoredUser } from '@/features/auth/services/auth'
import { useAdmin } from '@/features/admin/context/AdminContext'
import { Drawer } from '@/shared/components/Drawer'

// Badge look per role (canvas AdminDatos §8.4).
const ROLE_META = {
  admin: { label: 'Admin', cls: 'bg-[#16151b] text-white' },
  teacher: { label: 'Profesor', cls: 'bg-[#e6e6fb] text-[#4338ca]' },
  student: { label: 'Estudiante', cls: 'bg-[#f4f3f8] text-[#55545f]' },
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
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')

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

  const allUsers = data?.users || []

  // Con la lista plana ya no se navega: buscador por nombre/usuario/correo y
  // filtro por rol. Se filtra en cliente porque la lista del piloto es corta.
  const q = query.trim().toLowerCase()
  const users = allUsers.filter((u) => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false
    if (!q) return true
    return [u.name, u.username, u.email].some((f) => (f || '').toLowerCase().includes(q))
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-[#a9a8b4]">
            Panel
          </div>
          <h1
            className="mt-2 text-[28px] font-bold leading-[1.16] tracking-[-0.014em] text-[#16151b]"
            style={{ fontFamily: "'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif" }}
          >
            Usuarios
          </h1>
          <p className="mt-2.5 text-[14px] text-[#55545f]">
            Quién entra, con qué rol y cuánto ha avanzado. Los profesores además tienen cursos asignados.
          </p>
        </div>
        {!isLoading && (
          <p className="font-mono text-[11px] tabular-nums text-[#a9a8b4]">
            {users.length} usuario{users.length === 1 ? '' : 's'}{users.length !== allUsers.length && ` de ${allUsers.length}`}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full min-w-0 sm:w-[300px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#b3b2be]" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre o correo"
            aria-label="Buscar usuarios"
            className="h-10 w-full rounded-[10px] border border-[#e3e2ea] bg-white pl-9 pr-3 text-[13.5px] text-[#16151b] placeholder:text-[#b3b2be] focus:border-[#4b46d6] focus:outline-none focus:ring-2 focus:ring-[#4b46d6]/20"
          />
        </div>
        <div className="flex items-center gap-[3px] rounded-[10px] bg-[#f4f3f8] p-[3px]">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'student', label: 'Estudiantes' },
            { id: 'teacher', label: 'Profesores' },
            { id: 'admin', label: 'Admin' },
          ].map((r) => (
            <button
              key={r.id}
              onClick={() => setRoleFilter(r.id)}
              className={`grid h-8 place-items-center rounded-lg px-3.5 text-[12.5px] font-semibold transition-colors ${
                roleFilter === r.id ? 'bg-white text-[#16151b] shadow-[0_1px_3px_rgba(22,21,27,0.09)]' : 'text-[#8b8a95] hover:text-[#16151b]'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-[14px] border border-[#e9e9ee] bg-white">
        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
        ) : users.length === 0 ? (
          <div className="p-6 text-center text-sm text-[#a9a8b4]">
            {allUsers.length === 0 ? 'Aún no hay usuarios.' : 'Ningún usuario coincide con la búsqueda.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-[#fcfcfd] text-left">
                  <th className="px-[14px] pb-2.5 pt-3 font-mono text-[9.5px] font-semibold uppercase tracking-[0.12em] text-[#a9a8b4]">Usuario</th>
                  <th className="px-[14px] pb-2.5 pt-3 font-mono text-[9.5px] font-semibold uppercase tracking-[0.12em] text-[#a9a8b4]">Rol</th>
                  <th className="px-[14px] pb-2.5 pt-3 font-mono text-[9.5px] font-semibold uppercase tracking-[0.12em] text-[#a9a8b4]">Registro</th>
                  <th className="px-[14px] pb-2.5 pt-3 text-center font-mono text-[9.5px] font-semibold uppercase tracking-[0.12em] text-[#a9a8b4]">Iniciados</th>
                  <th className="px-[14px] pb-2.5 pt-3 text-center font-mono text-[9.5px] font-semibold uppercase tracking-[0.12em] text-[#a9a8b4]">Completados</th>
                  <th className="px-[14px] pb-2.5 pt-3 text-right font-mono text-[9.5px] font-semibold uppercase tracking-[0.12em] text-[#a9a8b4]">Acción</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const meta = ROLE_META[u.role] || ROLE_META.student
                  const isMe = me && u.id === me.id
                  const initials = ((u.name || u.username || '?').trim().split(/\s+/)[0]?.[0] || '') + ((u.name || '').trim().split(/\s+/)[1]?.[0] || '')
                  return (
                    <tr key={u.id} className="border-t border-[#f2f1f6] transition-colors last:border-b-0 hover:bg-[#fafafa]">
                      <td className="px-[14px] py-[13px]">
                        <div className="flex items-center gap-2.5">
                          <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full bg-[#16151b] font-mono text-[11px] font-bold text-white">
                            {initials.toUpperCase()}
                          </span>
                          <span className="min-w-0">
                            <span className="block text-[13.5px] font-semibold text-[#16151b]">{u.name || u.username}</span>
                            <span className="mt-0.5 block font-mono text-[10.5px] text-[#a9a8b4]">@{u.username} · {u.email}</span>
                          </span>
                        </div>
                      </td>
                      <td className="px-[14px] py-[13px]">
                        <span className="relative inline-block">
                          <select
                            value={u.role}
                            disabled={roleMutation.isPending || isMe}
                            onChange={(e) => setRole(u, e.target.value)}
                            className={`h-[30px] cursor-pointer appearance-none rounded-[9px] pl-2.5 pr-8 text-[12px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4b46d6] ${meta.cls}`}
                            aria-label={`Rol de ${u.name || u.username}`}
                          >
                            <option value="student">Estudiante</option>
                            <option value="teacher">Profesor</option>
                            <option value="admin">Admin</option>
                          </select>
                          <svg
                            width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 opacity-70"
                          >
                            <path d="M6 9l6 6 6-6" />
                          </svg>
                        </span>
                      </td>
                      <td className="px-[14px] py-[13px] font-mono text-[12.5px] text-[#8b8a95]">{fmtDate(u.created_at)}</td>
                      <td className="px-[14px] py-[13px] text-center font-mono text-[13.5px] font-semibold tabular-nums text-[#16151b]">{u.courses_started}</td>
                      <td className="px-[14px] py-[13px] text-center font-mono text-[13.5px] font-semibold tabular-nums text-[#047857]">{u.courses_completed}</td>
                      <td className="px-[14px] py-[13px] text-right">
                        {isMe ? (
                          <span className="text-[12.5px] text-[#c4c3cd]">—</span>
                        ) : u.role === 'teacher' ? (
                          <button
                            onClick={() => setAssignTeacher(u)}
                            className="inline-flex h-8 items-center gap-2 rounded-[10px] border border-[#e3e2ea] px-3 text-[12px] font-semibold text-[#55545f] transition-colors hover:border-[#c4c3cd] hover:text-[#16151b]"
                          >
                            <BookOpen className="h-3.5 w-3.5" strokeWidth={1.8} />
                            Cursos asignados
                          </button>
                        ) : (
                          <span className="text-[12.5px] text-[#c4c3cd]">—</span>
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
      {/* Las salvaguardas se dicen aquí, no solo cuando el intento falla. */}
      <div className="space-y-1.5 text-[11.5px] leading-relaxed text-[#8b8a95]">
        <p>
          <strong className="font-semibold text-[#55545f]">Iniciados</strong> son los cursos con
          algún avance; <strong className="font-semibold text-[#55545f]">completados</strong>, los
          que tienen todo el contenido visto y los quizzes aprobados.
        </p>
        <p>
          No puedes cambiar tu propio rol, y no se puede degradar al último administrador — si lo
          intentas, el cambio se rechaza. Los profesores editan solo los cursos que les asignas.
        </p>
      </div>

      <TeacherCoursesDrawer teacher={assignTeacher} onClose={() => setAssignTeacher(null)} />
    </div>
  )
}

export default UsersTab
