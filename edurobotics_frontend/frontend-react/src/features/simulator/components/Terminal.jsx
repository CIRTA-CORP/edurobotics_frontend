import { memo, useState, useEffect, useRef } from "react";
import { Terminal as TerminalIcon, ChevronDown, ChevronUp, Trash2 } from "lucide-react";

/* Paleta del canvas SimuladorPiezas §04: cada tipo de línea con su color. */
const classifyLine = (line) => {
  if (!line || !line.trim()) return { text: line, style: "text-[#4a4a54]" };

  if (line.startsWith("Connecting") || line.startsWith("Connected") ||
      line.startsWith("Stopped") || line.startsWith("Executing"))
    return { text: line, style: "text-[#6e6d78] italic" };

  if (line.startsWith("Done.") || line.includes("completada") || line.includes("exitoso"))
    return { text: line, style: "text-[#6ee7b7] font-medium" };

  if (line.startsWith("Error") || line.includes("Error") || line.includes("error"))
    return { text: line, style: "text-[#f08099]" };

  if (line.includes("CMD written"))
    return { text: line, style: "text-[#a5a1ee]" };

  if (line.startsWith("[robot_api]"))
    return { text: line, style: "text-[#6e6d78]" };

  if (line.startsWith("[sim]"))
    return { text: line, style: "text-[#fbbf24]/90" };

  if (line.includes("frames") || line.startsWith("Animation"))
    return { text: line, style: "text-[#4a4a54] text-xs" };

  if (line.startsWith("[stderr]"))
    return { text: line, style: "text-[#fbbf24]" };

  return { text: line, style: "text-[#d6d5de]" };
};

const STATE_META = {
  running: ["Ejecutando", "text-[#a5a1ee]", "bg-[#7d79e3]/[0.16]"],
  done: ["Terminado", "text-[#6ee7b7]", "bg-[#34d399]/[0.14]"],
  error: ["Con error", "text-[#f08099]", "bg-[#f08099]/[0.14]"],
  idle: ["Sin ejecutar", "text-[#6e6d78]", "bg-[#26262d]"],
};

const Terminal = memo(({ output, onHide, onClear, running }) => {
  const [hidden, setHidden] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [output]);

  const lines = output ? output.split("\n") : [];

  const state = running
    ? "running"
    : /Done\./m.test(output)
      ? "done"
      : /error/i.test(output)
        ? "error"
        : "idle";
  const [badge, badgeColor, badgeBg] = STATE_META[state];

  return (
    <div className="relative flex h-full w-full flex-col bg-[#0d0d10] font-mono">
      {/* Header — «Salida» + estado + acciones (canvas Simulador §terminal) */}
      <div className="flex h-[34px] w-full shrink-0 items-center gap-2.5 border-b border-[#1c1c22] px-3">
        <TerminalIcon className="h-3.5 w-3.5 text-[#6e6d78]" strokeWidth={1.8} />
        <span className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-[#6e6d78]">Salida</span>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${badgeColor} ${badgeBg}`}>{badge}</span>
        <span className="ml-auto flex items-center gap-1">
          {onClear && (
            <button onClick={onClear} title="Limpiar"
              className="grid h-[26px] w-[26px] place-items-center rounded-md text-[#6e6d78] transition-colors hover:text-[#f4f4f6]">
              <Trash2 className="h-3.5 w-3.5" strokeWidth={1.8} />
            </button>
          )}
          <button
            onClick={() => { setHidden(!hidden); if (onHide) onHide(); }}
            className="grid h-[26px] w-[26px] place-items-center rounded-md text-[#6e6d78] transition-colors hover:text-[#f4f4f6]"
          >
            {hidden ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </span>
      </div>

      {!hidden && (
        <div className="flex-grow space-y-0.5 overflow-auto p-3 text-xs leading-5">
          {lines.map((line, i) => {
            const tsMatch = line.match(/^(\[\d{2}:\d{2}:\d{2}\]) (.*)/s);
            const timestamp = tsMatch ? tsMatch[1] : null;
            const message = tsMatch ? tsMatch[2] : line;
            const { style } = classifyLine(message);
            return (
              <div key={i} className={`flex gap-2 whitespace-pre-wrap break-all ${style}`}>
                {timestamp && (
                  <span className="shrink-0 select-none text-[#3f3f48]">{timestamp}</span>
                )}
                <span>{message}</span>
              </div>
            );
          })}
          {running && (
            <div className="flex gap-2">
              <span className="text-[#3f3f48]">&nbsp;</span>
              <span className="inline-block h-3.5 w-[7px] animate-pulse bg-[#6e6d78]" />
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
});

export default Terminal;
