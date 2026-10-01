import { memo, useState, useEffect, useRef, useCallback } from "react";
import { Terminal as TerminalIcon, ChevronDown, ChevronUp, Trash2, Copy, Check } from "lucide-react";
import { KINDS, runState } from "@/features/simulator/lib/terminalLines";
import { CODE_FONT_FAMILY } from "@/features/simulator/lib/codeFont";

/*
 * Terminal del simulador.
 *
 * Recibe filas ya clasificadas ({ id, time, kind, text }, ver lib/terminalLines.js) y las
 * pinta como una consola de playground: cada fila con su color, una etiqueta en la primera
 * de cada grupo del mismo tipo, los errores con fondo teñido y una línea entre ejecuciones.
 */

const KIND_STYLE = {
  output:  { row: "text-[#e4e3ea]", badge: "" },
  system:  { row: "text-[#7a7985]", badge: "text-[#8b8a95] bg-white/[0.05]" },
  warning: { row: "text-[#fcd34d]", badge: "text-[#fcd34d] bg-[#fbbf24]/[0.12]" },
  stop:    { row: "text-[#fdba74] bg-[#fb923c]/[0.08]", badge: "text-[#fdba74] bg-[#fb923c]/[0.16]" },
  error:   { row: "text-[#fda4af] bg-[#f43f5e]/[0.07]", badge: "text-[#fda4af] bg-[#f43f5e]/[0.16]" },
  success: { row: "text-[#6ee7b7]", badge: "text-[#6ee7b7] bg-[#34d399]/[0.14]" },
  meta:    { row: "text-[#55545e] text-[11px]", badge: "" },
};

const STATE_META = {
  running: ["Ejecutando", "text-[#a5a1ee]", "bg-[#7d79e3]/[0.16]"],
  done:    ["Terminado", "text-[#6ee7b7]", "bg-[#34d399]/[0.14]"],
  error:   ["Con error", "text-[#fda4af]", "bg-[#f43f5e]/[0.14]"],
  idle:    ["Listo", "text-[#7a7985]", "bg-white/[0.05]"],
  empty:   ["Sin ejecutar", "text-[#7a7985]", "bg-white/[0.05]"],
};

const isRunStart = (entry) => entry.kind === "system" && entry.text.startsWith("Conectando");

const HeaderButton = ({ onClick, title, children }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    aria-label={title}
    className="grid h-[26px] w-[26px] place-items-center rounded-md text-[#6e6d78] transition-colors hover:bg-white/[0.06] hover:text-[#f4f4f6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a5a1ee]"
  >
    {children}
  </button>
);

// `open` y `onToggle` vienen de fuera: plegar la terminal cambia el alto de su contenedor,
// y eso lo decide quien reparte el espacio con el editor (LeftPanel).
const Terminal = memo(({ entries = [], onClear, running, open = true, onToggle }) => {
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef(null);
  // Si el alumno subió a leer algo, una línea nueva no le arrastra al final.
  const stickToBottom = useRef(true);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (el) stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el && stickToBottom.current) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [entries, running, open]);

  const handleCopy = useCallback(async () => {
    const text = entries.map((e) => `[${e.time}] ${e.text}`).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* sin permiso de portapapeles: no hay nada que hacer */
    }
  }, [entries]);

  const [badge, badgeColor, badgeBg] = STATE_META[runState(entries, running)];

  return (
    <div
      className="relative flex h-full w-full flex-col bg-[#0b0b0e]"
      style={{ fontFamily: CODE_FONT_FAMILY, fontVariantLigatures: "contextual" }}
    >
      <div className="flex h-[36px] w-full shrink-0 items-center gap-2.5 border-b border-[#1c1c22] px-3">
        <TerminalIcon className="h-3.5 w-3.5 text-[#6e6d78]" strokeWidth={1.8} />
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7a7985]">Salida</span>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${badgeColor} ${badgeBg}`}>{badge}</span>
        <span className="ml-auto flex items-center gap-0.5">
          {entries.length > 0 && (
            <HeaderButton onClick={handleCopy} title={copied ? "Copiado" : "Copiar la salida"}>
              {copied ? <Check className="h-3.5 w-3.5 text-[#6ee7b7]" strokeWidth={2} /> : <Copy className="h-3.5 w-3.5" strokeWidth={1.8} />}
            </HeaderButton>
          )}
          {onClear && entries.length > 0 && (
            <HeaderButton onClick={onClear} title="Limpiar">
              <Trash2 className="h-3.5 w-3.5" strokeWidth={1.8} />
            </HeaderButton>
          )}
          <HeaderButton onClick={onToggle} title={open ? "Plegar la salida" : "Desplegar la salida"}>
            {open ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </HeaderButton>
        </span>
      </div>

      {open && (
        <div ref={scrollRef} onScroll={handleScroll} className="flex-grow overflow-auto py-1.5 text-[12.5px] leading-[1.55]">
          {entries.length === 0 && !running && (
            <p className="px-4 py-3 text-[12px] text-[#55545e]">
              Pulsa <span className="text-[#8b8a95]">Ejecutar</span> o{" "}
              <kbd className="rounded border border-[#2a2a31] bg-white/[0.03] px-1.5 py-px text-[11px] text-[#8b8a95]">Ctrl</kbd>{" "}
              <kbd className="rounded border border-[#2a2a31] bg-white/[0.03] px-1.5 py-px text-[11px] text-[#8b8a95]">Enter</kbd>{" "}
              para correr tu programa. Lo que imprima aparecerá aquí.
            </p>
          )}

          {entries.map((entry, i) => {
            const style = KIND_STYLE[entry.kind] ?? KIND_STYLE.output;
            const prev = entries[i - 1];
            const label = KINDS[entry.kind]?.label;
            const showBadge = label && (!prev || prev.kind !== entry.kind);
            const newRun = i > 0 && isRunStart(entry);
            return (
              <div key={entry.id}>
                {newRun && <div className="mx-3 my-2 border-t border-[#1f1f26]" />}
                <div className={`sim-row-in grid grid-cols-[auto_auto_minmax(0,1fr)] items-start gap-2.5 px-3 py-[3px] ${style.row}`}>
                  <span className="select-none pt-px text-[11px] tabular-nums text-[#3f3f48]">{entry.time}</span>
                  <span className="w-[52px] select-none pt-px">
                    {showBadge && (
                      <span className={`inline-block rounded px-1.5 text-[9.5px] font-bold tracking-[0.06em] ${style.badge}`}>
                        {label}
                      </span>
                    )}
                  </span>
                  <pre className="m-0 whitespace-pre-wrap break-words font-[inherit]">{entry.text}</pre>
                </div>
              </div>
            );
          })}

          {running && (
            <div className="grid grid-cols-[auto_auto_minmax(0,1fr)] gap-2.5 px-3 py-[3px]">
              <span className="text-[11px] text-transparent">00:00:00</span>
              <span className="w-[52px]" />
              <span className="inline-block h-[15px] w-[7px] animate-pulse bg-[#7d79e3]/70" />
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default Terminal;
