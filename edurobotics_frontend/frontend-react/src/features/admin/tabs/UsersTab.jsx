/**
 * UsersTab — registered users with course progress and role management (issue #36).
 *
 * Lists every user with how many courses they started/completed and lets an admin
 * promote another user to admin or return them to student (with confirmation).
 * You can't change your own role; the backend also refuses to remove the last admin.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Users, Shield, GraduationCap, Loader2 } from 'lucide-react'
import { getAdminUsers, updateUserRole } from '@/features/courses/services/courses'
import { getStoredUser } from '@/features/auth/services/auth'
import { Button } from '@/shared/components/button'

function fmtDate(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('es-CL', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return '—'
  }
}

export function UsersTab() {
  const queryClient = useQueryClient()
  const me = getStoredUser()

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

  const changeRole = (user) => {
    const toAdmin = user.role !== 'admin'
    const nextRole = toAdmin ? 'admin' : 'student'
    const action = toAdmin ? 'hacer administrador a' : 'volver estudiante a'
    if (!window.confirm(`¿Seguro que quieres ${action} "${user.name || user.username}"?`)) return
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
                  const isAdmin = u.role === 'admin'
                  const isMe = me && u.id === me.id
                  return (
                    <tr key={u.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800">{u.name || u.username}</div>
                        <div className="text-xs text-gray-400">{u.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          isAdmin ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {isAdmin ? <Shield className="h-3 w-3" /> : <GraduationCap className="h-3 w-3" />}
                          {isAdmin ? 'Admin' : 'Estudiante'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-gray-900">{u.courses_started}</td>
                      <td className="px-4 py-3 text-center font-semibold text-gray-900">{u.courses_completed}</td>
                      <td className="px-4 py-3 text-gray-500">{fmtDate(u.created_at)}</td>
                      <td className="px-4 py-3 text-right">
                        {isMe ? (
                          <span className="text-xs text-gray-300">Tú</span>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={roleMutation.isPending}
                            onClick={() => changeRole(u)}
                          >
                            {isAdmin ? 'Volver a estudiante' : 'Hacer admin'}
                          </Button>
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
        "Iniciados" = cursos con algún avance. "Completados" = cursos con todo el contenido y los quizzes aprobados. No puedes cambiar tu propio rol.
      </p>
    </div>
  )
}

export default UsersTab
