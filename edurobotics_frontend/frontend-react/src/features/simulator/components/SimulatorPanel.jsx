import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { Loader2, Play, SlidersHorizontal, AlertCircle, Globe, ArrowDown, Focus, MoveRight, Users } from "lucide-react";
import { startSimulator } from '@/features/simulator/services/simulator';
import { useSimulatorStatus, refreshSimulatorStatus, setSimulatorStatus } from '@/features/simulator/lib/simulatorStatus';
import JointSliders from "./JointSliders";

// Visor basado en URDF: lee la descripción del robot desde el mismo `robot_description`
// que usa PyBullet, en vez de llevar sus medidas transcritas en el código. Es el visor por
// defecto desde el change `simulator-urdf-viewer`.
//
// Va en `lazy` porque arrastra three.js: así solo lo descarga quien abre el simulador.
const UrdfViewer = lazy(() => import('@/features/simulator/viewer/UrdfViewer'));

const DEFAULT_ANGLES = {
  shoulder_pan_joint: 0, shoulder_lift_joint: 0, elbow_joint: 0,
  wrist_1_joint: 0,      wrist_2_joint: 0,       wrist_3_joint: 0,
};

// Cámaras con iconos SVG (canvas Simulador §sobre el visor).
const CAMERA_VIEWS = [
  { id: "free",  label: "Libre",    Icon: Globe },
  { id: "top",   label: "Superior", Icon: ArrowDown },
  { id: "front", label: "Frente",   Icon: Focus },
  { id: "side",  label: "Lado",     Icon: MoveRight },
];


/** Ilustración del brazo (canvas SimuladorInicio): la usa la pantalla de inicio. */
function RobotIllustration() {
  return (
    <svg viewBox="0 0 260 170" className="mx-auto block h-[170px] w-[260px]">
      <ellipse cx="118" cy="138" rx="52" ry="8" fill="rgba(0,0,0,0.55)" />
      <path d="M100 137h36l-5-19h-26z" fill="rgba(255,255,255,0.12)" stroke="#5a5a66" strokeWidth="1.8" strokeLinejoin="round" />
      <g stroke="#dcdbe4" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M118 118V72" strokeWidth="12" />
        <path d="M118 72l46-24" strokeWidth="10" />
        <path d="M164 48l30 20" strokeWidth="8" />
      </g>
      <g stroke="#a5a1ee" strokeWidth="2.4" fill="none" strokeLinecap="round">
        <path d="M194 68l11 7 M194 68l2-12" />
      </g>
      <circle cx="118" cy="118" r="9.5" fill="#0a0a0c" stroke="#dcdbe4" strokeWidth="2.4" />
      <circle cx="118" cy="72" r="8.5" fill="#0a0a0c" stroke="#dcdbe4" strokeWidth="2.4" />
      <circle cx="164" cy="48" r="7.5" fill="#0a0a0c" stroke="#dcdbe4" strokeWidth="2.4" />
      <circle cx="194" cy="68" r="6.5" fill="#0a0a0c" stroke="#a5a1ee" strokeWidth="2.4" />
    </svg>
  );
}

/**
 * Aviso de turno, encima del visor.
 *
 * Va aquí y no solo en la terminal porque es donde el alumno está mirando
 * mientras espera a que su programa corra, y porque una espera de varios
 * segundos contada en una línea de texto pequeña se pierde.
 */
function QueueOverlay({ position }) {
  return (
    <div className="absolute inset-0 z-30 grid place-items-center bg-[#0a0a0c]/85 backdrop-blur-sm">
      <div className="w-[360px] text-center">
        <div className="mx-auto grid h-[58px] w-[58px] place-items-center rounded-[18px] border border-[#7d79e3]/30 bg-[#7d79e3]/[0.12]">
          <Users className="h-6 w-6 text-[#a5a1ee]" strokeWidth={1.7} />
        </div>
        <h3 className="mt-5 text-[22px] font-bold leading-[1.2] tracking-[-0.014em] text-[#f4f4f6]">
          Esperando tu turno
        </h3>
        <div className="mt-4 inline-flex h-9 items-center gap-2.5 rounded-full border border-[#2c2c34] bg-[#101014]/80 px-4">
          <span className="h-[7px] w-[7px] animate-pulse rounded-full bg-[#a5a1ee]" />
          <span className="text-[13px] font-semibold text-[#a5a1ee]">
            {position === 1 ? "Eres el siguiente" : `Puesto ${position} en la fila`}
          </span>
        </div>
        <p className="mx-auto mt-4 max-w-[300px] text-[13.5px] leading-[1.6] text-[#a1a0ab]">
          Hay un solo robot, así que se ejecuta de a uno. Tu programa arrancará
          solo cuando te toque — no hace falta que pulses nada.
        </p>
        <p className="mt-4 font-mono text-[11px] text-[#55555f]">
          Puedes seguir editando tu código mientras esperas
        </p>
      </div>
    </div>
  );
}

