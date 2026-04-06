import { useState, useEffect } from "react";
import Iframe from "react-iframe";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { getStoredUser } from "../../services/auth";
import { getSimulatorStatus } from "../../services/simulator";

export default function PanelSimulador() {
  const user = getStoredUser() || { email: "guest@edurobotics.com" };
  
  const [serverRunning, setServerRunning] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [startingServer, setStartingServer] = useState(false);
  const [simulatorLoading, setSimulatorLoading] = useState(true);
  
  useEffect(() => {
    let interval;
    const checkStatus = async () => {
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
    };
    
    checkStatus();
    // Poll every 5 seconds for status updates
    interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, []);
  
  // En desarrollo local puedes poner la URL del simulador desplegado si existe,
  // o una URL de prueba. Por ahora usaremos msn.com como iframe placeholder si no hay URL.
  const simulatorUrl = import.meta.env.VITE_SIMULATOR_URL 
    ? `${import.meta.env.VITE_SIMULATOR_URL}${user.email}` 
    : "https://www.wikipedia.org/"; 

  function onLoad() {
    setSimulatorLoading(false);
  }

  return (
    <div id="right-panel" className="w-full h-full pointer-events-auto relative bg-gray-900">
      {serverRunning && (
        <Iframe
          onLoad={onLoad}
          id="simuladorFrame"
          title="Simulador Robótico - Gatitolabs"
          width="100%"
          height="100%"
          frameBorder={0}
          url={simulatorUrl}
          className="border-none m-0 p-0"
        />
      )}

      {(simulatorLoading || !serverRunning || loadingStatus || startingServer) && (
        <div 
          id="loading" 
          className="absolute inset-0 z-10 flex justify-center items-center bg-black/50 backdrop-blur-sm"
        >
          {(!serverRunning && !loadingStatus && !startingServer) ? (
            <div className="bg-blue-900/90 text-blue-100 p-6 rounded-lg max-w-md text-center shadow-xl border border-blue-500/30">
              <div className="flex flex-col items-center gap-4">
                <p className="text-lg font-medium">Debes seleccionar un ambiente de simulación para empezar</p>
                <Link to="/ambientes">
                  <button className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-6 rounded transition-colors">
                    Ir a Ambientes
                  </button>
                </Link>
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
