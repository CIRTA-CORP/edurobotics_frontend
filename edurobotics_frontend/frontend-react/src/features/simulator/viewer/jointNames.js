/**
 * Normalización de los nombres de junta que llegan por WebSocket.
 *
 * El backend puede mandarlos con prefijo (`ur5/shoulder_pan_joint`), sin sufijo
 * (`shoulder_pan`) o completos. Esta tabla los lleva a un nombre canónico para que un
 * renombrado aguas arriba no rompa la animación.
 *
 * Usado por el visor URDF para que
 * ambos hablen exactamente el mismo idioma con el backend.
 */

export const ARM_JOINT_NAMES = [
  'shoulder_pan_joint',
  'shoulder_lift_joint',
  'elbow_joint',
  'wrist_1_joint',
  'wrist_2_joint',
  'wrist_3_joint',
]

export const GRIPPER_JOINT_NAMES = [
  'robotiq_85_left_knuckle_joint',
  'robotiq_85_right_knuckle_joint',
  'robotiq_85_left_inner_knuckle_joint',
  'robotiq_85_right_inner_knuckle_joint',
  'robotiq_85_left_finger_tip_joint',
  'robotiq_85_right_finger_tip_joint',
]

/**
 * En el URDF real las cinco juntas restantes del gripper son `mimic` de esta: basta con
 * fijar ésta y el resto sigue. El visor antiguo las movía por separado, que es la razón
 * por la que los dedos se separaban al cerrar.
 */
export const GRIPPER_DRIVER_JOINT = 'robotiq_85_left_knuckle_joint'

export const ALL_JOINT_NAMES = [...ARM_JOINT_NAMES, ...GRIPPER_JOINT_NAMES]

export const JOINT_ALIASES = {
  shoulder_pan_joint: ['shoulder_pan', 'shoulder_pan_joint', 'ur5/shoulder_pan_joint'],
  shoulder_lift_joint: ['shoulder_lift', 'shoulder_lift_joint', 'ur5/shoulder_lift_joint'],
  elbow_joint: ['elbow', 'elbow_joint', 'ur5/elbow_joint'],
  wrist_1_joint: ['wrist_1', 'wrist_1_joint', 'ur5/wrist_1_joint'],
  wrist_2_joint: ['wrist_2', 'wrist_2_joint', 'ur5/wrist_2_joint'],
  wrist_3_joint: ['wrist_3', 'wrist_3_joint', 'ur5/wrist_3_joint'],
  robotiq_85_left_knuckle_joint: [
    'robotiq_85_left_knuckle_joint', 'left_knuckle', 'finger_joint',
  ],
  robotiq_85_right_knuckle_joint: ['robotiq_85_right_knuckle_joint', 'right_knuckle'],
  robotiq_85_left_inner_knuckle_joint: [
    'robotiq_85_left_inner_knuckle_joint', 'left_inner_knuckle',
  ],
  robotiq_85_right_inner_knuckle_joint: [
    'robotiq_85_right_inner_knuckle_joint', 'right_inner_knuckle',
  ],
  robotiq_85_left_finger_tip_joint: [
    'robotiq_85_left_finger_tip_joint', 'left_finger_tip',
  ],
  robotiq_85_right_finger_tip_joint: [
    'robotiq_85_right_finger_tip_joint', 'right_finger_tip',
  ],
}

export function findJointValue(rawAngles, canonicalName) {
  const aliases = JOINT_ALIASES[canonicalName] || [canonicalName]
  for (const key of Object.keys(rawAngles)) {
    const stripped = key.includes('/') ? key.split('/').pop() : key
    if (aliases.includes(key) || aliases.includes(stripped)) {
      return rawAngles[key]
    }
  }
  return undefined
}

/**
 * Lleva los ángulos crudos del WebSocket a nombres canónicos. Los que no llegan en este
 * frame conservan su valor anterior (`fallback`), para que una junta ausente no salte a cero.
 */
export function normalizeJointAngles(rawAngles, fallback) {
  if (!rawAngles || typeof rawAngles !== 'object') return null
  const out = {}
  for (const name of ALL_JOINT_NAMES) {
    const value = findJointValue(rawAngles, name)
    if (typeof value === 'number') {
      out[name] = value
    } else if (fallback && typeof fallback[name] === 'number') {
      out[name] = fallback[name]
    }
  }
  return out
}
