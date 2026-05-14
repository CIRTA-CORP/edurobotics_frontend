import { useState, useEffect, useCallback, useRef } from "react";
import { Loader2, Play, Square, SlidersHorizontal, Home } from "lucide-react";
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
    <div id="right-panel" className="w-full h-full pointer-events-auto relative bg-gray-900 flex flex-row">
      {serverRunning && (
        <>
          {/* 3D viewer — takes remaining width */}
          <div className="relative flex-1 min-w-0">
            <BabylonViewer jointAngles={effectiveAngles} cameraView={cameraView} />

            {/* top-right buttons */}
            <div className="absolute top-3 right-3 z-20 flex gap-2 items-center">

              {/* Camera selector */}
              <div className="flex gap-1 bg-gray-800/80 backdrop-blur-sm rounded-lg p-1">
                {CAMERA_VIEWS.map(({ id, label, icon }) => (
                  <button
                    key={id}
                    onClick={() => setCameraView(id)}
                    title={label}
                    className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${
                      cameraView === id
                        ? "bg-blue-600 text-white"
                        : "text-gray-400 hover:text-white hover:bg-gray-700"
                    }`}
                  >
                    {icon} {label}
                  </button>
                ))}
              </div>

              {/* Home button */}
              <button
                onClick={handleHome}
                className="p-2 rounded-lg backdrop-blur-sm transition-colors bg-gray-700/80 hover:bg-emerald-600 text-gray-300 hover:text-white"
                title="Posición home del robot"
              >
                <Home className="w-4 h-4" />
              </button>

              {/* Sliders toggle */}
              <button
                onClick={() => setShowSliders(s => !s)}
                className={`p-2 rounded-lg backdrop-blur-sm transition-colors ${
                  showSliders
                    ? "bg-blue-600/90 hover:bg-blue-500 text-white"
                    : "bg-gray-700/80 hover:bg-gray-600 text-gray-300"
                }`}
                title="Control manual de joints"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>

              {/* Stop button */}
              <button
                onClick={handleStop}
                className="bg-red-600/80 hover:bg-red-500 text-white p-2 rounded-lg backdrop-blur-sm transition-colors"
                title="Detener simulador"
              >
                <Square className="w-4 h-4" />
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
        <div className="absolute inset-0 z-10 flex justify-center items-center bg-black/50 backdrop-blur-sm">
          {startingServer ? (
            <div className="flex flex-col items-center gap-3 text-white">
              <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
              <p className="text-sm text-gray-300">Iniciando simulador...</p>
            </div>
          ) : showStartScreen ? (
            <div className="bg-gray-800/90 text-white p-8 rounded-xl max-w-sm text-center shadow-xl border border-gray-600/30">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <Play className="w-8 h-8 text-emerald-400" />
                </div>
                <p className="text-lg font-semibold">Simulador ROS2</p>
                <p className="text-sm text-gray-400">Inicia el contenedor Docker para empezar a programar tu robot.</p>
                {startError && (
                  <p className="text-red-400 text-xs text-center px-2">{startError}</p>
                )}
                <button
                  onClick={handleStart}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 px-8 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Iniciar Simulador
                </button>
              </div>
            </div>
          ) : (
            <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
          )}
        </div>
      )}
    </div>
  );
}
