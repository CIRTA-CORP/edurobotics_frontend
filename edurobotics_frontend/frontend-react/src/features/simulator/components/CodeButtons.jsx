import { Play, Square, Download, Upload, ChevronLeft, Loader2 } from "lucide-react";

/* ── Tooltip wrapper ────────────────────────────── */
const Tooltip = ({ title, children }) => (
  <div className="group relative flex items-center justify-center">
    {children}
    <div className="pointer-events-none absolute top-full mt-2 left-1/2 -translate-x-1/2 hidden group-hover:flex z-50 whitespace-nowrap">
      <span className="px-2.5 py-1 text-[11px] font-medium text-[#f4f4f6] bg-[#1f1f26] border border-[#33333c] shadow-lg rounded-md">
        {title}
      </span>
    </div>
  </div>
);

/* ── Run button — verde de marca, texto oscuro (canvas §02) ── */
const RunButton = ({ runLoading, handleRun }) => (
  <button
    onClick={handleRun}
    disabled={runLoading}
    className={`inline-flex h-8 items-center gap-2 rounded-[9px] px-3.5 text-[12.5px] font-semibold transition-colors ${
      runLoading
        ? "cursor-wait bg-[#34d399]/20 text-[#6ee7b7]"
        : "bg-[#10b981] text-[#04231a] hover:bg-[#34d399]"
    }`}
  >
    {runLoading ? (
      <>
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Ejecutando
      </>
    ) : (
      <>
        <Play className="h-3 w-3 fill-current" />
        Ejecutar
      </>
    )}
  </button>
);

/* ── Stop button — contorno, rosa solo al correr ── */
const StopButton = ({ handleStop, disabled, running }) => (
  <button
    onClick={handleStop}
    disabled={disabled}
    className={`inline-flex h-8 items-center gap-2 rounded-[9px] border px-3.5 text-[12.5px] font-semibold transition-colors ${
      running
        ? "border-[#f08099]/40 text-[#f08099] hover:bg-[#f08099]/10"
        : disabled
          ? "cursor-not-allowed border-[#33333c] text-[#4a4a54]"
          : "border-[#33333c] text-[#a1a0ab] hover:text-[#f4f4f6] hover:border-[#4a4a54]"
    }`}
  >
    <Square className="h-3 w-3 fill-current" />
    Detener
  </button>
);

/* ── Icon-only button ───────────────────────────── */
const IconButton = ({ onClick, title, children }) => (
  <Tooltip title={title}>
    <button
      onClick={onClick}
      className="grid h-[30px] w-[30px] place-items-center rounded-lg text-[#8b8a95] transition-colors hover:bg-[#26262d] hover:text-[#f4f4f6]"
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
      className="grid h-[30px] w-[30px] cursor-pointer place-items-center rounded-lg text-[#8b8a95] transition-colors hover:bg-[#26262d] hover:text-[#f4f4f6]"
    >
      <input
        type="file"
        id="upload-icon-button-file"
        onChange={handleUpload}
        className="hidden"
      />
      <Upload className="h-4 w-4" strokeWidth={1.8} />
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
      className="flex shrink-0 flex-row items-center gap-1.5"
    >
      <RunButton runLoading={runLoading} handleRun={handleRun} />
      <StopButton handleStop={handleStop} disabled={stopDisabled} running={runLoading} />

      {/* Divider */}
      <div className="mx-1 h-[18px] w-px bg-[#2c2c34]" />

      {/* Secondary actions */}
      <IconButton onClick={handleDownload} title="Descargar archivo">
        <Download className="h-4 w-4" strokeWidth={1.8} />
      </IconButton>
      <UploadButton handleUpload={handleUpload} />
      <IconButton onClick={handleHide} title="Ocultar el panel de código">
        <ChevronLeft className="h-4 w-4" strokeWidth={1.8} />
      </IconButton>
    </div>
  );
}
