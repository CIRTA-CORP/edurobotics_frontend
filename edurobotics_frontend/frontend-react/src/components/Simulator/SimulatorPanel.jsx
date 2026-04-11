import { useState, useEffect, useCallback } from "react";
import Iframe from "react-iframe";
import { Loader2, Play, Square } from "lucide-react";
import { getStoredUser } from "../../services/auth";
import { getSimulatorStatus, startSimulator, stopSimulator } from "../../services/simulator";

export default function PanelSimulador() {
  const user = getStoredUser() || { email: "guest@edurobotics.com" };
  
  const [serverRunning, setServerRunning] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [startingServer, setStartingServer] = useState(false);
  const [simulatorLoading, setSimulatorLoading] = useState(true);
  
  const checkStatus = useCallback(async () => {
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
    } catch (error) {
      console.error("Failed to check simulator status:", error);
      setServerRunning(false);
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, [checkStatus]);
  
  const simulatorUrl = import.meta.env.VITE_SIMULATOR_URL 
    ? `${import.meta.env.VITE_SIMULATOR_URL}${user.email}` 
    : "https://www.wikipedia.org/"; 

  const handleStart = async () => {
    setStartingServer(true);
    try {
      await startSimulator();
      // Poll faster while starting
      const poll = setInterval(async () => {
        const res = await getSimulatorStatus();
        if (res.status === "running") {
          setServerRunning(true);
          setStartingServer(false);
          clearInterval(poll);
        }
      }, 2000);
      // Stop polling after 60s
      setTimeout(() => clearInterval(poll), 60000);
    } catch (err) {
      console.error("Failed to start simulator:", err);
      setStartingServer(false);
    }
  };

  const handleStop = async () => {
    try {
      await stopSimulator();
      setServerRunning(false);
      setSimulatorLoading(true);
    } catch (err) {
      console.error("Failed to stop simulator:", err);
    }
  };

  return (
    <div id="right-panel" className="w-full h-full pointer-events-auto relative bg-gray-900">
      {serverRunning && (
        <>
          <Iframe
            onLoad={() => setSimulatorLoading(false)}
            id="simuladorFrame"
            title="Simulador Robótico - EduRobotics"
            width="100%"
            height="100%"
            frameBorder={0}
            url={simulatorUrl}
            className="border-none m-0 p-0"
          />
          {/* Stop button overlay */}
          <button
            onClick={handleStop}
            className="absolute top-3 right-3 z-20 bg-red-600/80 hover:bg-red-500 text-white p-2 rounded-lg backdrop-blur-sm transition-colors"
            title="Detener simulador"
          >
            <Square className="w-4 h-4" />
          </button>
        </>
      )}

      {(simulatorLoading || !serverRunning || loadingStatus || startingServer) && (
        <div 
          id="loading" 
          className="absolute inset-0 z-10 flex justify-center items-center bg-black/50 backdrop-blur-sm"
        >
          {startingServer ? (
            <div className="flex flex-col items-center gap-3 text-white">
              <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
              <p className="text-sm text-gray-300">Iniciando simulador...</p>
            </div>
          ) : (!serverRunning && !loadingStatus) ? (
            <div className="bg-gray-800/90 text-white p-8 rounded-xl max-w-sm text-center shadow-xl border border-gray-600/30">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <Play className="w-8 h-8 text-emerald-400" />
                </div>
                <p className="text-lg font-semibold">Simulador ROS2</p>
                <p className="text-sm text-gray-400">Inicia el contenedor Docker para empezar a programar tu robot.</p>
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
