/**
 * Contexto del panel de administración y su hook de acceso.
 *
 * El estado lo aporta <AdminProvider> (AdminProvider.jsx); este archivo solo
 * expone el contexto y `useAdmin()`, para que el proveedor quede en un archivo
 * que exporta únicamente componentes (Fast Refresh).
 */
import { createContext, useContext } from 'react'

export const AdminContext = createContext(null)

export function useAdmin() {
  const context = useContext(AdminContext)
  if (!context) {
    throw new Error('useAdmin must be used within AdminProvider')
  }
  return context
}
