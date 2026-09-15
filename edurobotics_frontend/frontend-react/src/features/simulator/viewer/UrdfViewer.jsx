/**
 * UrdfViewer — dibuja el robot cargando su descripción URDF.
 *
 * Sustituye la transcripción manual de la cadena cinemática. El visor anterior tenía las
 * medidas copiadas en el código —y estaban mal: eran de un UR5 mientras las mallas son de
 * un UR5e— más correcciones ajustadas a ojo para tapar la diferencia.
 *
 * Aquí no hay ni una sola medida del robot: todas salen de `public/robots/ur5e/*.urdf`,
 * exportado desde el mismo `robot_description` que usa PyBullet. Si el robot cambia, cambia
 * su archivo. Si hay que añadir otro robot, se añade su URDF.
 *
 * Misma interfaz que el visor anterior (`{ jointAngles, cameraView }`), para poder
 * intercambiarlos sin tocar nada aguas arriba.
 */
import { useEffect, useRef, useState } from 'react'
import {
  AmbientLight, Color, DirectionalLight, GridHelper, LoadingManager,
  PerspectiveCamera, Scene, Vector3, WebGLRenderer,
} from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import URDFLoader from 'urdf-loader'
import {
  ARM_JOINT_NAMES, GRIPPER_DRIVER_JOINT, normalizeJointAngles,
} from '@/features/simulator/viewer/jointNames'

// Robot por defecto. El visor no sabe nada de ningún robot en particular: recibe la ruta
// de un URDF y dibuja lo que ese archivo describa.
const DEFAULT_URDF = '/robots/ur5e/ur5e_robotiq.urdf'
// Espejo web del paquete `robot_description` de ROS.
const PACKAGE_ROOT = '/robots/robot_description'

// El diagnóstico se pide con `?debug=viewer`, y en ningún otro caso. Antes salía además en
// cualquier entorno de desarrollo, que es donde se prueba el simulador, así que en la
// práctica estaba siempre en pantalla tapando una esquina del robot sin que nadie lo
// hubiera pedido.
const SHOW_DIAGNOSTICS = (() => {
  try {
    return new URLSearchParams(window.location.search).get('debug') === 'viewer'
  } catch {
    return false
  }
})()

// Separación supuesta entre dos posiciones cuando no viene marcada: los movimientos
// manuales de los deslizadores, y los fotogramas de un backend anterior a las marcas de
// tiempo. Es el ritmo al que el contenedor escribe las posiciones del robot.
const DEFAULT_FRAME_GAP = 0.1

// Encuadres heredados del visor anterior, expresados como cámara orbital
// (alpha alrededor del eje vertical, beta desde el eje vertical, radius distancia). Se
// convierten a una posición cartesiana más abajo, de modo que el encuadre sea idéntico y la
// comparación lado a lado sea honesta.
const CAMERA_PRESETS = {
  free: { alpha: -Math.PI / 2, beta: 1.1, radius: 2.8, target: [0, 0.8, 0] },
  top: { alpha: -Math.PI / 2, beta: 0.05, radius: 3.5, target: [0, 0.5, 0] },
  front: { alpha: -Math.PI / 2, beta: Math.PI / 2, radius: 3.0, target: [0, 0.5, 0] },
  side: { alpha: 0, beta: Math.PI / 2, radius: 3.0, target: [0, 0.5, 0] },
}

function presetToPosition({ alpha, beta, radius, target }) {
  return {
    position: new Vector3(
      target[0] + radius * Math.sin(beta) * Math.cos(alpha),
      target[1] + radius * Math.cos(beta),
      target[2] + radius * Math.sin(beta) * Math.sin(alpha),
    ),
    target: new Vector3(...target),
  }
}

