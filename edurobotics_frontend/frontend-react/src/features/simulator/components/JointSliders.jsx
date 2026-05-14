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

export default function JointSliders({ angles, onChange }) {
  const [copied, setCopied] = useState(false);

  const handleSlider = (name, value) => {
    onChange({ ...angles, [name]: parseFloat(value) });
  };

  const handleReset = () => onChange(DEFAULT_ANGLES);

  const handleCopy = () => {
    const lines = JOINTS.map(j =>
      `    "${j.name}": ${angles[j.name].toFixed(3)},`
    ).join("\n");
    const code = `robot.move_joints({\n${lines}\n}, duration=2.0)`;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 border-l border-gray-700 w-52 shrink-0 overflow-y-auto">
      <div className="px-3 py-2 border-b border-gray-700 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Joints</span>
        <button
          onClick={handleReset}
          title="Resetear a cero"
          className="text-gray-400 hover:text-white transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex flex-col gap-3 p-3 flex-1">
        {JOINTS.map(({ name, label, min, max }) => (
          <div key={name} className="flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">{label}</span>
              <span className="text-xs font-mono text-blue-400">
                {toDeg(angles[name])}°
              </span>
            </div>
            <input
              type="range"
              min={min}
              max={max}
              step={0.01}
              value={angles[name]}
              onChange={e => handleSlider(name, e.target.value)}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-blue-500 bg-gray-700"
            />
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-gray-700">
        <button
          onClick={handleCopy}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold py-2 px-3 rounded-lg transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copiado!" : "Copiar código"}
        </button>
        <p className="text-gray-500 text-[10px] text-center mt-1.5">
          Pega en el editor y ejecuta
        </p>
      </div>
    </div>
  );
}
