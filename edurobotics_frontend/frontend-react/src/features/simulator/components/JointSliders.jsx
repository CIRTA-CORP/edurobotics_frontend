import { useState } from "react";
import { Copy, Check, RotateCcw } from "lucide-react";

const JOINTS = [
  { name: "shoulder_pan_joint",  label: "Shoulder Pan",  min: -3.14, max: 3.14 },
  { name: "shoulder_lift_joint", label: "Shoulder Lift", min: -3.14, max: 3.14 },
  { name: "elbow_joint",         label: "Elbow",         min: -3.14, max: 3.14 },
  { name: "wrist_1_joint",       label: "Wrist 1",       min: -3.14, max: 3.14 },
  { name: "wrist_2_joint",       label: "Wrist 2",       min: -3.14, max: 3.14 },
  { name: "wrist_3_joint",       label: "Wrist 3",       min: -3.14, max: 3.14 },
];

const DEFAULT_ANGLES = Object.fromEntries(JOINTS.map(j => [j.name, 0]));
const toDeg = r => Math.round(r * (180 / Math.PI));

/** Código `robot.move_joints({…})` con los ángulos actuales. */
export function buildMoveJointsCode(angles) {
  const lines = JOINTS.map(j =>
    `    "${j.name}": ${(angles[j.name] ?? 0).toFixed(3)},`
  ).join("\n");
  return `robot.move_joints({\n${lines}\n}, duration=2.0)`;
}

export default function JointSliders({ angles, onChange, onCopyToEditor }) {
  const [copied, setCopied] = useState(false);

  const handleSlider = (name, value) => {
    onChange({ ...angles, [name]: parseFloat(value) });
  };

  const handleReset = () => onChange(DEFAULT_ANGLES);

  const code = buildMoveJointsCode(angles);

  const handleCopy = () => {
    if (onCopyToEditor) {
      onCopyToEditor(code);
    } else {
      // Sin callback directo, se le pide al editor (LeftPanel) que inserte el
      // código; el portapapeles queda de respaldo.
      window.dispatchEvent(new CustomEvent("sim:insert-code", { detail: code }));
      navigator.clipboard.writeText(code);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex h-full w-[236px] shrink-0 flex-col border-l border-[#23232a] bg-[#131316]">
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-[#23232a] px-3.5">
        <span className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-[#6e6d78]">Juntas</span>
        <button
          onClick={handleReset}
          title="Volver a cero"
          className="grid h-[26px] w-[26px] place-items-center rounded-md text-[#6e6d78] transition-colors hover:text-[#f4f4f6]"
        >
          <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.8} />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-3.5 py-4">
        {JOINTS.map(({ name, label, min, max }) => {
          const rad = angles[name];
          const deg = toDeg(rad);
          const pct = ((rad - min) / (max - min)) * 100;
          return (
            <div key={name}>
              <div className="flex items-baseline justify-between gap-2.5">
                <span className="text-xs text-[#a1a0ab]">{label}</span>
                <span className="font-mono text-xs font-semibold text-[#f4f4f6]">{deg}°</span>
              </div>
              <div className="relative mt-2 h-1 rounded-full bg-[#26262d]">
                <span
                  className="absolute left-0 top-0 h-1 rounded-full bg-[#7d79e3]"
                  style={{ width: `${pct.toFixed(1)}%` }}
                />
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={0.01}
                  value={rad}
                  onChange={e => handleSlider(name, e.target.value)}
                  className="absolute inset-0 h-4 w-full -translate-y-1/2 cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-[13px] [&::-webkit-slider-thumb]:w-[13px] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#f4f4f6]"
                  aria-label={label}
                />
              </div>
              <div className="mt-1.5 flex items-center justify-between font-mono text-[9.5px] text-[#4a4a54]">
                <span>-180°</span>
                <span>{rad.toFixed(3)} rad</span>
                <span>180°</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="shrink-0 border-t border-[#23232a] p-3.5">
        <div className="rounded-[9px] border border-[#23232a] bg-[#0d0d10] p-2.5 font-mono text-[10.5px] leading-[17px] text-[#6e6d78]">
          <div className="text-[#a5a1ee]">robot.move_joints({'{'}</div>
          <div className="pl-2.5">
            <span className="text-[#7fd1a8]">"elbow_joint"</span>
            <span>: </span>
            <span className="text-[#f0c987]">{(angles.elbow_joint ?? 0).toFixed(3)}</span>
            <span>,</span>
          </div>
          <div className="pl-2.5 text-[#4a4a54]">… 5 más</div>
          <div>{'}'}, duration=<span className="text-[#f0c987]">2.0</span>)</div>
        </div>
        <button
          onClick={handleCopy}
          className="mt-2.5 inline-flex h-[38px] w-full items-center justify-center gap-2 rounded-[10px] bg-[#f4f4f6] text-[12.5px] font-semibold text-[#16151b] transition-colors hover:bg-white"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" strokeWidth={1.9} />}
          {copied ? "Copiado!" : "Copiar al editor"}
        </button>
      </div>
    </div>
  );
}
