import { useState, useEffect, useCallback, useRef } from "react";
import { Loader2, Play, Square } from "lucide-react";
import { getSimulatorStatus, startSimulator, stopSimulator } from "../../services/simulator";
import BabylonViewer from "./BabylonViewer";

export default function SimulatorPanel({ jointAngles }) {
  const [serverRunning, setServerRunning] = useState(false);
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

  const showStartScreen = !serverRunning && !loadingStatus && !startingServer;

  return (
    <div id="right-panel" className="w-full h-full pointer-events-auto relative bg-gray-900">
      {serverRunning && (
        <>
          <BabylonViewer jointAngles={jointAngles} />

          <button
            onClick={handleStop}
            className="absolute top-3 right-3 z-20 bg-red-600/80 hover:bg-red-500 text-white p-2 rounded-lg backdrop-blur-sm transition-colors"
            title="Detener simulador"
          >
            <Square className="w-4 h-4" />
          </button>
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
