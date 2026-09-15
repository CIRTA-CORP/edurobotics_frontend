/**
 * SessionActivity — real session/activity for the admin dashboard (#25).
 *
 * Uses recorded login events (GET /api/admin/sessions): active users (truly
 * recent, by login), login totals, and a list of the latest sessions.
 */
import { useQuery } from '@tanstack/react-query'
import { UserCheck, LogIn, Shield } from 'lucide-react'
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

function StatCard({ icon, label, value }) {
  const Icon = icon
  return (
    <div className="rounded-[14px] border border-[#e9e9ee] bg-white p-[18px_20px]">
      <div className="flex items-center gap-2 font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-[#a9a8b4]">
        <Icon className="h-3.5 w-3.5" strokeWidth={1.7} />
        {label}
      </div>
      <div className="mt-3 font-mono text-[30px] font-bold leading-none tracking-[-0.025em] text-[#16151b]">{value}</div>
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
          <div key={i} className="h-24 animate-pulse rounded-[14px] border border-[#e9e9ee] bg-white" />
        ))}
      </div>
    )
  }
  if (!s) return null

  return (
    <div className="space-y-3">
      <span className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-[#a9a8b4]">
        Actividad y sesiones
      </span>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={UserCheck} label="Activos · 7 días" value={s.active_7d} />
        <StatCard icon={UserCheck} label="Activos · hoy" value={s.active_24h} />
        <StatCard icon={LogIn} label="Logins · 7 días" value={s.logins_7d} />
        <StatCard icon={LogIn} label="Logins · hoy" value={s.logins_24h} />
      </div>

      {/* Recent sessions */}
      <div className="overflow-hidden rounded-[14px] border border-[#e9e9ee] bg-white">
        <div className="border-b border-[#f2f1f6] bg-[#fcfcfd] px-4 py-3">
          <h4 className="text-sm font-semibold text-[#16151b]">Sesiones recientes</h4>
          <p className="mt-0.5 text-[12px] text-[#a9a8b4]">Últimos inicios de sesión</p>
        </div>
        {s.recent?.length > 0 ? (
          <ul className="max-h-80 overflow-y-auto">
            {s.recent.map((r, i) => (
              <li key={i} className="flex items-center justify-between gap-3 border-t border-[#f2f1f6] px-4 py-2.5 first:border-t-0">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full bg-[#16151b] font-mono text-[11px] font-bold text-white">
                    {initials(r.name, r.username)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] font-semibold text-[#16151b]">
                      {r.name || r.username}
                      {r.role === 'admin' && (
                        <span className="ml-1.5 inline-flex items-center gap-0.5 rounded bg-[#16151b] px-1.5 py-0.5 align-middle font-mono text-[9px] font-bold text-white">
                          <Shield className="h-2 w-2" /> ADMIN
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 truncate font-mono text-[10.5px] text-[#a9a8b4]">@{r.username}</p>
                  </div>
                </div>
                <span className="flex-shrink-0 font-mono text-[12px] text-[#8b8a95]">{timeAgo(r.at)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-4 py-10 text-center text-sm text-[#a9a8b4]">
            Aún no hay inicios de sesión registrados. Se llenarán a medida que los usuarios entren.
          </div>
        )}
      </div>
    </div>
  )
}

export default SessionActivity
