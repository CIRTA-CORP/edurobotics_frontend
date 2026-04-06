import React, { useEffect, useState, useCallback } from "react";
import { MoreVertical, ChevronRight } from "lucide-react";
import LeftPanel from "./LeftPanel";
import SimulatorPanel from "./SimulatorPanel";
import AlertsHandler from "./panels/components/AlertsHandler";

const DEFAULT_LEFT_PANEL_WIDTH = 50;

export function Ide() {
  const [alertType, setAlertType] = useState();
  const [leftPanelMaxWidth, setLeftPanelMaxWidth] = useState(
    parseInt(localStorage.getItem("LPWidth")) || 50
  );
  const [hideLeftPanel, setHideLeftPanel] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const onMove = useCallback((clientX) => {
    const widthPercentage = Math.round((10 * (clientX * 100)) / window.innerWidth) / 10;
    if (20 <= widthPercentage && widthPercentage <= 70) {
      setLeftPanelMaxWidth(widthPercentage);
      localStorage.setItem("LPWidth", widthPercentage);
      window.dispatchEvent(new Event("resize"));
    }
  }, []);

  const activatePanelsPointerEvents = useCallback(() => {
    const left = document.getElementById("left-panel-container");
    const right = document.getElementById("simulator-panel-container");
    if (left) left.style.pointerEvents = "auto";
    if (right) right.style.pointerEvents = "auto";
  }, []);

  const deactivatePanelsPointerEvents = useCallback(() => {
    const left = document.getElementById("left-panel-container");
    const right = document.getElementById("simulator-panel-container");
    if (left) left.style.pointerEvents = "none";
    if (right) right.style.pointerEvents = "none";
  }, []);

  const onMouseDown = useCallback(() => {
    setIsDragging(true);
    deactivatePanelsPointerEvents();
  }, [deactivatePanelsPointerEvents]);

  const onMouseUp = useCallback(() => {
    setIsDragging(false);
    activatePanelsPointerEvents();
  }, [activatePanelsPointerEvents]);

  const onMouseMove = useCallback((e) => {
    if (isDragging) {
      e.preventDefault();
      onMove(e.clientX);
    }
  }, [isDragging, onMove]);

  const onTouchStart = useCallback((e) => {
    onMove(e.touches[0].clientX);
    setIsDragging(true);
  }, [onMove]);

  const onTouchMove = useCallback((e) => {
    if (isDragging) {
      e.preventDefault();
      onMove(e.touches[0].clientX);
    }
  }, [isDragging, onMove]);

  useEffect(() => {
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    document.addEventListener("touchmove", onTouchMove);

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("touchmove", onTouchMove);
    };
  }, [onMouseMove, onMouseUp, onTouchMove]);

  useEffect(() => {
    if (!localStorage.getItem("LPWidth")) {
      localStorage.setItem("LPWidth", DEFAULT_LEFT_PANEL_WIDTH);
    }
  }, []);

  return (
    <div className="relative w-full h-[calc(100vh-64px)]">
      <div id="IDE" className="flex flex-row w-full h-full overflow-hidden">
        
        {/* LEFT PANEL */}
        {!hideLeftPanel && (
          <div
            id="left-panel-container"
            className="flex flex-col h-full overflow-x-hidden"
            style={{ width: `${leftPanelMaxWidth}%` }}
          >
            <LeftPanel
              setAlertType={setAlertType}
              handleHide={() => setHideLeftPanel(true)}
            />
          </div>
        )}

        {/* DIVIDER */}
        <div
          id="divider"
          onMouseDown={onMouseDown}
          onTouchStart={onTouchStart}
          onTouchEnd={onMouseUp}
          className="flex justify-center items-center w-[10px] max-w-[12px] h-full bg-blue-600 cursor-col-resize hover:bg-gray-500 active:bg-gray-500 z-50 shrink-0"
        >
          {hideLeftPanel ? (
            <button
              onClick={() => setHideLeftPanel(false)}
              className="h-full w-full flex items-center justify-center outline-none"
            >
              <ChevronRight className="text-white" />
            </button>
          ) : (
            <MoreVertical className="text-white" />
          )}
        </div>

        {/* RIGHT PANEL (SIMULATOR) */}
        <div
          id="simulator-panel-container"
          className="flex-grow h-full overflow-hidden"
        >
          <SimulatorPanel />
        </div>
      </div>

      {AlertsHandler && <AlertsHandler alertType={alertType} setAlertType={setAlertType} />}
    </div>
  );
}

export default Ide;
