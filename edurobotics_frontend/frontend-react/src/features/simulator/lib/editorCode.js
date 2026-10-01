/**
 * Código que se añade al programa desde la vista previa de posturas («Añadir al editor»).
 *
 * Antes este botón REEMPLAZABA el editor entero por una sola línea `robot.move_joints(...)`:
 * sin `from robot_api import Robot` ni `robot = Robot()`, así que al ejecutarla daba
 * NameError, y además se perdía lo que el alumno tenía escrito.
 *
 * Ahora se calcula qué falta y se añade lo justo: la llamada al final, y la cabecera solo
 * si no está. Si el alumno llamó a su robot de otra forma (`r = Robot()`), se usa su nombre.
 */

export const ARM_JOINTS = [
  'shoulder_pan_joint',
  'shoulder_lift_joint',
  'elbow_joint',
  'wrist_1_joint',
  'wrist_2_joint',
  'wrist_3_joint',
]

const IMPORT_FROM = /^\s*from\s+robot_api\s+import\s+[^\n#]*\bRobot\b/m
const IMPORT_MODULE = /^\s*import\s+robot_api\b/m
const INSTANCE = /^\s*([A-Za-z_]\w*)\s*=\s*(?:robot_api\.)?Robot\(\s*\)/m

/** La llamada `move_joints` con los ángulos dados, en radianes con tres decimales. */
export function buildMoveCall(angles, varName = 'robot', duration = 2.0) {
  const lines = ARM_JOINTS.map((j) => `    "${j}": ${Number(angles?.[j] ?? 0).toFixed(3)},`).join('\n')
  return `${varName}.move_joints({\n${lines}\n}, duration=${duration.toFixed(1)})`
}

/**
 * Qué insertar en `program` para añadirle un movimiento a `angles`.
 *
 * @returns {{ prefix: string, suffix: string, varName: string }}
 *   `prefix` va al principio del programa (vacío si no hace falta) y `suffix` al final.
 */
export function planInsertion(program, angles) {
  const text = program ?? ''
  const hasFrom = IMPORT_FROM.test(text)
  const hasModule = IMPORT_MODULE.test(text)
  const instance = text.match(INSTANCE)
  const varName = instance ? instance[1] : 'robot'

  let prefix = ''
  let suffix = ''

  if (!hasFrom && !hasModule) {
    prefix = 'from robot_api import Robot\n\n'
  }

  // La instancia se crea justo antes de la llamada: vale en cualquier punto del programa,
  // y así no hay que adivinar dónde terminan los imports del alumno.
  const needsInstance = !instance
  const robotClass = hasModule && !hasFrom ? 'robot_api.Robot' : 'Robot'

  const body = text.replace(/\s+$/, '')
  const sep = body ? '\n\n' : ''
  if (needsInstance) suffix += `${sep}${varName} = ${robotClass}()\n`
  suffix += `${needsInstance ? '\n' : sep}${buildMoveCall(angles, varName)}\n`

  // `bodyLength`: hasta dónde llega el programa sin los espacios y líneas en blanco finales.
  // Quien inserte reemplaza desde ahí hasta el final, para que el añadido empiece limpio.
  return { prefix, suffix, varName, bodyLength: body.length }
}
