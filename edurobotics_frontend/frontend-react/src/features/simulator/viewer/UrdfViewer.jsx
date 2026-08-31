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

// El diagnóstico se muestra en desarrollo, o a demanda con `?debug=viewer` en producción
// (sirve para saber qué cargó sin abrir la consola).
const SHOW_DIAGNOSTICS = (() => {
  try {
    return import.meta.env.DEV
      || new URLSearchParams(window.location.search).get('debug') === 'viewer'
  } catch {
    return false
  }
})()

// Constante de tiempo del seguimiento suavizado, en segundos. Igual que en el visor
// anterior: el robot se acerca al último objetivo cada frame, independiente del framerate.
const SMOOTH_TAU = 0.12

// Los mismos encuadres que el visor anterior, en coordenadas de ArcRotateCamera de Babylon
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

export default function UrdfViewer({ jointAngles, cameraView = 'free', urdf = DEFAULT_URDF }) {
  const canvasRef = useRef(null)
  const robotRef = useRef(null)
  const targetAnglesRef = useRef(null)
  const currentAnglesRef = useRef({})
  const latestAnglesRef = useRef(null)
  const controlsRef = useRef(null)
  const cameraRef = useRef(null)
  // Diagnóstico en pantalla: qué robot cargó, cuántas mallas entraron o qué falló. Fue lo
  // que hizo legible un fallo en el que el robot cargaba con 22 juntas y cero geometría.
  // Solo en desarrollo o con `?debug=viewer`: un estudiante no tiene por qué verlo.
  const [status, setStatus] = useState('cargando…')

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
        (error) => setStatus(`error al cargar: ${error?.message ?? error}`),
      )
    } catch (error) {
      // Diferido a propósito: actualizar estado de forma síncrona dentro del efecto
      // provoca renders en cascada. Los callbacks de arriba ya son asíncronos.
      queueMicrotask(() => setStatus(`excepción: ${error?.message ?? error}`))
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
      const target = targetAnglesRef.current
      if (robot && target) {
        const alpha = 1 - Math.exp(-dt / SMOOTH_TAU)
        // El brazo, junta por junta. El gripper se gobierna con una sola: las otras cinco
        // son `mimic` en el URDF y siguen solas.
        for (const name of [...ARM_JOINT_NAMES, GRIPPER_DRIVER_JOINT]) {
          const to = target[name]
          if (to === undefined) continue
          const from = currentAnglesRef.current[name] ?? robot.joints[name]?.angle ?? 0
          const value = from + (to - from) * alpha
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
    latestAnglesRef.current = normalized
    targetAnglesRef.current = normalized
  }, [jointAngles])

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
      {SHOW_DIAGNOSTICS && (
        <div className="pointer-events-none absolute bottom-2 left-2 rounded bg-black/60 px-2 py-1 font-mono text-[11px] text-[#a5a1ee]">
          {status}
        </div>
      )}
    </div>
  )
}
