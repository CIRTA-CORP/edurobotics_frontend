/**
 * SessionActivity — real session/activity for the admin dashboard (#25).
 *
 * Uses recorded login events (GET /api/admin/sessions): active users (truly
 * recent, by login), login totals, and a list of the latest sessions.
 */
import { useQuery } from '@tanstack/react-query'
import { Activity, UserCheck, LogIn, Shield } from 'lucide-react'
import { getAdminSessions } from '@/features/courses/services/courses'

/** "hace 5 min" / "hace 2 h" / "hace 3 días". */
function timeAgo(iso) {
  if (!iso) return '—'
  const then = new Date(iso + (iso.endsWith('Z') ? '' : 'Z')).getTime()
  const diff = Math.max(0, Date.now() - then)
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'recién'
  if (min < 60) return `hace ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `hace ${h} h`
  const d = Math.floor(h / 24)
  return `hace ${d} ${d === 1 ? 'día' : 'días'}`
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
        <Icon className="h-5 w-5" />
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="mt-0.5 text-xs text-gray-500">{label}</div>
    </div>
  )
}

function initials(name, username) {
  const base = (name || username || '?').trim()
  const parts = base.split(/\s+/)
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || '?'
}

export function SessionActivity() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-sessions'],
    queryFn: getAdminSessions,
    staleTime: 30_000,
  })

  const s = data?.sessions

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl border border-gray-200 bg-white" />
        ))}
      </div>
    )
  }
  if (!s) return null

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Activity className="h-5 w-5 text-gray-700" />
        <h3 className="text-lg font-semibold text-gray-900">Actividad y sesiones</h3>
        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
          datos reales
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={UserCheck} label="Activos (últimos 7 días)" value={s.active_7d} />
        <StatCard icon={UserCheck} label="Activos (hoy)" value={s.active_24h} />
        <StatCard icon={LogIn} label="Logins (7 días)" value={s.logins_7d} />
        <StatCard icon={LogIn} label="Logins (hoy)" value={s.logins_24h} />
      </div>

      {/* Recent sessions */}
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-4 py-3">
          <h4 className="text-sm font-semibold text-gray-900">Sesiones recientes</h4>
          <p className="text-xs text-gray-400">Últimos inicios de sesión</p>
        </div>
        {s.recent?.length > 0 ? (
          <ul className="max-h-80 divide-y divide-gray-50 overflow-y-auto">
            {s.recent.map((r, i) => (
              <li key={i} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-[11px] font-bold text-white">
                    {initials(r.name, r.username)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-800">
                      {r.name || r.username}
                      {r.role === 'admin' && (
                        <span className="ml-1.5 inline-flex items-center gap-0.5 rounded bg-slate-800 px-1.5 py-0.5 text-[9px] font-semibold text-white align-middle">
                          <Shield className="h-2 w-2" /> ADMIN
                        </span>
                      )}
                    </p>
                    <p className="truncate text-xs text-gray-400">@{r.username}</p>
                  </div>
                </div>
                <span className="flex-shrink-0 text-xs text-gray-400">{timeAgo(r.at)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-4 py-10 text-center text-sm text-gray-400">
            Aún no hay inicios de sesión registrados. Se llenarán a medida que los usuarios entren.
          </div>
        )}
      </div>
    </div>
  )
}

export default SessionActivity
