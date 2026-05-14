import { memo, useState, useEffect, useRef } from "react";
import { Terminal as TerminalIcon, ChevronDown, ChevronUp, Trash2 } from "lucide-react";

const classifyLine = (line) => {
  if (!line || !line.trim()) return { text: line, style: "text-gray-600" };

  // Status lines (connection/execution state)
  if (line.startsWith("Connecting") || line.startsWith("Connected") ||
      line.startsWith("Stopped") || line.startsWith("Executing"))
    return { text: line, style: "text-gray-400 italic" };

  // Success
  if (line.startsWith("Done.") || line.includes("completada") || line.includes("exitoso"))
    return { text: line, style: "text-green-400 font-medium" };

  // Errors
  if (line.startsWith("Error") || line.includes("Error") || line.includes("error"))
    return { text: line, style: "text-red-400" };

  // robot_api — CMD written (key info)
  if (line.includes("CMD written"))
    return { text: line, style: "text-blue-400" };

  // robot_api — waiting/done (secondary info)
  if (line.startsWith("[robot_api]"))
    return { text: line, style: "text-gray-500" };

  // sim messages
  if (line.startsWith("[sim]"))
    return { text: line, style: "text-yellow-500/80" };

  // Animation/frames (metadata, de-emphasized)
  if (line.includes("frames") || line.startsWith("Animation"))
    return { text: line, style: "text-gray-600 text-xs" };

  // stderr warnings
  if (line.startsWith("[stderr]"))
    return { text: line, style: "text-orange-400" };

  return { text: line, style: "text-gray-300" };
};

const Terminal = memo(({ output, onHide, onClear }) => {
  const [hidden, setHidden] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [output]);

  const lines = output ? output.split("\n") : [];

  return (
    <div className="w-full relative flex flex-col h-full bg-[#0d0d0d] font-mono">
      {/* Header */}
      <div className="bg-[#1a1a1a] h-[26px] w-full z-10 shrink-0 border-b border-gray-800 flex items-center px-2 gap-2">
        <TerminalIcon className="w-3.5 h-3.5 text-gray-500" />
        <span className="text-xs text-gray-500 flex-1">Output</span>
        {onClear && (
          <button onClick={onClear} title="Limpiar terminal"
            className="hover:text-gray-300 text-gray-600 transition-colors mr-1">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          onClick={() => { setHidden(!hidden); if (onHide) onHide(); }}
          className="hover:text-gray-300 text-gray-600 transition-colors"
        >
          {hidden ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {!hidden && (
        <div className="flex-grow overflow-auto p-3 text-[13px] leading-5 space-y-0.5">
          {lines.map((line, i) => {
            // Parse optional timestamp prefix [HH:MM:SS]
            const tsMatch = line.match(/^(\[\d{2}:\d{2}:\d{2}\]) (.*)/s);
            const timestamp = tsMatch ? tsMatch[1] : null;
            const message   = tsMatch ? tsMatch[2] : line;
            const { style } = classifyLine(message);
            return (
              <div key={i} className={`${style} whitespace-pre-wrap break-all flex gap-2`}>
                {timestamp && (
                  <span className="text-gray-700 shrink-0 select-none">{timestamp}</span>
                )}
                <span>{message}</span>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
});

export default Terminal;
