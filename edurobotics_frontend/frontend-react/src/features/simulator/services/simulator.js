import { apiGet, apiPost } from '@/shared/services/api'

/**
 * Gets the current status of the user's simulation environment.
 * Returns: { status: "stopped" | "starting" | "running", message: string }
 */
export const getSimulatorStatus = async () => {
  return apiGet('/api/simulator/status')
}

/**
 * Current session occupancy (#43): { active, max, available }.
 * `available` is false when the simulator is full and the user has no session.
 */
export const getSimulatorCapacity = async () => {
  return apiGet('/api/simulator/capacity')
}

/**
 * Initiates the startup sequence for the simulation environment.
 * Returns: { status: "starting", message: string }
 */
export const startSimulator = async () => {
  return apiPost('/api/simulator/start')
}

/**
 * Stops the simulation environment to save resources.
 * Returns: { status: "stopped", message: string }
 */
export const stopSimulator = async () => {
  return apiPost('/api/simulator/stop')
}
