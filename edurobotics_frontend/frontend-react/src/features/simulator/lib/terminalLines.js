/**
 * Qué se muestra en la terminal del simulador, y cómo.
 *
 * Cada línea llega con el TIPO del mensaje que la trajo (log, success, error…) y se
 * clasifica una sola vez, al entrar. Antes la terminal guardaba un texto suelto y adivinaba
 * el tipo de cada línea buscando palabras: un `print("sin errores")` del alumno salía en
 * rojo, y los colores dependían de mensajes («CMD written», «[robot_api]») que ya no existen.
 *
 * Aquí también se traducen los mensajes que el backend envía en inglés («Done.»,
 * «Executing...»), en el frontend y no en el backend, para que se vean igual con el backend
 * de producción actual y con el nuevo.
 */

/** Tipos de fila. `label` es la etiqueta que se pinta; `null` = sin etiqueta. */
export const KINDS = {
  output:  { label: null },        // lo que imprime el programa del alumno
  system:  { label: 'SISTEMA' },   // conexión, cola, reproducción
  warning: { label: 'AVISO' },     // avisos de robot_api
  stop:    { label: 'PARADA' },    // parada de protección
  error:   { label: 'ERROR' },     // errores y tracebacks
  success: { label: 'LISTO' },     // el programa terminó bien
  meta:    { label: null },        // datos secundarios: tiempo de ejecución
}

const HIDDEN = [
  // El wrapper lo imprime en cada ejecución con la lista de juntas: detalle técnico.
  /^\[sim\] Simulacion lista/,
  // El backend lo manda al terminar de reproducir; la reproducción ya se anunció.
  /^Animation: \d+ frames$/,
]

/**
 * Convierte un mensaje en una fila `{ kind, text }`, o `null` si no se muestra.
 *
 * @param {string} type  tipo del mensaje del backend, o 'local' para los del propio panel
 * @param {string} msg   el texto
 */
export function classifyMessage(type, msg) {
  if (msg == null) return null
  const text = String(msg).replace(/\s+$/, '')
  if (!text) return null
  if (HIDDEN.some((re) => re.test(text))) return null

  if (type === 'success') return { kind: 'success', text: 'Programa terminado' }

  if (type === 'error') {
    const code = text.match(/terminó con código (\d+)/)
    if (code) return { kind: 'error', text: `El programa terminó con un error (código ${code[1]}).` }
    // El backend nombra un botón «▶ Start» que en esta pantalla se llama de otra forma.
    if (/no está corriendo/.test(text)) {
      return { kind: 'error', text: 'El simulador no está encendido. Pulsa «Iniciar simulador» y vuelve a ejecutar.' }
    }
    return { kind: 'error', text: text.replace(/^Error:\s*/, '') }
  }

  if (type === 'done') return null

  // Del propio panel
  const local = {
    'Connecting...': 'Conectando con el simulador…',
    'Connected. Executing...': 'Conectado. Enviando el programa…',
    'Stopped.': 'Ejecución detenida.',
  }
  if (local[text]) return { kind: 'system', text: local[text] }
  const elapsed = text.match(/^Execution time: ([\d.]+)s$/)
  if (elapsed) return { kind: 'meta', text: `Tiempo de ejecución: ${elapsed[1]} s` }

  // Del backend
  if (text === 'Executing...') return { kind: 'system', text: 'Ejecutando en el simulador…' }
  const replay = text.match(/^Reproduciendo el movimiento grabado \(([\d.]+)s\)/)
  if (replay) return { kind: 'system', text: `Reproduciendo el movimiento (${replay[1]} s)…` }
  if (/^En cola|^Es tu turno/.test(text)) return { kind: 'system', text }
  if (/^\[sim\]/.test(text)) return { kind: 'warning', text: text.replace(/^\[sim\]\s*/, '') }

  const warning = text.match(/^\[robot\] Aviso:\s*(.*)$/)
  if (warning) return { kind: 'warning', text: warning[1] }

  // stderr: el traceback de Python, y dentro de él la parada de protección
  const stderr = text.match(/^\[stderr\]\s?(.*)$/)
  if (stderr) {
    const line = stderr[1]
    if (/RobotCollisionError:|Parada de protección/.test(line)) {
      return { kind: 'stop', text: line.replace(/^.*RobotCollisionError:\s*/, '') }
    }
    return { kind: 'error', text: line }
  }

  if (type === 'local-error') return { kind: 'error', text: text.replace(/^Error:\s*/, '') }
  return { kind: 'output', text }
}

/** Estado general de una ejecución, para la etiqueta de la cabecera. */
export function runState(entries, running) {
  if (running) return 'running'
  for (let i = entries.length - 1; i >= 0; i -= 1) {
    const { kind } = entries[i]
    if (kind === 'success') return 'done'
    if (kind === 'error' || kind === 'stop') return 'error'
    if (kind === 'system' && entries[i].text.startsWith('Conectando')) break
  }
  return entries.length ? 'idle' : 'empty'
}
