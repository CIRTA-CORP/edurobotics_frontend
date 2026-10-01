/**
 * Respaldos de la base de datos (change `database-backups`). Solo administradores.
 *
 * Sin caché a propósito: la lista tiene que reflejar el respaldo recién creado, y el enlace
 * de descarga caduca a los 60 s.
 */
import { apiGet, apiPost } from '@/shared/services/api'

export const getBackups = () => apiGet('/api/admin/backups')

// Solo invalida lo suyo: crear un respaldo no cambia ningún otro dato.
export const createBackup = () => apiPost('/api/admin/backups', {}, { invalidate: '/api/admin/backups' })

/** Enlace firmado, válido 60 s. Se pide justo antes de descargar. */
export const getBackupDownloadUrl = (name) =>
  apiGet(`/api/admin/backups/${encodeURIComponent(name)}/download`)
