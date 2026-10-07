/**
 * UsageByRole — quién usa la plataforma, una fila por rol (change `admin-analytics-v2`).
 *
 * La directora quiere ver también a profesores y administradores. Se muestran aparte, nunca
 * sumados a los alumnos: las métricas de aprendizaje siguen siendo solo de alumnos. Sale de
 * la misma respuesta que «Actividad y sesiones», así que no hace otra petición.
 */
import { useQuery } from '@tanstack/react-query'
import { adminSessionsQuery } from '@/features/admin/services/panelQueries'

const ROWS = [
  { role: 'student', label: 'Alumnos' },
  { role: 'teacher', label: 'Profesores' },
  { role: 'admin', label: 'Administradores' },
]

const TH = 'px-[14px] pb-2.5 pt-3 font-mono text-[9.5px] font-semibold uppercase tracking-[0.12em] text-[#a9a8b4]'
const TD = 'px-[14px] py-[13px] text-center font-mono text-[13.5px] tabular-nums text-[#16151b]'

export function UsageByRole() {
  const { data } = useQuery(adminSessionsQuery())
  const byRole = data?.sessions?.by_role
  if (!byRole) return null

  return (
    <div className="space-y-3">
      <span className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-[#a9a8b4]">
        Uso de la plataforma por rol
      </span>
      <div className="overflow-x-auto rounded-[14px] border border-[#e9e9ee] bg-white">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-[#fcfcfd] text-left">
              <th className={TH}>Rol</th>
              <th className={`${TH} text-center`}>Cuentas</th>
              <th className={`${TH} text-center`}>Activos hoy</th>
              <th className={`${TH} text-center`}>Activos · 7 días</th>
              <th className={`${TH} text-center`}>Ingresos · 7 días</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map(({ role, label }) => {
              const r = byRole[role] || {}
              return (
                <tr key={role} className="border-t border-[#f2f1f6]">
                  <td className="px-[14px] py-[13px] text-[13.5px] font-semibold text-[#16151b]">{label}</td>
                  <td className={TD}>{r.accounts ?? 0}</td>
                  <td className={TD}>{r.active_today ?? 0}</td>
                  <td className={TD}>{r.active_7d ?? 0}</td>
                  <td className={TD}>{r.logins_7d ?? 0}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="text-[11.5px] leading-relaxed text-[#8b8a95]">
        Cada rol por separado. Las cifras de aprendizaje (avance, aprobación, analítica de los cursos) cuentan solo a
        los alumnos: un profesor o un administrador que revisa un curso no es un alumno que avanzó.
      </p>
    </div>
  )
}

export default UsageByRole
