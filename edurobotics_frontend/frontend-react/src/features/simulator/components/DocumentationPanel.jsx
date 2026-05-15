/**
 * Documentation Panel
 *
 * In-app step-by-step guide explaining how to program and use the simulator.
 * Replaces the previous iframe pointing to external documentation so the
 * student never leaves the platform.
 */

const STEPS = [
  {
    n: 1,
    title: 'Inicia el simulador',
    desc: 'Pulsa el botón Iniciar simulador en el panel derecho. El entorno ROS2 + PyBullet se levanta en la nube y el robot UR5 aparece en la vista 3D. La primera carga puede tardar hasta 90 segundos.',
  },
  {
    n: 2,
    title: 'Elige cómo programar',
    desc: 'Tienes dos formas de escribir tu programa: la pestaña Bloques para programación visual con bloques que se arrastran, o la pestaña Editor para escribir código Python directamente. Los bloques se sincronizan automáticamente con el editor.',
  },
  {
    n: 3,
    title: 'Escribe tu programa',
    desc: 'Usa los bloques de Movimiento, Sensores y Pantalla LED de la columna izquierda, o escribe tu código Python a mano. La librería robot_interface ya está disponible para mover las articulaciones del UR5.',
  },
  {
    n: 4,
    title: 'Ejecuta el código',
    desc: 'Pulsa el botón verde Ejecutar en la barra superior. El código viaja al contenedor en la nube vía WebSocket y el output aparece en tiempo real en la terminal de abajo.',
  },
  {
    n: 5,
    title: 'Observa el robot moverse',
    desc: 'Las articulaciones que muevas en el código se reflejan en el modelo 3D del panel derecho. Puedes cambiar el ángulo de cámara, llevar el robot a la posición home, o usar los sliders manuales para mover cada articulación.',
  },
  {
    n: 6,
    title: 'Detén el simulador',
    desc: 'Cuando termines pulsa el botón Detener para liberar el contenedor en la nube. El simulador también se detiene automáticamente tras un período de inactividad.',
  },
];

const TIPS = [
  {
    title: 'Articulaciones del UR5',
    body: 'El robot tiene 6 articulaciones: shoulder_pan_joint, shoulder_lift_joint, elbow_joint, wrist_1_joint, wrist_2_joint y wrist_3_joint. Los valores se expresan en radianes.',
  },
  {
    title: 'Errores en la terminal',
    body: 'Si tu código tiene un error de sintaxis, la línea problemática se resalta en rojo en el editor y la terminal muestra el traceback completo de Python.',
  },
  {
    title: 'Guardado automático',
    body: 'Tu código se guarda automáticamente en el navegador. Si recargas la página, tu programa sigue ahí.',
  },
];

const SAMPLE_CODE = `from robot_api import Robot

robot = Robot()

robot.move_joints({
    "shoulder_pan_joint": -0.340,
    "shoulder_lift_joint": 0.480,
    "elbow_joint": -1.540,
    "wrist_1_joint": 0.750,
    "wrist_2_joint": 0.000,
    "wrist_3_joint": 0.000,
}, duration=2.0)`;

export default function DocumentationPanel() {
  return (
    <div className="w-full h-full overflow-y-auto bg-slate-950 text-slate-200">
      <div className="max-w-3xl mx-auto px-8 py-10">

        {/* Header */}
        <div className="mb-10">
          <p className="text-[11px] font-semibold text-blue-400 uppercase tracking-[0.2em] mb-2">
            Guía rápida
          </p>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
            Cómo usar el simulador
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            Sigue estos pasos para escribir tu primer programa y ver el robot UR5 moverse en 3D.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-4 mb-12">
          {STEPS.map((step) => (
            <div
              key={step.n}
              className="group relative bg-slate-900/60 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors"
            >
              <div className="flex gap-4">
                <div className="shrink-0 w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30 flex items-center justify-center">
                  <span className="text-sm font-bold text-blue-400">{step.n}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-white mb-1">
                    {step.title}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Sample code */}
        <div className="mb-12">
          <h2 className="text-xl font-bold text-white mb-1 tracking-tight">
            Ejemplo de código
          </h2>
          <p className="text-sm text-slate-400 mb-4">
            Copia y pega esto en el editor para mover el robot a una posición inicial.
          </p>
          <pre className="bg-slate-900 border border-slate-800 rounded-xl p-5 overflow-x-auto text-xs text-slate-300 font-mono leading-relaxed">
{SAMPLE_CODE}
          </pre>
        </div>

        {/* Tips */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4 tracking-tight">
            Consejos útiles
          </h2>
          <div className="grid gap-3">
            {TIPS.map((tip, i) => (
              <div
                key={i}
                className="bg-slate-900/40 border border-slate-800 rounded-lg p-4"
              >
                <h4 className="text-sm font-semibold text-white mb-1">{tip.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{tip.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer note */}
        <div className="border-t border-slate-800 pt-6 mt-10">
          <p className="text-xs text-slate-500 text-center">
            EduRobotics · CIRTA CORP · Versión Beta
          </p>
        </div>

      </div>
    </div>
  );
}
