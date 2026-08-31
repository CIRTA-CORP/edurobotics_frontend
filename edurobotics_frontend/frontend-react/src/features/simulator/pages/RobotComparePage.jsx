/**
 * RobotComparePage — los dos visores, lado a lado, con la misma pose.
 *
 * Existe por dos razones:
 *
 * 1. Comparar honestamente. Que el robot «se vea bien» fue durante mucho tiempo un juicio
 *    a ojo, y así se llegó a dibujar un UR5 con mallas de UR5e. Poner los dos juntos con
 *    los mismos ángulos convierte la comparación en algo que se mira una vez y se zanja.
 *
 * 2. No gastar cupo. El simulador admite tres sesiones simultáneas sobre una única máquina
 *    Fly, y mirar un robot no debería consumir una de ellas. Esta página no habla con el
 *    backend: mueve las juntas localmente.
 *
 * Ruta: /robot-compare — es una herramienta de evaluación del change
 * `simulator-urdf-viewer`, no una pantalla para estudiantes.
 */
import { lazy, Suspense, useState } from 'react'
import BabylonViewer from '@/features/simulator/viewer/BabylonViewer'
import { ARM_JOINT_NAMES, GRIPPER_DRIVER_JOINT } from '@/features/simulator/viewer/jointNames'

const UrdfViewer = lazy(() => import('@/features/simulator/viewer/UrdfViewer'))

// La misma pose de la captura que mostró el problema, para comparar contra algo conocido.
const POSE = {
  shoulder_pan_joint: -0.34,
  shoulder_lift_joint: 0.48,
  elbow_joint: -1.54,
  wrist_1_joint: 0.75,
  wrist_2_joint: 0.0,
  wrist_3_joint: 0.0,
  [GRIPPER_DRIVER_JOINT]: 0.0,
}

const HOME = Object.fromEntries(
  [...ARM_JOINT_NAMES, GRIPPER_DRIVER_JOINT].map((name) => [name, 0]),
)

const PRESETS = {
  Pose: POSE,
  Home: HOME,
  Extendido: { ...HOME, shoulder_lift_joint: -1.2, elbow_joint: 1.2 },
}

// Los robots que la web ya puede dibujar. Añadir uno es exportar su URDF y sumar una línea
// aquí: el visor no contiene nada específico de ningún robot. El visor antiguo, en cambio,
// solo sabe dibujar el que lleva transcrito en su código.
const ROBOTS = {
  ur5e: '/robots/ur5e/ur5e_robotiq.urdf',
  ur10e: '/robots/ur10e/ur10e_robotiq.urdf',
}

function Pane({ title, subtitle, tone, children }) {
  return (
    <div className="relative flex min-h-0 flex-1 flex-col border border-slate-800">
      <div className="flex items-baseline justify-between bg-slate-900 px-3 py-2">
        <span className="text-[13px] font-semibold text-white">{title}</span>
        <span className={`text-[11px] ${tone}`}>{subtitle}</span>
      </div>
      <div className="relative min-h-0 flex-1">{children}</div>
    </div>
  )
}

// La pose y la cámara se pueden fijar por URL (`?pose=Home&cam=front&gripper=0.6`) para
// poder capturar una comparación concreta y volver a ella exactamente igual.
function initialFromUrl(key, fallback) {
  try {
    return new URLSearchParams(window.location.search).get(key) ?? fallback
  } catch {
    return fallback
  }
}

export default function RobotComparePage() {
  const [preset, setPreset] = useState(() => {
    const fromUrl = initialFromUrl('pose', 'Pose')
    return fromUrl in PRESETS ? fromUrl : 'Pose'
  })
  const [gripper, setGripper] = useState(() => Number(initialFromUrl('gripper', 0)) || 0)
  const [cameraView, setCameraView] = useState(() => initialFromUrl('cam', 'free'))
  const [robot, setRobot] = useState(() => {
    const fromUrl = initialFromUrl('robot', 'ur5e')
    return fromUrl in ROBOTS ? fromUrl : 'ur5e'
  })

  const angles = { ...PRESETS[preset], [GRIPPER_DRIVER_JOINT]: gripper }

  return (
    <div className="flex h-screen flex-col bg-slate-950 text-slate-200">
      <header className="flex flex-wrap items-center gap-4 border-b border-slate-800 px-4 py-3">
        <div>
          <h1 className="text-sm font-semibold text-white">Comparación de visores</h1>
          <p className="text-[11px] text-slate-400">
            Misma pose en ambos. Sin backend: no ocupa cupo del simulador.
          </p>
        </div>

        <div className="flex items-center gap-1">
          {Object.keys(PRESETS).map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setPreset(name)}
              className={`rounded px-2.5 py-1 text-[12px] ${
                preset === name ? 'bg-white text-slate-900' : 'bg-slate-800 text-slate-300'
              }`}
            >
              {name}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          {['free', 'top', 'front', 'side'].map((view) => (
            <button
              key={view}
              type="button"
              onClick={() => setCameraView(view)}
              className={`rounded px-2.5 py-1 text-[12px] capitalize ${
                cameraView === view ? 'bg-white text-slate-900' : 'bg-slate-800 text-slate-300'
              }`}
            >
              {view}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          {Object.keys(ROBOTS).map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setRobot(name)}
              className={`rounded px-2.5 py-1 text-[12px] ${
                robot === name ? 'bg-emerald-400 text-slate-900' : 'bg-slate-800 text-slate-300'
              }`}
            >
              {name}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 text-[12px] text-slate-400">
          Gripper
          <input
            type="range"
            min="0"
            max="0.8"
            step="0.01"
            value={gripper}
            onChange={(event) => setGripper(Number(event.target.value))}
            className="w-32"
          />
          <span className="w-10 font-mono text-slate-300">{gripper.toFixed(2)}</span>
        </label>
      </header>

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <Pane
          title="Actual (Babylon)"
          subtitle={robot === 'ur5e' ? 'medidas escritas a mano' : `no sabe dibujar un ${robot}`}
          tone="text-rose-400"
        >
          <BabylonViewer jointAngles={angles} cameraView={cameraView} />
        </Pane>
        <Pane title="Nuevo (URDF)" subtitle="leído de la descripción de ROS" tone="text-emerald-400">
          <Suspense fallback={<div className="grid h-full place-items-center text-xs text-slate-500">Cargando…</div>}>
            <UrdfViewer key={robot} jointAngles={angles} cameraView={cameraView} urdf={ROBOTS[robot]} />
          </Suspense>
        </Pane>
      </div>
    </div>
  )
}