// El arranque se da por fallido a los 2 minutos. Es lo único que se sabe con certeza del
// tiempo de arranque, así que es lo que se le dice al alumno.
const START_TIMEOUT_MS = 120000;

/** Tiempo transcurrido desde `since`, en m:ss, que se actualiza cada segundo. */
function Elapsed({ since }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const secs = Math.max(0, Math.floor((now - since) / 1000));
  return <span className="tabular-nums">{Math.floor(secs / 60)}:{String(secs % 60).padStart(2, "0")}</span>;
}

// La pantalla de arranque decía «te avisamos al terminar» y no había ningún aviso. Este es
// el aviso: si el alumno está en otra pestaña cuando el simulador queda listo, el título de
// la pestaña lo dice, y vuelve a ser el de siempre cuando regresa.
function announceReadyInTitle() {
  if (typeof document === "undefined" || !document.hidden) return;
  const original = document.title;
  document.title = `Simulador listo · ${original}`;
  const restore = () => {
    if (document.hidden) return;
    document.title = original;
    document.removeEventListener("visibilitychange", restore);
  };
  document.addEventListener("visibilitychange", restore);
}

export default function SimulatorPanel({ jointAngles, frameTime, queue, onCopyToEditor }) {
  const { status, loaded } = useSimulatorStatus();
  const [showSliders, setShowSliders] = useState(false);
  const [manualAngles, setManualAngles] = useState(DEFAULT_ANGLES);
  const [cameraView, setCameraView] = useState("free");
  // Desde que el alumno pulsa Iniciar hasta que el servidor responde «running». Hace falta
  // aparte del estado del servidor: justo después de pedir el arranque, un sondeo todavía
  // puede responder «stopped» y la pantalla volvería a ofrecer el botón.
  const [startRequested, setStartRequested] = useState(false);
  const [startError, setStartError] = useState(null);
  // Desde cuándo se cuenta el tiempo de arranque: el clic, o la apertura de la página si el
  // servidor ya venía arrancando.
  const [mountedAt] = useState(() => Date.now());
  const [startedAt, setStartedAt] = useState(null);
  const startPollRef = useRef(null);
  const startTimeoutRef = useRef(null);

  const serverRunning = status === "running";
  const startingServer = !serverRunning && (startRequested || status === "starting");
  const loadingStatus = !loaded;

  useEffect(() => () => {
    clearInterval(startPollRef.current);
    clearTimeout(startTimeoutRef.current);
  }, []);

  const stopStartWatch = () => {
    clearInterval(startPollRef.current);
    clearTimeout(startTimeoutRef.current);
    startPollRef.current = null;
  };

  const handleStart = async () => {
    setStartRequested(true);
    setStartedAt(Date.now());
    setStartError(null);
    try {
      await startSimulator();
      setSimulatorStatus("starting");
      // Mientras arranca se consulta más a menudo que el sondeo general (cada 2 s y no 5).
      startPollRef.current = setInterval(async () => {
        if (await refreshSimulatorStatus() === "running") {
          stopStartWatch();
          setStartRequested(false);
          announceReadyInTitle();
        }
      }, 2000);
      startTimeoutRef.current = setTimeout(() => {
        stopStartWatch();
        setStartRequested(false);
        setStartError("El simulador tardó más de 2 minutos en encender. Inténtalo de nuevo.");
      }, START_TIMEOUT_MS);
    } catch (err) {
      setStartRequested(false);
      setStartError(err.message || "No se pudo iniciar el simulador.");
    }
  };

  // Si están llegando fotogramas del servidor. Se marca durante el render, al cambiar la
  // prop, y no en el efecto: un setState síncrono en el efecto pinta dos veces cada
  // fotograma. El efecto solo programa el «ya no llegan más».
  const [isAnimating, setIsAnimating] = useState(false);
  const [lastAngles, setLastAngles] = useState(jointAngles);
  const animTimeoutRef = useRef(null);
  if (jointAngles !== lastAngles) {
    setLastAngles(jointAngles);
    if (jointAngles && !isAnimating) setIsAnimating(true);
  }

  useEffect(() => {
    if (!jointAngles) return;
    clearTimeout(animTimeoutRef.current);
    animTimeoutRef.current = setTimeout(() => {
      setIsAnimating(false);
      setManualAngles(jointAngles);
    }, 600);
  }, [jointAngles]);

  const showStartScreen = !serverRunning && !loadingStatus && !startingServer;
  // La vista previa de posturas solo cambia lo que se dibuja: el robot no se mueve. Al
  // cerrarla, el visor vuelve a la pose real. Se quitó «Posición de inicio», que hacía lo
  // mismo pero parecía una orden al robot: el visor quedaba mostrando una pose que no era la
  // real, y al ejecutar parecía que el robot saltaba.
  const effectiveAngles = isAnimating ? jointAngles
                        : showSliders ? manualAngles
                        : jointAngles;
  const handleSliderChange = (angles) => setManualAngles(angles);
  const handleCopyToEditor = (angles) => onCopyToEditor?.(angles);
  // Al abrir la vista previa, se parte de la pose real del robot, no de la última que se
  // dejó en los deslizadores.
  const toggleSliders = () => {
    if (!showSliders && jointAngles) setManualAngles(jointAngles);
    setShowSliders((s) => !s);
  };

  return (
    <div id="right-panel" className="pointer-events-auto relative flex h-full w-full flex-row bg-[#0a0a0c]">
      {/* Por encima de cualquier estado del panel: esperando turno, lo que
          importa es la espera, no si el servidor está levantando o en línea. */}
      {queue && <QueueOverlay position={queue.position} />}
      {serverRunning && (
        <>
          {/* 3D viewer — takes remaining width */}
          <div className="relative min-w-0 flex-1">
            <Suspense fallback={<div className="grid h-full w-full place-items-center bg-[#0a0a0c] text-xs text-[#6e6d78]">Cargando visor 3D…</div>}>
              {/* El instante de captura solo acompaña a los fotogramas del servidor. Los
                  deslizadores manuales no tienen grabación detrás, así que el visor los
                  interpola con su separación por defecto. */}
              <UrdfViewer
                jointAngles={effectiveAngles}
                frameTime={effectiveAngles === jointAngles ? frameTime : undefined}
                cameraView={cameraView}
              />
            </Suspense>

            {/* Estado del programa — top-left (canvas §estado del programa) */}
            <div
              className={`absolute left-3.5 top-3.5 z-20 inline-flex h-8 items-center gap-2 rounded-full border px-3.5 text-xs font-semibold backdrop-blur-md transition-colors duration-300 ${
                isAnimating
                  ? "border-[#7d79e3]/30 bg-[#7d79e3]/[0.14] text-[#a5a1ee]"
                  : "border-[#2c2c34] bg-[#101014]/80 text-[#a1a0ab]"
              }`}
            >
              <span
                className={`h-[7px] w-[7px] rounded-full transition-colors duration-300 ${isAnimating ? "animate-pulse bg-[#a5a1ee]" : "bg-[#6e6d78]"}`}
              />
              {isAnimating ? "Moviendo" : "En reposo"}
            </div>

            {/* Controles del visor — top-right */}
            <div className="absolute right-3.5 top-3.5 z-20 flex items-center gap-2">
              <div className="flex items-center gap-[2px] rounded-[10px] border border-[#2c2c34] bg-[#101014]/80 p-[3px] backdrop-blur-md">
                {CAMERA_VIEWS.map((view) => {
                  // Desestructurado en una const: ESLint no cuenta el uso en JSX de un parámetro
                  const { id, label, Icon } = view;
                  return (
                    <button
                      key={id}
                      onClick={() => setCameraView(id)}
                      title={`Cámara: ${label}`}
                      aria-label={`Cámara: ${label}`}
                      aria-pressed={cameraView === id}
                      className={`grid h-[30px] w-8 place-items-center rounded-[7px] transition-colors ${
                        cameraView === id
                          ? "bg-[#7d79e3]/[0.14] text-[#a5a1ee]"
                          : "text-[#6e6d78] hover:text-[#f4f4f6]"
                      }`}
                    >
                      <Icon className="h-4 w-4" strokeWidth={1.8} />
                    </button>
                  );
                })}
              </div>

              <button
                onClick={toggleSliders}
                className={`grid h-[34px] w-[34px] place-items-center rounded-[10px] border backdrop-blur-md transition-colors ${
                  showSliders
                    ? "border-[#7d79e3]/40 bg-[#7d79e3]/[0.14] text-[#a5a1ee]"
                    : "border-[#2c2c34] bg-[#101014]/80 text-[#a1a0ab] hover:text-[#f4f4f6]"
                }`}
                title="Vista previa de posturas"
                aria-label="Vista previa de posturas"
                aria-pressed={showSliders}
              >
                <SlidersHorizontal className="h-4 w-4" strokeWidth={1.8} />
              </button>
            </div>
          </div>

          {/* Slider panel — visible only when toggled */}
          {showSliders && (
            <JointSliders angles={manualAngles} onChange={handleSliderChange} onCopyToEditor={handleCopyToEditor} />
          )}
        </>
      )}

      {(!serverRunning || loadingStatus || startingServer) && (
        <div className="absolute inset-0 z-10 flex items-center justify-center overflow-hidden">
          {/* Fondo de banda de marca: puntos con máscara + resplandor inferior
              (canvas SimuladorInicio; reemplaza los blobs azules animados). */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.42) 1px, transparent 1px)",
              backgroundSize: "26px 26px",
              WebkitMaskImage: "radial-gradient(58% 70% at 50% 76%, #000 5%, transparent 68%)",
              maskImage: "radial-gradient(58% 70% at 50% 76%, #000 5%, transparent 68%)",
            }}
          />
          <div className="pointer-events-none absolute bottom-0 left-1/2 h-[190px] w-[40%] -translate-x-1/2 translate-y-1/2 rounded-full bg-white/[0.32] blur-[90px]" />

          {startingServer ? (
            /* ── Levantando el entorno ─────────────────────── */
            <div className="relative z-10 w-[460px] px-8 text-center">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6e6d78]">Simulador ROS2 · UR5e</p>
              <h2 className="mt-4 text-[34px] font-bold leading-[1.14] tracking-[-0.016em] text-[#f4f4f6]">
                Levantando el entorno
              </h2>

              <div className="relative mx-auto mt-7 h-[3px] w-[260px] overflow-hidden rounded-full bg-[#23232a]">
                <span className="sim-start-slide absolute top-0 h-full w-[40%] rounded-full bg-[#7d79e3]" />
              </div>

              {/* Lo que se sabe de verdad: cuánto lleva. El backend no informa en qué fase va, así
                  que no se muestran pasos: antes eran tres escritos a mano que nunca avanzaban. */}
              <p className="mt-7 font-mono text-[28px] font-semibold text-[#f4f4f6]">
                <Elapsed since={startedAt ?? mountedAt} />
              </p>
              <p className="mt-1 text-[12px] text-[#6e6d78]">tiempo transcurrido</p>

              <p className="mx-auto mt-6 max-w-[360px] text-[13.5px] leading-[1.65] text-[#a1a0ab]">
                Se está encendiendo la máquina del simulador en la nube, con ROS2 y el modelo del UR5e.
                Puede tardar hasta 2 minutos.
              </p>
              <p className="mt-4 font-mono text-[11px] text-[#55555f]">Puedes cambiar de pestaña: el título te avisará cuando esté listo</p>
            </div>
          ) : showStartScreen ? (
            /* ── Listo para programar ─────────────────────── */
            <div className="relative z-10 w-[520px] px-8 text-center">
              <RobotIllustration />

              <p className="mt-6 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6e6d78]">Simulador ROS2 · UR5e</p>
              <h2 className="mt-4 text-[38px] font-bold leading-[1.12] tracking-[-0.018em] text-[#f4f4f6]">
                Listo para programar
              </h2>
              <p className="mx-auto mt-3.5 max-w-[400px] text-[15.5px] leading-[1.66] text-[#a1a0ab]">
                Enciende el entorno para ejecutar tu código y ver en 3D cómo se mueve el brazo.
              </p>

              {startError && (
                <div className="mx-auto mt-5 flex max-w-[400px] items-start gap-2.5 rounded-[11px] border border-[#f08099]/30 bg-[#f08099]/[0.1] p-3 text-left">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#f08099]" />
                  <p className="text-xs leading-relaxed text-[#f08099]">{startError}</p>
                </div>
              )}

              <div className="mt-8 flex items-center justify-center gap-3">
                <button
                  onClick={handleStart}
                  className="inline-flex h-12 items-center justify-center gap-2.5 rounded-xl bg-[#f4f4f6] px-6 text-[14.5px] font-semibold text-[#16151b] transition-colors hover:bg-white"
                >
                  <Play className="h-4 w-4 fill-current" />
                  Iniciar simulador
                </button>
              </div>
              <p className="mt-4.5 font-mono text-[11px] text-[#55555f]">Puede tardar hasta 2 minutos en encender</p>
            </div>
          ) : (
            /* ── Initial loading ──────────────────────────── */
            <div className="relative z-10 flex flex-col items-center gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-[#a5a1ee]" />
              <p className="text-sm text-[#6e6d78]">Comprobando el estado del simulador…</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
