/**
 * BackupsTab — respaldos de la base de datos (change `database-backups`, issue #41).
 *
 * Lista los respaldos, los descarga y crea uno al momento. No restaura: un clic equivocado
 * reemplazaría los datos de producción, así que restaurar es un procedimiento manual
 * (docs/restaurar-respaldo.md en el backend).
 */
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { AlertTriangle, DatabaseBackup, Download, Loader2, ShieldCheck } from 'lucide-react'
import { getBackups, createBackup, getBackupDownloadUrl } from '@/features/admin/services/backups'

// Un respaldo por semana: con más de 8 días sin uno nuevo, el workflow pudo fallar sin
// que nadie lo viera.
const OVERDUE_DAYS = 8
const DAY_MS = 24 * 60 * 60 * 1000

function fmtDateTime(iso) {
  try {
    return new Date(iso).toLocaleString('es-CL', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return '—'
  }
}

function fmtSize(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function ago(iso, now) {
  const days = Math.floor((now - new Date(iso).getTime()) / DAY_MS)
  if (days <= 0) return 'hoy'
  if (days === 1) return 'hace 1 día'
  return `hace ${days} días`
}

const ORIGIN = {
  auto: { label: 'Automático', cls: 'bg-[#f4f3f8] text-[#55545f]' },
  manual: { label: 'Manual', cls: 'bg-[#e6e6fb] text-[#4338ca]' },
}

export function BackupsTab() {
  const queryClient = useQueryClient()
  const [downloading, setDownloading] = useState(null)
  // Se fija al cargar la pestaña: el «hace N días» no necesita ir al segundo.
  const [now] = useState(() => Date.now())

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin-backups'],
    queryFn: getBackups,
    staleTime: 15_000,
  })
  const backups = data?.backups || []
  const latest = backups[0]
  const overdue = latest && now - new Date(latest.created_at).getTime() > OVERDUE_DAYS * DAY_MS

  const createMutation = useMutation({
    mutationFn: createBackup,
    onSuccess: (res) => {
      toast.success(`Respaldo creado (${fmtSize(res?.backup?.size)})`)
      queryClient.invalidateQueries({ queryKey: ['admin-backups'] })
    },
    onError: (err) => toast.error(err?.message || 'No se pudo crear el respaldo'),
  })

  const handleDownload = async (name) => {
    setDownloading(name)
    try {
      const { url } = await getBackupDownloadUrl(name)
      // El enlace es de Storage y caduca en 60 s: se abre en el acto, sin guardarlo.
      const a = document.createElement('a')
      a.href = url
      a.download = name
      a.rel = 'noopener'
      document.body.appendChild(a)
      a.click()
      a.remove()
    } catch (err) {
      toast.error(err?.message || 'No se pudo descargar el respaldo')
    } finally {
      setDownloading(null)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-[#a9a8b4]">
            Sitio
          </div>
          <h1 className="mt-2 text-[28px] font-bold leading-[1.16] tracking-[-0.014em] text-[#16151b]">
            Respaldos
          </h1>
          <p className="mt-2.5 max-w-[620px] text-[14px] text-[#55545f]">
            Copias de seguridad de la base de datos: usuarios, cursos, matrículas y progreso. Se crea una
            automáticamente cada semana y se guardan las {data?.keep ?? 8} más recientes.
          </p>
        </div>
        <button
          type="button"
          onClick={() => createMutation.mutate()}
          disabled={createMutation.isPending || data?.configured === false}
          className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-[#16151b] px-4 text-[13px] font-semibold text-white transition-colors hover:bg-[#2a2933] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4b46d6] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {createMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <DatabaseBackup className="h-4 w-4" strokeWidth={1.8} />
          )}
          {createMutation.isPending ? 'Creando respaldo…' : 'Crear respaldo ahora'}
        </button>
      </div>

      {data?.configured === false && (
        <div className="flex gap-3 rounded-[12px] border border-[#f1e2b8] bg-[#fdf8ea] p-4 text-[13px] leading-relaxed text-[#6b5413]">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" strokeWidth={1.9} />
          <p>
            Los respaldos todavía no están configurados en el servidor. Faltan estas variables en Railway:{' '}
            <span className="font-mono text-[12px]">{(data.missing || []).join(', ')}</span>.
          </p>
        </div>
      )}

      {latest && (
        <div
          className={`flex gap-3 rounded-[12px] border p-4 text-[13px] leading-relaxed ${
            overdue
              ? 'border-[#f1e2b8] bg-[#fdf8ea] text-[#6b5413]'
              : 'border-[#d5eee2] bg-[#f1faf5] text-[#1d5b3f]'
          }`}
        >
          {overdue ? (
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" strokeWidth={1.9} />
          ) : (
            <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0" strokeWidth={1.9} />
          )}
          <p>
            Último respaldo: <strong className="font-semibold">{ago(latest.created_at, now)}</strong>{' '}
            ({fmtDateTime(latest.created_at)}).
            {overdue && ' Hace más de 8 días que no se crea uno: el respaldo semanal puede estar fallando. Crea uno ahora y avisa a quien mantiene la plataforma.'}
          </p>
        </div>
      )}

      <div className="overflow-hidden rounded-[14px] border border-[#e9e9ee] bg-white">
        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
        ) : isError ? (
          <div className="p-6 text-center text-sm text-[#b42318]">{error?.message || 'No se pudo cargar la lista de respaldos.'}</div>
        ) : backups.length === 0 ? (
          <div className="p-6 text-center text-sm text-[#a9a8b4]">
            {data?.configured === false ? 'Sin respaldos hasta que se configure el servidor.' : 'Aún no hay respaldos.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-[#fcfcfd] text-left">
                  <th className="px-[14px] pb-2.5 pt-3 font-mono text-[9.5px] font-semibold uppercase tracking-[0.12em] text-[#a9a8b4]">Fecha</th>
                  <th className="px-[14px] pb-2.5 pt-3 font-mono text-[9.5px] font-semibold uppercase tracking-[0.12em] text-[#a9a8b4]">Origen</th>
                  <th className="px-[14px] pb-2.5 pt-3 text-right font-mono text-[9.5px] font-semibold uppercase tracking-[0.12em] text-[#a9a8b4]">Tamaño</th>
                  <th className="px-[14px] pb-2.5 pt-3 text-right font-mono text-[9.5px] font-semibold uppercase tracking-[0.12em] text-[#a9a8b4]">Acción</th>
                </tr>
              </thead>
              <tbody>
                {backups.map((b) => {
                  const origin = ORIGIN[b.origin] || ORIGIN.auto
                  return (
                    <tr key={b.name} className="border-t border-[#f2f1f6] transition-colors hover:bg-[#fafafa]">
                      <td className="px-[14px] py-[13px]">
                        <span className="block text-[13.5px] font-semibold text-[#16151b]">{fmtDateTime(b.created_at)}</span>
                        <span className="mt-0.5 block font-mono text-[10.5px] text-[#a9a8b4]">{b.name}</span>
                      </td>
                      <td className="px-[14px] py-[13px]">
                        <span className={`inline-block rounded-[9px] px-2.5 py-1 text-[12px] font-semibold ${origin.cls}`}>
                          {origin.label}
                        </span>
                      </td>
                      <td className="px-[14px] py-[13px] text-right font-mono text-[12.5px] tabular-nums text-[#8b8a95]">{fmtSize(b.size)}</td>
                      <td className="px-[14px] py-[13px] text-right">
                        <button
                          type="button"
                          onClick={() => handleDownload(b.name)}
                          disabled={downloading === b.name}
                          aria-label={`Descargar el respaldo del ${fmtDateTime(b.created_at)}`}
                          className="inline-flex h-8 items-center gap-2 rounded-[10px] border border-[#e3e2ea] px-3 text-[12px] font-semibold text-[#55545f] transition-colors hover:border-[#c4c3cd] hover:text-[#16151b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4b46d6] disabled:opacity-50"
                        >
                          {downloading === b.name ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" strokeWidth={1.8} />}
                          Descargar
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-[11.5px] leading-relaxed text-[#8b8a95]">
        Cada respaldo es una copia completa de la base de datos (<span className="font-mono">.sql.gz</span>).
        Restaurarlo no se hace desde aquí; si lo necesitas, pide ayuda a quien mantiene la plataforma.
      </p>
    </div>
  )
}

export default BackupsTab
