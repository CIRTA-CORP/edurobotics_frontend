/**
 * Comprueba, sin navegador, que el gripper se mueve como el mecanismo que es.
 *
 * El Robotiq 85 es un cuadrilátero articulado: una sola entrada gobierna los seis
 * eslabones, y en el URDF eso se expresa con cinco juntas `mimic`. El visor anterior movía
 * las seis por separado con signos elegidos a mano, y por eso los dedos se separaban al
 * cerrar.
 *
 * Aquí se mueve SOLO la junta motriz y se verifica que las cinco restantes la siguen y que
 * la punta del dedo efectivamente recorre distancia. Era el mayor riesgo técnico del
 * change: si urdf-loader no resolviera el lazo, convenía saberlo antes de seguir.
 *
 * Uso: node scripts/check-gripper-linkage.mjs
 */
import { JSDOM } from 'jsdom'
import { readFileSync } from 'node:fs'
import URDFLoader from 'urdf-loader'
import { LoadingManager, Vector3 } from 'three'

const dom = new JSDOM('')
global.DOMParser = dom.window.DOMParser
// urdf-loader comprueba `data instanceof Document`, así que Document tiene que ser el
// mismo constructor que produce este DOMParser.
global.Document = dom.window.Document
global.Element = dom.window.Element

const URDF = 'public/robots/ur5e/ur5e_robotiq.urdf'
const loader = new URDFLoader(new LoadingManager())
loader.packages = ''
// Sin mallas: solo interesa la cadena cinemática.
loader.loadMeshCb = (_path, _mgr, _material, onComplete) => onComplete(null)

const robot = loader.parse(readFileSync(URDF, 'utf8'))

const DRIVER = 'robotiq_85_left_knuckle_joint'
const FOLLOWERS = Object.keys(robot.joints).filter(
  (n) => n.startsWith('robotiq_85_') && n !== DRIVER && robot.joints[n].jointType !== 'fixed',
)

console.log('juntas del robot:', Object.keys(robot.joints).length)
console.log('motriz:', DRIVER)
console.log('seguidoras:', FOLLOWERS.length, '\n')

const tipName = 'robotiq_85_left_finger_tip_link'
const tip = robot.links[tipName]

const sample = (angle) => {
  robot.setJointValue(DRIVER, angle)
  robot.updateMatrixWorld(true)
  const p = new Vector3()
  tip.getWorldPosition(p)
  return {
    followers: FOLLOWERS.map((n) => robot.joints[n].angle),
    tip: p,
  }
}

const open = sample(0)
const closed = sample(0.7)

console.log('abierto (0.00 rad) → seguidoras:', open.followers.map((a) => a.toFixed(3)).join(', '))
console.log('cerrado (0.70 rad) → seguidoras:', closed.followers.map((a) => a.toFixed(3)).join(', '))

const allFollow = closed.followers.every((a) => Math.abs(a - 0.7) < 1e-6)
const tipMoved = open.tip.distanceTo(closed.tip)

console.log('\n¿todas las mimic siguieron a la motriz?', allFollow ? 'SÍ' : 'NO')
console.log(`la punta del dedo se desplazó ${(tipMoved * 1000).toFixed(1)} mm`)

if (!allFollow || tipMoved < 0.005) {
  console.log('\n✗ el lazo cerrado NO se resuelve como se esperaba')
  process.exit(1)
}
console.log('\n✓ el gripper se mueve como un cuadrilátero articulado con una sola entrada')
