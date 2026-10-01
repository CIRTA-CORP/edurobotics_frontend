/**
 * Estado del servidor del simulador, compartido por toda la pantalla.
 *
 * Antes la cabecera y el panel del robot lo consultaban cada uno por su cuenta (cada 8 s y
 * cada 5 s) y durante unos segundos podían decir cosas distintas: «Servidor apagado» arriba
 * y el visor ya encendido al lado. Ahora hay una sola consulta periódica, que corre mientras
 * haya algún componente suscrito, y todos leen el mismo valor.
 */
import { useSyncExternalStore } from 'react'
import { getSimulatorStatus } from '@/features/simulator/services/simulator'

const POLL_MS = 5000

/** `status`: 'stopped' | 'starting' | 'running'. `loaded`: ya hubo una respuesta. */
let state = { status: 'stopped', loaded: false }
const listeners = new Set()
let timer = null
let inflight = null

function emit(next) {
  state = { ...state, ...next }
  listeners.forEach((listener) => listener())
}

const normalize = (status) => (status === 'running' || status === 'starting' ? status : 'stopped')

/** Pide el estado ahora. Si ya hay una petición en vuelo, devuelve esa. */
export function refreshSimulatorStatus() {
  if (!inflight) {
    inflight = getSimulatorStatus()
      .then((res) => normalize(res?.status))
      // Sin respuesta, se trata como apagado: es lo que hacían los dos sondeos anteriores.
      .catch(() => 'stopped')
      .then((status) => {
        emit({ status, loaded: true })
        return status
      })
      .finally(() => { inflight = null })
  }
  return inflight
}

/** Fija el estado sin esperar al siguiente sondeo (por ejemplo, tras pedir el arranque). */
export function setSimulatorStatus(status) {
  emit({ status: normalize(status), loaded: true })
}

function subscribe(listener) {
  listeners.add(listener)
  if (listeners.size === 1) {
    refreshSimulatorStatus()
    timer = setInterval(refreshSimulatorStatus, POLL_MS)
  }
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) {
      clearInterval(timer)
      timer = null
    }
  }
}

const getSnapshot = () => state

export function useSimulatorStatus() {
  return useSyncExternalStore(subscribe, getSnapshot)
}
