import { useState, useEffect, useCallback, useRef } from "react";
import { Loader2, Play, Square, SlidersHorizontal, Home, AlertCircle } from "lucide-react";
import { getSimulatorStatus, startSimulator, stopSimulator } from '@/features/simulator/services/simulator';
import BabylonViewer from '@/features/simulator/viewer/BabylonViewer';
import JointSliders from "./JointSliders";

const DEFAULT_ANGLES = {
  shoulder_pan_joint: 0, shoulder_lift_joint: 0, elbow_joint: 0,
  wrist_1_joint: 0,      wrist_2_joint: 0,       wrist_3_joint: 0,
};

const HOME_ANGLES = {
  shoulder_pan_joint: 0, shoulder_lift_joint: 0, elbow_joint: 0,
  wrist_1_joint: 0,      wrist_2_joint: 0,       wrist_3_joint: 0,
};

const CAMERA_VIEWS = [
  { id: "free",  label: "Libre",   icon: "⟳" },
  { id: "top",   label: "Top",     icon: "↓" },
  { id: "front", label: "Frente",  icon: "◉" },
  { id: "side",  label: "Lado",    icon: "▷" },
];

export default function SimulatorPanel({ jointAngles }) {
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

  const handleStop = async () => {
    try {
      await stopSimulator();
      setServerRunning(false);
    } catch { /* ignore */ }
  };

  // Track whether server frames are actively arriving
  const [isAnimating, setIsAnimating] = useState(false);
  const animTimeoutRef = useRef(null);

  useEffect(() => {
    if (!jointAngles) return;
    setIsAnimating(true);
    clearTimeout(animTimeoutRef.current);
    // 600ms after last frame → animation done, sync sliders to robot position
    animTimeoutRef.current = setTimeout(() => {
      setIsAnimating(false);
      setManualAngles(jointAngles);
    }, 600);
  }, [jointAngles]);

  const handleHome = () => {
    setManualAngles(HOME_ANGLES);
    setHomeActive(true);
  };

// When server animation starts, clear home override
  useEffect(() => {
    if (isAnimating) setHomeActive(false);
  }, [isAnimating]);

  const showStartScreen = !serverRunning && !loadingStatus && !startingServer;
  // Priority: server animation > home override > sliders > last server frame
  const effectiveAngles = isAnimating         ? jointAngles
                        : homeActive          ? manualAngles
                        : showSliders         ? manualAngles
                        : jointAngles;
  const handleSliderChange = (angles) => { setManualAngles(angles); setHomeActive(false); };

  return (
    <div id="right-panel" className="w-full h-full pointer-events-auto relative bg-slate-950 flex flex-row">
      {serverRunning && (
        <>
          {/* 3D viewer — takes remaining width */}
          <div className="relative flex-1 min-w-0">
            <BabylonViewer jointAngles={effectiveAngles} cameraView={cameraView} />

            {/* Live status badge — top-left */}
            <div className="absolute top-3 left-3 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/70 backdrop-blur-md border border-emerald-500/30 shadow-lg">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wider">En línea</span>
            </div>

            {/* top-right control bar */}
            <div className="absolute top-3 right-3 z-20 flex gap-2 items-center">

              {/* Camera selector */}
              <div className="flex gap-0.5 bg-slate-900/70 backdrop-blur-md rounded-lg p-1 border border-slate-700/50 shadow-lg">
                {CAMERA_VIEWS.map(({ id, label, icon }) => (
                  <button
                    key={id}
                    onClick={() => setCameraView(id)}
                    title={label}
                    className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                      cameraView === id
                        ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/30"
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                    }`}
                  >
                    <span className="mr-1">{icon}</span>{label}
                  </button>
                ))}
              </div>

              {/* Home button */}
              <button
                onClick={handleHome}
                className="p-2 rounded-lg bg-slate-900/70 backdrop-blur-md border border-slate-700/50 hover:border-emerald-500/50 hover:bg-emerald-600/20 text-slate-300 hover:text-emerald-300 transition-all shadow-lg"
                title="Posición home del robot"
              >
                <Home className="w-4 h-4" />
              </button>

              {/* Sliders toggle */}
              <button
                onClick={() => setShowSliders(s => !s)}
                className={`p-2 rounded-lg backdrop-blur-md border transition-all shadow-lg ${
                  showSliders
                    ? "bg-gradient-to-br from-blue-500 to-indigo-600 border-blue-400/50 text-white shadow-blue-500/30"
                    : "bg-slate-900/70 border-slate-700/50 hover:border-blue-500/50 hover:bg-blue-600/20 text-slate-300 hover:text-blue-300"
                }`}
                title="Control manual de joints"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>

              {/* Stop button */}
              <button
                onClick={handleStop}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-600/90 hover:bg-red-500 text-white text-xs font-semibold backdrop-blur-md border border-red-500/50 transition-all shadow-lg shadow-red-500/20"
                title="Detener simulador"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                Detener
              </button>
            </div>
          </div>

          {/* Slider panel — visible only when toggled */}
          {showSliders && (
            <JointSliders angles={manualAngles} onChange={handleSliderChange} />
          )}
        </>
      )}

      {(!serverRunning || loadingStatus || startingServer) && (
        <div className="absolute inset-0 z-10 flex justify-center items-center overflow-hidden">
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          </div>
          {/* Grid pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />

          {startingServer ? (
            /* ── Starting state ─────────────────────────── */
            <div className="relative z-10 flex flex-col items-center gap-6 max-w-md text-center px-8">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500/30 rounded-full blur-2xl animate-pulse" />
                <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-2xl shadow-blue-500/40">
                  <Loader2 className="w-10 h-10 text-white animate-spin" />
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white">Iniciando simulador</h2>
                <p className="text-sm text-slate-400">Levantando el contenedor ROS2 en la nube</p>
                <p className="text-xs text-slate-500 mt-3">Esto puede tomar hasta 90 segundos</p>
              </div>
              {/* Animated progress bar */}
              <div className="w-64 h-1 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full animate-pulse" style={{ width: '60%' }} />
              </div>
            </div>
          ) : showStartScreen ? (
            /* ── Idle / Start screen ────────────────────── */
            <div className="relative z-10 max-w-md w-full mx-8">
              <div className="relative bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/70 to-transparent" />

                <div className="p-10">
                  {/* Brand mark */}
                  <div className="flex justify-center mb-6">
                    <div className="relative">
                      <div className="absolute inset-0 bg-blue-500/40 rounded-2xl blur-3xl" />
                      <div className="relative h-24 w-24 rounded-2xl bg-slate-950 ring-1 ring-blue-400/40 flex items-center justify-center shadow-2xl shadow-blue-500/30">
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/15 to-transparent" />
                        <img
                          src="/logonitido.svg"
                          alt="CIRTA"
                          className="relative h-20 w-20 object-contain"
                          style={{ filter: 'brightness(0) invert(1) drop-shadow(0 0 8px rgba(96, 165, 250, 0.6))' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Headline */}
                  <div className="text-center mb-8">
                    <p className="text-[11px] font-semibold text-blue-400 uppercase tracking-[0.2em] mb-3">
                      Simulador ROS2 · UR5
                    </p>
                    <h2 className="text-2xl font-bold text-white mb-2">
                      Listo para programar
                    </h2>
                    <p className="text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
                      Inicia el entorno virtual para ejecutar tu código y ver el robot moverse en 3D en tiempo real.
                    </p>
                  </div>

                  {/* Error message */}
                  {startError && (
                    <div className="mb-5 flex items-start gap-2.5 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-red-300 leading-relaxed">{startError}</p>
                    </div>
                  )}

                  {/* CTA */}
                  <button
                    onClick={handleStart}
                    className="group relative w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-semibold text-sm shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all duration-200"
                  >
                    <span className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Play className="w-4 h-4 fill-current" />
                    Iniciar simulador
                  </button>

                  <p className="text-[11px] text-slate-500 text-center mt-4">
                    El simulador se detendrá automáticamente cuando termines
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* ── Initial loading ────────────────────────── */
            <div className="relative z-10 flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
              <p className="text-sm text-slate-400">Conectando con el simulador...</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
