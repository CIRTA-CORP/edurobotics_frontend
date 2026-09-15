import { useState, useEffect, useCallback, useRef, lazy, Suspense } from "react";
import { Loader2, Play, SlidersHorizontal, Home, AlertCircle, Globe, ArrowDown, Focus, MoveRight } from "lucide-react";
import { getSimulatorStatus, startSimulator } from '@/features/simulator/services/simulator';
import JointSliders from "./JointSliders";

// Visor basado en URDF: lee la descripción del robot desde el mismo `robot_description`
// que usa PyBullet, en vez de llevar sus medidas transcritas en el código. Es el visor por
// defecto desde el change `simulator-urdf-viewer`.
//
// Va en `lazy` porque arrastra three.js: así solo lo descarga quien abre el simulador.
const UrdfViewer = lazy(() => import('@/features/simulator/viewer/UrdfViewer'));

// Babylon TAMBIÉN va en `lazy`, y esto importa más de lo que parece: importado de forma
// estática entraba en el grafo del chunk del simulador y se descargaba en toda visita a
// /simulator (1.430 kB gzip) aunque el visor que se renderiza sea el URDF (184 kB gzip),
// anulando en runtime la ganancia de haber cambiado de motor.
const BabylonViewer = lazy(() => import('@/features/simulator/viewer/BabylonViewer'));

// El visor anterior sigue accesible con `?viewer=babylon` mientras CIRTA no formalice la
// decisión, para poder mostrar el antes y el después sin desplegar dos versiones.
const useLegacyViewer = () => {
  try {
    return new URLSearchParams(window.location.search).get('viewer') === 'babylon';
  } catch {
    return false;
  }
};

const DEFAULT_ANGLES = {
  shoulder_pan_joint: 0, shoulder_lift_joint: 0, elbow_joint: 0,
  wrist_1_joint: 0,      wrist_2_joint: 0,       wrist_3_joint: 0,
};

