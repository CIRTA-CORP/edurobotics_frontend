import { Play, Square, Download, Upload, ChevronLeft, Loader2 } from "lucide-react";

/* ── Tooltip wrapper ────────────────────────────── */
const Tooltip = ({ title, children }) => (
  <div className="group relative flex items-center justify-center">
    {children}
    <div className="pointer-events-none absolute top-full mt-2 left-1/2 -translate-x-1/2 hidden group-hover:flex z-50 whitespace-nowrap">
      <span className="px-2.5 py-1 text-[11px] font-medium text-white bg-slate-900 border border-slate-700 shadow-lg rounded-md">
        {title}
      </span>
    </div>
  </div>
);

/* ── Run button (primary) ───────────────────────── */
const RunButton = ({ runLoading, handleRun }) => (
  <Tooltip title={runLoading ? "Ejecutando..." : "Ejecutar programa"}>
    <button
      onClick={handleRun}
      disabled={runLoading}
      className={`
        flex items-center justify-center gap-1.5 h-8 px-3 rounded-md
        text-xs font-semibold text-white transition-all
        ${runLoading
          ? "bg-emerald-500/40 cursor-wait"
          : "bg-emerald-600 hover:bg-emerald-500 shadow-sm shadow-emerald-500/20 hover:shadow-emerald-500/40"}
      `}
    >
      {runLoading ? (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Ejecutando
        </>
      ) : (
        <>
          <Play className="w-3.5 h-3.5 fill-current" />
          Ejecutar
        </>
      )}
    </button>
  </Tooltip>
);

/* ── Stop button ────────────────────────────────── */
const StopButton = ({ handleStop, disabled }) => (
  <Tooltip title="Detener programa">
    <button
      onClick={handleStop}
      disabled={disabled}
      className={`
        flex items-center justify-center gap-1.5 h-8 px-3 rounded-md
        text-xs font-semibold transition-all
        ${disabled
          ? "bg-slate-800 text-slate-600 cursor-not-allowed"
          : "bg-slate-800 hover:bg-red-600/90 text-slate-300 hover:text-white border border-slate-700 hover:border-red-500"}
      `}
    >
      <Square className="w-3 h-3 fill-current" />
      Detener
    </button>
  </Tooltip>
);

/* ── Icon-only button ───────────────────────────── */
const IconButton = ({ onClick, title, children }) => (
  <Tooltip title={title}>
    <button
      onClick={onClick}
      className="flex items-center justify-center w-8 h-8 rounded-md bg-transparent hover:bg-slate-800 text-slate-400 hover:text-white transition-all border border-transparent hover:border-slate-700"
    >
      {children}
    </button>
  </Tooltip>
);

/* ── Upload (label + hidden file input) ─────────── */
const UploadButton = ({ handleUpload }) => (
  <Tooltip title="Subir archivo">
    <label
      htmlFor="upload-icon-button-file"
      className="cursor-pointer flex items-center justify-center w-8 h-8 rounded-md bg-transparent hover:bg-slate-800 text-slate-400 hover:text-white transition-all border border-transparent hover:border-slate-700"
    >
      <input
        type="file"
        id="upload-icon-button-file"
        onChange={handleUpload}
        className="hidden"
      />
      <Upload className="w-4 h-4" />
    </label>
  </Tooltip>
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
    <div
      id="code-buttons"
      className="flex flex-row items-center w-full min-h-[44px] bg-gradient-to-b from-[#252526] to-[#1f1f1f] px-3 border-b border-slate-800 shrink-0"
    >
      {/* Primary actions */}
      <div className="flex flex-row items-center gap-1.5">
        <RunButton runLoading={runLoading} handleRun={handleRun} />
        <StopButton handleStop={handleStop} disabled={stopDisabled} />

        {/* Divider */}
        <div className="w-px h-5 bg-slate-700 mx-1.5" />

        {/* Secondary actions */}
        <IconButton onClick={handleDownload} title="Descargar archivo">
          <Download className="w-4 h-4" />
        </IconButton>
        <UploadButton handleUpload={handleUpload} />
      </div>

      <div className="flex-grow" />

      {/* Hide panel */}
      <IconButton onClick={handleHide} title="Ocultar panel">
        <ChevronLeft className="w-4 h-4" />
      </IconButton>
    </div>
  );
}
