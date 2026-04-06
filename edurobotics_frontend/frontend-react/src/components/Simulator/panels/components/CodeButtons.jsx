import React from "react";
import { PlayCircle, StopCircle, Download, Upload, ChevronLeft, Loader2 } from "lucide-react";

const CodeButtonTooltip = ({ title, children }) => (
  <div className="group relative flex items-center justify-center">
    {children}
    <div className="absolute top-10 flex-col items-center hidden mb-6 group-hover:flex z-50 whitespace-nowrap">
      <span className="relative z-10 p-2 text-xs leading-none text-white whitespace-no-wrap bg-gray-800 shadow-lg rounded-md">
        {title}
      </span>
      <div className="w-3 h-3 -mt-2 rotate-45 bg-gray-800"></div>
    </div>
  </div>
);

const IconButton = ({ onClick, disabled, children, id }) => (
  <button
    id={id}
    onClick={onClick}
    disabled={disabled}
    className={`p-1 mx-1 rounded-full transition-colors flex items-center justify-center
      ${disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-200 dark:hover:bg-gray-700 active:bg-gray-300 dark:active:bg-gray-600"}
    `}
  >
    {children}
  </button>
);

const RunButton = ({ id, runLoading, handleRun }) => (
  <CodeButtonTooltip title={runLoading ? "Subiendo Programa" : "Lanzar programa"}>
    <IconButton id={id} onClick={handleRun} disabled={runLoading}>
      {runLoading ? (
        <Loader2 className="w-5 h-5 text-green-500 animate-spin" />
      ) : (
        <PlayCircle className="w-6 h-6 text-green-600" />
      )}
    </IconButton>
  </CodeButtonTooltip>
);

const StopButton = ({ id, handleStop, disabled }) => (
  <CodeButtonTooltip title="Detener programa">
    <IconButton id={id} onClick={handleStop} disabled={disabled}>
      <StopCircle className={`w-6 h-6 ${disabled ? "text-gray-400" : "text-red-500"}`} />
    </IconButton>
  </CodeButtonTooltip>
);

const DownloadButton = ({ id, handleDownload }) => (
  <CodeButtonTooltip title="Descargar archivo">
    <IconButton id={id} onClick={handleDownload}>
      <Download className="w-6 h-6 text-blue-500" />
    </IconButton>
  </CodeButtonTooltip>
);

const UploadButton = ({ id, handleUpload }) => (
  <CodeButtonTooltip title="Subir archivo">
    <label htmlFor="upload-icon-button-file" className="cursor-pointer">
      <input
        type="file"
        id="upload-icon-button-file"
        onChange={handleUpload}
        className="hidden"
      />
      <div id={id} className="p-1 mx-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center">
        <Upload className="w-6 h-6 text-blue-500" />
      </div>
    </label>
  </CodeButtonTooltip>
);

const HidePanelButton = ({ id, handleHide }) => (
  <CodeButtonTooltip title="Ocultar Panel Editor">
    <IconButton id={id} onClick={handleHide}>
      <ChevronLeft className="w-6 h-6 text-blue-600 dark:text-blue-400" />
    </IconButton>
  </CodeButtonTooltip>
);

export default function CodeButtons({
  runLoading,
  stopDisabled,
  handleRun,
  handleStop,
  handleDownload,
  handleUpload,
  handleHide,
}) {
  return (
    <div id="code-buttons" className="flex flex-row items-center w-full min-h-[40px] h-[4vh] bg-gray-100 dark:bg-[#252526] px-2 border-b border-gray-300 dark:border-gray-700 shrink-0">
      <div className="flex flex-row items-center">
        <RunButton id="run-button" runLoading={runLoading} handleRun={handleRun} />
        <StopButton id="stop-button" handleStop={handleStop} disabled={stopDisabled} />
        <DownloadButton id="download-button" handleDownload={handleDownload} />
        <UploadButton id="upload-button" handleUpload={handleUpload} />
      </div>
      
      {/* Spacer */}
      <div className="flex-grow"></div>
      
      <HidePanelButton id="hide-button" handleHide={handleHide} />
    </div>
  );
}