export default function UrdfViewer({ jointAngles, frameTime, cameraView = 'free', urdf = DEFAULT_URDF }) {
  const canvasRef = useRef(null)
  const robotRef = useRef(null)
  // El tramo que se está recorriendo ahora mismo: de dónde viene el brazo, a dónde va, y
  // cuánto tardó el robot de verdad en hacer ese tramo.
  const segmentRef = useRef(null)
  const currentAnglesRef = useRef({})
  const latestAnglesRef = useRef(null)
  const lastFrameTimeRef = useRef(null)
  const controlsRef = useRef(null)
  const cameraRef = useRef(null)
  // Diagnóstico: qué robot cargó y cuánta geometría entró. Fue lo que hizo legible un
  // fallo en el que el robot cargaba con 22 juntas y cero mallas. Solo con `?debug=viewer`:
  // un estudiante no tiene por qué verlo.
  const [status, setStatus] = useState('cargando…')
  // Un fallo de carga es otra cosa y se muestra SIEMPRE. Si el URDF no carga, el visor se
  // queda vacío, y un rectángulo negro sin explicación es indistinguible de un robot que
  // todavía no ha llegado.
  const [loadError, setLoadError] = useState(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const renderer = new WebGLRenderer({ canvas, antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    const scene = new Scene()
    // Paleta del rediseño (change `simulator-dark-redesign`): el lienzo del simulador.
    scene.background = new Color(0x0a0a0c)

    const camera = new PerspectiveCamera(50, 1, 0.01, 100)
    cameraRef.current = camera

    const controls = new OrbitControls(camera, canvas)
    controls.enableDamping = true
    controls.minDistance = 0.5
    controls.maxDistance = 8
    controlsRef.current = controls

    const initial = presetToPosition(CAMERA_PRESETS.free)
    camera.position.copy(initial.position)
    controls.target.copy(initial.target)
    controls.update()

    scene.add(new AmbientLight(0xffffff, 1.6))
    const key = new DirectionalLight(0xffffff, 2.2)
    key.position.set(-1, 2, 1)
    scene.add(key)

    // Rejilla en los grises de la paleta, con el eje central en el acento: sitúa al
    // estudiante sin competir con el robot, que es lo que tiene que mirar.
    const grid = new GridHelper(4, 16, 0x7d79e3, 0x2c2c34)
    scene.add(grid)

    // ── Carga del robot ────────────────────────────────────────────────
    const manager = new LoadingManager()
    const gltfLoader = new GLTFLoader(manager)
    const loader = new URDFLoader(manager)

    // El URDF conserva las URIs `package://robot_description/…` tal como las escribe ROS, y
    // `public/robots/robot_description/` espeja ese paquete. Así el URDF de cualquier robot
    // futuro se resuelve solo, sin reescribir rutas.
    //
    // Sin esto, urdf-loader antepone el directorio del propio URDF a cualquier ruta que no
    // empiece por `package://`, y todas las mallas dan 404 en silencio: el robot carga con
    // sus 22 juntas y cero geometría.
    loader.packages = { robot_description: PACKAGE_ROOT }

    // Las mallas ya están convertidas a .glb y el URDF exportado apunta a ellas. El loader
    // por defecto de urdf-loader solo entiende .stl y .dae, así que hay que darle el de
    // glTF. La firma es (ruta, manager, material, onComplete): el tercer argumento es el
    // material que viene del <material> del URDF, no el callback.
    loader.loadMeshCb = (path, mgr, material, onComplete) => {
      gltfLoader.load(
        path,
        (result) => onComplete(result.scene),
        undefined,
        (error) => {
          console.warn('[UrdfViewer] no se pudo cargar la malla:', path, error)
          onComplete(null, error)
        },
      )
    }

    let disposed = false
    try {
      loader.load(
        urdf,
        (robot) => {
          if (disposed) return
          // El URDF viene en la convención de ROS (Z arriba); three.js usa Y arriba.
          robot.rotation.x = -Math.PI / 2
          scene.add(robot)
          robotRef.current = robot

          // Las mallas llegan después: se cuentan cuando el manager termina, no aquí.
          manager.onLoad = () => {
            let meshes = 0
            robot.traverse((node) => { if (node.isMesh) meshes += 1 })
            // El nombre sale del propio URDF, no de una etiqueta escrita a mano: una
            // etiqueta fija diciendo «ur5e» mientras se dibuja otro robot sería el mismo
            // tipo de dato mentiroso que este trabajo vino a eliminar.
            setStatus(`${robot.robotName} · ${Object.keys(robot.joints).length} juntas · ${meshes} mallas`)
          }
        },
        undefined,
        (error) => setLoadError(`No se pudo cargar el robot: ${error?.message ?? error}`),
      )
    } catch (error) {
      // Diferido a propósito: actualizar estado de forma síncrona dentro del efecto
      // provoca renders en cascada. Los callbacks de arriba ya son asíncronos.
      queueMicrotask(() => setLoadError(`No se pudo cargar el robot: ${error?.message ?? error}`))
    }

    // ── Bucle de render ────────────────────────────────────────────────
    let last = performance.now()
    let frame = 0

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = canvas
      if (!w || !h) return
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }

    const tick = () => {
      frame = requestAnimationFrame(tick)
      const now = performance.now()
      const dt = Math.min((now - last) / 1000, 0.1)
      last = now
      resize()

      const robot = robotRef.current
      const segment = segmentRef.current
      if (robot && segment) {
        // Interpolación entre la posición anterior y la actual, gobernada por el tiempo
        // que el robot tardó de verdad en ir de una a otra.
        //
        // Antes esto perseguía el último objetivo con un filtro exponencial de τ=0,12 s,
        // que necesita ~0,36 s para llegar. Como llegaba una posición nueva cada 0,1 s, el
        // brazo no alcanzaba ninguna: recortaba todas las curvas por dentro y se quedaba a
        // media distancia en cada cambio de dirección. De ahí que pareciera que el robot
        // «no ejecuta todo» — literalmente no pasaba por donde el robot pasó.
        //
        // Al interpolar, cada posición grabada se alcanza exacta, en el instante que le
        // toca, y entre dos posiciones se dibujan los pasos intermedios que hagan falta
        // para llenar el refresco de la pantalla.
        segment.elapsed += dt
        // Acotado a 1: si el siguiente fotograma tarda, el brazo se queda quieto en la
        // última posición conocida en vez de seguir moviéndose hacia un objetivo viejo.
        const t = segment.duration > 0 ? Math.min(segment.elapsed / segment.duration, 1) : 1
        // El brazo, junta por junta. El gripper se gobierna con una sola: las otras cinco
        // son `mimic` en el URDF y siguen solas.
        for (const name of [...ARM_JOINT_NAMES, GRIPPER_DRIVER_JOINT]) {
          const to = segment.to[name]
          if (to === undefined) continue
          const from = segment.from[name] ?? robot.joints[name]?.angle ?? 0
          const value = from + (to - from) * t
          currentAnglesRef.current[name] = value
          robot.setJointValue(name, value)
        }
      }

      controls.update()
      renderer.render(scene, camera)
    }
    frame = requestAnimationFrame(tick)

    const onResize = () => resize()
    window.addEventListener('resize', onResize)

    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', onResize)
      controls.dispose()
      renderer.dispose()
      scene.traverse((obj) => {
        obj.geometry?.dispose?.()
        const material = obj.material
        if (Array.isArray(material)) material.forEach((m) => m.dispose?.())
        else material?.dispose?.()
      })
    }
    // Cambiar de robot reconstruye la escena: es una operación rara y así no hay que
    // razonar sobre estados mezclados de dos robots distintos.
  }, [urdf])

  useEffect(() => {
    if (!jointAngles) return
    const normalized = normalizeJointAngles(jointAngles, latestAnglesRef.current)
    if (!normalized) return

    const previous = segmentRef.current

    // Cuánto tardó el robot en ir de la posición anterior a esta. Se calcula con las marcas
    // de tiempo que manda el backend, que son las de la captura: reproducir con ellas es lo
    // que hace que la animación dure lo que duró la ejecución.
    //
    // Sin marca —deslizadores manuales, o un backend anterior a este cambio— se usa una
    // separación por defecto. No se rompe nada durante un despliegue, que en Railway y
    // Vercel no es simultáneo.
    let duration = DEFAULT_FRAME_GAP
    if (typeof frameTime === 'number' && typeof lastFrameTimeRef.current === 'number') {
      const gap = frameTime - lastFrameTimeRef.current
      // Una marca que retrocede significa que empezó otra ejecución: el tiempo vuelve a
      // cero. Ese tramo no se interpola desde la ejecución anterior.
      if (gap > 0) duration = gap
    }
    lastFrameTimeRef.current = typeof frameTime === 'number' ? frameTime : null

    // El primer fotograma no tiene desde. Se coloca directo: el robot ya estaba ahí, y
    // barrer hasta él desde la postura de reposo sería un movimiento que nadie hizo.
    const from = previous
      ? { ...previous.to, ...currentAnglesRef.current }
      : normalized

    latestAnglesRef.current = normalized
    segmentRef.current = { from, to: normalized, duration: previous ? duration : 0, elapsed: 0 }
  }, [jointAngles, frameTime])

  useEffect(() => {
    const camera = cameraRef.current
    const controls = controlsRef.current
    if (!camera || !controls) return

    const preset = presetToPosition(CAMERA_PRESETS[cameraView] ?? CAMERA_PRESETS.free)
    const fromPosition = camera.position.clone()
    const fromTarget = controls.target.clone()
    const STEPS = 30
    let step = 0

    const id = setInterval(() => {
      step += 1
      const t = step / STEPS
      const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
      camera.position.lerpVectors(fromPosition, preset.position, ease)
      controls.target.lerpVectors(fromTarget, preset.target, ease)
      controls.update()
      if (step >= STEPS) clearInterval(id)
    }, 16)

    return () => clearInterval(id)
  }, [cameraView])

  return (
    <div className="relative h-full w-full">
      <canvas ref={canvasRef} className="block h-full w-full outline-none" style={{ touchAction: 'none' }} />
      {loadError && (
        <div
          role="alert"
          className="pointer-events-none absolute inset-x-4 top-4 rounded-lg border border-[#f87171]/30 bg-[#f87171]/[0.12] px-3 py-2 text-[12.5px] text-[#fca5a5]"
        >
          {loadError}
        </div>
      )}
      {SHOW_DIAGNOSTICS && (
        <div className="pointer-events-none absolute bottom-2 left-2 rounded bg-black/60 px-2 py-1 font-mono text-[11px] text-[#a5a1ee]">
          {status}
        </div>
      )}
    </div>
  )
}