const HOME_ANGLES = {
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

const START_STEPS = [
  { text: "Reservando un contenedor", time: "3 s", state: "done" },
  { text: "Levantando ROS 2 y el modelo del UR5e", time: "38 s", state: "busy" },
  { text: "Conectando el visor 3D", time: "", state: "wait" },
];

export default function SimulatorPanel({ jointAngles, onCopyToEditor }) {
  const legacyViewer = useLegacyViewer();
  const [serverRunning, setServerRunning] = useState(false);
  const [showSliders, setShowSliders] = useState(false);
  const [manualAngles, setManualAngles] = useState(DEFAULT_ANGLES);
  const [cameraView, setCameraView] = useState("free");
  const [homeActive, setHomeActive] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [startingServer, setStartingServer] = useState(false);
  const [startError, setStartError] = useState(null);
  const startPollRef = useRef(null);
  const startTimeoutRef = useRef(null);

  const checkStatus = useCallback(async () => {
    if (startPollRef.current) return;
    try {
      const response = await getSimulatorStatus();
      if (response.status === "running") {
        setServerRunning(true);
        setStartingServer(false);
      } else if (response.status === "starting") {
        setServerRunning(false);
        setStartingServer(true);
      } else {
        setServerRunning(false);
        setStartingServer(false);
      }
    } catch {
      setServerRunning(false);
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => {
      clearInterval(interval);
      clearInterval(startPollRef.current);
      clearTimeout(startTimeoutRef.current);
    };
  }, [checkStatus]);

  const handleStart = async () => {
    setStartingServer(true);
    setStartError(null);
    try {
      await startSimulator();
      startPollRef.current = setInterval(async () => {
        try {
          const res = await getSimulatorStatus();
          if (res.status === "running") {
            setServerRunning(true);
            setStartingServer(false);
            clearInterval(startPollRef.current);
            clearTimeout(startTimeoutRef.current);
          }
        } catch { /* ignore transient errors */ }
      }, 2000);
      startTimeoutRef.current = setTimeout(() => {
        clearInterval(startPollRef.current);
        setStartingServer(false);
        setStartError("El simulador tardó demasiado en iniciar. Inténtalo de nuevo.");
      }, 120000);
    } catch (err) {
      setStartingServer(false);
      setStartError(err.message || "No se pudo iniciar el simulador.");
    }
  };

  // Track whether server frames are actively arriving
  const [isAnimating, setIsAnimating] = useState(false);
  const animTimeoutRef = useRef(null);

  useEffect(() => {
    if (!jointAngles) return;
    setIsAnimating(true);
    clearTimeout(animTimeoutRef.current);
    animTimeoutRef.current = setTimeout(() => {
      setIsAnimating(false);
      setManualAngles(jointAngles);
    }, 600);
  }, [jointAngles]);

  const handleHome = () => {
    setManualAngles(HOME_ANGLES);
    setHomeActive(true);
  };

  useEffect(() => {
    if (isAnimating) setHomeActive(false);
  }, [isAnimating]);

  const showStartScreen = !serverRunning && !loadingStatus && !startingServer;
  const effectiveAngles = isAnimating         ? jointAngles
                        : homeActive          ? manualAngles
                        : showSliders         ? manualAngles
                        : jointAngles;
  const handleSliderChange = (angles) => { setManualAngles(angles); setHomeActive(false); };
  const handleCopyToEditor = (code) => onCopyToEditor?.(code);

  return (
    <div id="right-panel" className="pointer-events-auto relative flex h-full w-full flex-row bg-[#0a0a0c]">
      {serverRunning && (
        <>
          {/* 3D viewer — takes remaining width */}
          <div className="relative min-w-0 flex-1">
            <Suspense fallback={<div className="grid h-full w-full place-items-center bg-[#0a0a0c] text-xs text-[#6e6d78]">Cargando visor 3D…</div>}>
              {legacyViewer ? (
                <BabylonViewer jointAngles={effectiveAngles} cameraView={cameraView} />
              ) : (
                <UrdfViewer jointAngles={effectiveAngles} cameraView={cameraView} />
              )}
            </Suspense>

            {/* Estado del programa — top-left (canvas §estado del programa) */}
            <div
              className={`absolute left-3.5 top-3.5 z-20 inline-flex h-8 items-center gap-2 rounded-full border px-3.5 text-xs font-semibold backdrop-blur-md ${
                isAnimating
                  ? "border-[#7d79e3]/30 bg-[#7d79e3]/[0.14] text-[#a5a1ee]"
                  : "border-[#2c2c34] bg-[#101014]/80 text-[#a1a0ab]"
              }`}
            >
              <span
                className={`h-[7px] w-[7px] rounded-full ${isAnimating ? "animate-pulse bg-[#a5a1ee]" : "bg-[#6e6d78]"}`}
              />
              {isAnimating ? "Moviendo" : "En reposo"}
            </div>

            {/* Controles del visor — top-right */}
            <div className="absolute right-3.5 top-3.5 z-20 flex items-center gap-2">
              <div className="flex items-center gap-[2px] rounded-[10px] border border-[#2c2c34] bg-[#101014]/80 p-[3px] backdrop-blur-md">
                {CAMERA_VIEWS.map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    onClick={() => setCameraView(id)}
                    title={label}
                    className={`grid h-[30px] w-8 place-items-center rounded-[7px] transition-colors ${
                      cameraView === id
                        ? "bg-[#7d79e3]/[0.14] text-[#a5a1ee]"
                        : "text-[#6e6d78] hover:text-[#f4f4f6]"
                    }`}
                  >
                    <Icon className="h-4 w-4" strokeWidth={1.8} />
                  </button>
                ))}
              </div>

              <button
                onClick={handleHome}
                className="grid h-[34px] w-[34px] place-items-center rounded-[10px] border border-[#2c2c34] bg-[#101014]/80 text-[#a1a0ab] backdrop-blur-md transition-colors hover:text-[#f4f4f6]"
                title="Posición de inicio"
              >
                <Home className="h-4 w-4" strokeWidth={1.8} />
              </button>

              <button
                onClick={() => setShowSliders(s => !s)}
                className={`grid h-[34px] w-[34px] place-items-center rounded-[10px] border backdrop-blur-md transition-colors ${
                  showSliders
                    ? "border-[#7d79e3]/40 bg-[#7d79e3]/[0.14] text-[#a5a1ee]"
                    : "border-[#2c2c34] bg-[#101014]/80 text-[#a1a0ab] hover:text-[#f4f4f6]"
                }`}
                title="Control manual de juntas"
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
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6e6d78]">Simulador ROS 2 · UR5e</p>
              <h2 className="mt-4 text-[34px] font-bold leading-[1.14] tracking-[-0.016em] text-[#f4f4f6]">
                Levantando el entorno
              </h2>

              <div className="relative mx-auto mt-7 h-[3px] w-[260px] overflow-hidden rounded-full bg-[#23232a]">
                <span className="sim-start-slide absolute top-0 h-full w-[40%] rounded-full bg-[#7d79e3]" />
              </div>

              <div className="mt-9 flex flex-col gap-[3px]">
                {START_STEPS.map((s) => (
                  <div
                    key={s.text}
                    className={`flex items-center gap-3.5 rounded-[11px] px-4 py-3 ${
                      s.state === "busy" ? "bg-[#7d79e3]/[0.07]" : ""
                    }`}
                  >
                    <span
                      className={`grid h-[22px] w-[22px] flex-shrink-0 place-items-center rounded-full ${
                        s.state === "done"
                          ? "bg-[#34d399]"
                          : s.state === "busy"
                            ? ""
                            : "border-[1.6px] border-[#2c2c34]"
                      }`}
                    >
                      {s.state === "done" && (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#04231a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7" /></svg>
                      )}
                      {s.state === "busy" && (
                        <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" strokeWidth="2.6" strokeLinecap="round"><path d="M12 3a9 9 0 019 9" stroke="#a5a1ee" /><circle cx="12" cy="12" r="9" stroke="rgba(165,161,238,0.3)" /></svg>
                      )}
                    </span>
                    <span className={`flex-1 text-left text-[13.5px] ${s.state === "wait" ? "text-[#55555f]" : "text-[#d6d5de]"}`}>
                      {s.text}
                    </span>
                    <span className="flex-shrink-0 font-mono text-[11px] text-[#4a4a54]">{s.time}</span>
                  </div>
                ))}
              </div>

              <p className="mt-6 font-mono text-[11px] text-[#55555f]">Puedes dejar la pestaña abierta; te avisamos al terminar</p>
            </div>
          ) : showStartScreen ? (
            /* ── Listo para programar ─────────────────────── */
            <div className="relative z-10 w-[520px] px-8 text-center">
              <RobotIllustration />

              <p className="mt-6 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6e6d78]">Simulador ROS 2 · UR5e</p>
              <h2 className="mt-4 text-[38px] font-bold leading-[1.12] tracking-[-0.018em] text-[#f4f4f6]">
                Listo para programar
              </h2>
              <p className="mx-auto mt-3.5 max-w-[400px] text-[15.5px] leading-[1.66] text-[#a1a0ab]">
                Enciende el entorno para ejecutar tu código y ver el brazo moverse en 3D, en el momento.
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
              <p className="mt-4.5 font-mono text-[11px] text-[#55555f]">Se apaga solo cuando sales · tarda entre 40 y 90 s en levantar</p>
            </div>
          ) : (
            /* ── Initial loading ──────────────────────────── */
            <div className="relative z-10 flex flex-col items-center gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-[#a5a1ee]" />
              <p className="text-sm text-[#6e6d78]">Conectando con el simulador...</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
