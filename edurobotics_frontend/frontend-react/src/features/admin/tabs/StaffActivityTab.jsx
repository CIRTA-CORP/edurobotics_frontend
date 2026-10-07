/**
 * StaffActivityTab — qué hizo el equipo (change `staff-activity-log`). Solo administradores.
 *
 * Cada fila es una acción de un profesor o un administrador: qué creó, editó o borró, en qué
 * curso y cuándo. Los nombres se guardaron en el momento de la acción, así que lo borrado
 * sigue apareciendo con el nombre que tenía.
 */
import { useState } from 'react'
import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { apiGet } from '@/shared/services/api'
import { useAdmin } from '@/features/admin/context/AdminContext'

const PAGE = 50
const ROLE = {
  admin: { label: 'Admin', cls: 'bg-[#16151b] text-white' },
  teacher: { label: 'Profesor', cls: 'bg-[#e6e6fb] text-[#4338ca]' },
}

function ago(iso) {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (min < 1) return 'recién'
  if (min < 60) return `hace ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `hace ${h} h`
  const d = Math.floor(h / 24)
  return `hace ${d} ${d === 1 ? 'día' : 'días'}`
}

function initials(name) {
  const parts = (name || '?').replace('@', '').trim().split(/\s+/)
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || '?'
}

const SELECT =
  'h-10 rounded-[10px] border border-[#e3e2ea] bg-white px-3 text-[12.5px] text-[#16151b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4b46d6]'

export function StaffActivityTab() {
  const { courses } = useAdmin()
  const [filters, setFilters] = useState({ user_id: '', role: '', course_id: '', since: '', until: '' })
  const set = (key) => (e) => setFilters((f) => ({ ...f, [key]: e.target.value }))

  const query = useInfiniteQuery({
    queryKey: ['staff-activity', filters],
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams({ limit: String(PAGE), offset: String(pageParam) })
      for (const [k, v] of Object.entries(filters)) if (v) params.set(k, v)
      return apiGet(`/api/admin/staff-activity?${params}`)
    },
    initialPageParam: 0,
    getNextPageParam: (last, pages) => {
      const loaded = pages.reduce((n, p) => n + (p.items?.length || 0), 0)
      return loaded < (last.total || 0) ? loaded : undefined
    },
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })

  const pages = query.data?.pages || []
  const items = pages.flatMap((p) => p.items || [])
  const total = pages[0]?.total ?? 0
  const people = pages[0]?.people || []
  const filtered = Object.values(filters).some(Boolean)

  return (
    <div className="space-y-5">
      <div>
        <div className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-[#a9a8b4]">Panel</div>
        <h1 className="mt-2 text-[28px] font-bold leading-[1.16] tracking-[-0.014em] text-[#16151b]">
          Actividad del equipo
        </h1>
        <p className="mt-2.5 max-w-[640px] text-[14px] text-[#55545f]">
          Qué crearon, editaron o borraron los profesores y administradores, y cuándo. Se registra desde que se activó
          esta sección; lo anterior no se puede reconstruir.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-2.5">
        <select value={filters.user_id} onChange={set('user_id')} aria-label="Persona" className={SELECT}>
          <option value="">Todas las personas</option>
          {people.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <select value={filters.role} onChange={set('role')} aria-label="Rol" className={SELECT}>
          <option value="">Todos los roles</option>
          <option value="teacher">Profesores</option>
          <option value="admin">Administradores</option>
        </select>
        <select value={filters.course_id} onChange={set('course_id')} aria-label="Curso" className={SELECT}>
          <option value="">Todos los cursos</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
        <label className="flex items-center gap-1.5 text-[12px] text-[#8b8a95]">
          Desde
          <input type="date" value={filters.since} onChange={set('since')} className={SELECT} />
        </label>
        <label className="flex items-center gap-1.5 text-[12px] text-[#8b8a95]">
          Hasta
          <input type="date" value={filters.until} onChange={set('until')} className={SELECT} />
        </label>
        {filtered && (
          <button
            type="button"
            onClick={() => setFilters({ user_id: '', role: '', course_id: '', since: '', until: '' })}
            className="h-10 rounded-[10px] px-3 text-[12.5px] font-semibold text-[#4b46d6] hover:bg-[#f4f3f8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4b46d6]"
          >
            Quitar filtros
          </button>
        )}
        <span className="ml-auto font-mono text-[11px] tabular-nums text-[#a9a8b4]">
          {query.isLoading ? '' : `${total} acci${total === 1 ? 'ón' : 'ones'}`}
        </span>
      </div>

      <div className={`overflow-hidden rounded-[14px] border border-[#e9e9ee] bg-white transition-opacity ${query.isFetching && !query.isFetchingNextPage ? 'opacity-70' : ''}`}>
        {query.isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
        ) : query.isError ? (
          <div className="p-6 text-center text-sm text-[#b42318]">{query.error?.message || 'No se pudo cargar la actividad.'}</div>
        ) : items.length === 0 ? (
          <div className="p-6 text-center text-sm text-[#a9a8b4]">
            {filtered ? 'Ninguna acción coincide con los filtros.' : 'Todavía no hay acciones registradas.'}
          </div>
        ) : (
          <ul>
            {items.map((a) => {
              const role = ROLE[a.actor.role] || ROLE.teacher
              return (
                <li key={a.id} className="flex items-start gap-3 border-t border-[#f2f1f6] px-4 py-3 first:border-t-0">
                  <span className="mt-0.5 grid h-8 w-8 flex-shrink-0 place-items-center rounded-full bg-[#16151b] font-mono text-[11px] font-bold text-white">
                    {initials(a.actor.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] leading-relaxed text-[#33323b]">
                      <span className="font-semibold text-[#16151b]">{a.actor.name}</span>
                      <span className={`mx-1.5 inline-block rounded px-1.5 py-px align-middle font-mono text-[9px] font-bold ${role.cls}`}>
                        {role.label}
                      </span>
                      {a.description}
                    </p>
                  </div>
                  <span
                    className="flex-shrink-0 pt-0.5 font-mono text-[11.5px] text-[#8b8a95]"
                    title={new Date(a.at).toLocaleString('es-CL')}
                  >
                    {ago(a.at)}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {query.hasNextPage && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => query.fetchNextPage()}
            disabled={query.isFetchingNextPage}
            className="inline-flex h-9 items-center gap-2 rounded-[10px] border border-[#e3e2ea] px-4 text-[12.5px] font-semibold text-[#55545f] hover:border-[#c4c3cd] hover:text-[#16151b] disabled:opacity-50"
          >
            {query.isFetchingNextPage && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Ver más
          </button>
        </div>
      )}

      <p className="text-[11.5px] leading-relaxed text-[#8b8a95]">
        No se registra lo que hacen los alumnos (avance, evaluaciones, opiniones), aunque lo haga alguien del equipo al
        revisar un curso. Las acciones se conservan 12 meses.
      </p>
    </div>
  )
}

export default StaffActivityTab
