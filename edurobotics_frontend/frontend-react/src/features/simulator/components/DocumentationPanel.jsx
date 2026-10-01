/**
 * Guía del simulador: cómo se ejecuta un programa y la referencia completa de robot_api.
 *
 * Todo lo que dice está comprobado contra el código, no escrito de memoria:
 * - la API, los rangos y la regla de velocidad salen de simulation/robot_api.py;
 * - los límites (40 s, tamaño, turnos) salen de backend/app/features/robotics/routes.py;
 * - cada ejemplo se ejecutó en la máquina del simulador sin choques ni avisos.
 *
 * La guía anterior nombraba una librería que no existe (robot_interface), prometía salida
 * «en tiempo real» cuando llega al terminar, y su ejemplo se quedaba bloqueado contra el
 * suelo a 14° del objetivo. Si se cambia robot_api, esta guía se revisa con él.
 */
import { memo, useCallback, useEffect, useState } from "react";
import { Check, Copy, CornerDownLeft, Info, TriangleAlert } from "lucide-react";
import * as monaco from "monaco-editor/editor/editor.api";
import { EDITOR_THEME } from "@/features/simulator/editors/EditorPanel";
import { CODE_FONT_FAMILY } from "@/features/simulator/lib/codeFont";

// ── Ejemplos (verificados en el simulador) ──────────────────────────────────

const FIRST = `from robot_api import Robot

robot = Robot()

# Brazo vertical: una postura segura, lejos del suelo
robot.move_joints({
    "shoulder_pan_joint": 0.0,
    "shoulder_lift_joint": -1.57,
    "elbow_joint": 0.0,
    "wrist_1_joint": -1.57,
    "wrist_2_joint": 0.0,
    "wrist_3_joint": 0.0,
}, duration=3.0)

# Girar la base 90° hacia la izquierda
robot.move_joints({"shoulder_pan_joint": 1.57}, duration=2.0)`;

const DEGREES = `import math
from robot_api import Robot

robot = Robot()

# 45 grados, convertidos a radianes
robot.move_joints({"shoulder_pan_joint": math.radians(45)}, duration=2.0)`;

const LOOP = `from robot_api import Robot

robot = Robot()

for angulo in [-1.0, 0.0, 1.0, 0.0]:
    print("Base a", angulo, "rad")
    robot.move_joints({"shoulder_pan_joint": angulo}, duration=1.5)`;

const RELATIVE = `from robot_api import Robot

robot = Robot()

actual = robot.get_joint_states()
print("La base está en", round(actual["shoulder_pan_joint"], 3), "rad")

# Medio radián más de lo que está ahora
robot.move_joints({"shoulder_pan_joint": actual["shoulder_pan_joint"] + 0.5}, duration=1.5)`;

const GRIPPER = `from robot_api import Robot

robot = Robot()

robot.close_gripper()
robot.open_gripper(duration=0.5)`;

const WORK_POSE = `from robot_api import Robot

robot = Robot()

# Postura de trabajo: codo doblado y la pinza mirando hacia abajo
robot.move_joints({
    "shoulder_pan_joint": 0.0,
    "shoulder_lift_joint": -1.57,
    "elbow_joint": 1.57,
    "wrist_1_joint": -1.57,
    "wrist_2_joint": -1.57,
    "wrist_3_joint": 0.0,
}, duration=3.0)`;

const COLLISION = `from robot_api import Robot, RobotCollisionError

robot = Robot()

try:
    # Bajar el brazo hasta el suelo: el robot se detendrá al tocarlo
    robot.move_joints({"shoulder_lift_joint": 0.9, "elbow_joint": 0.0}, duration=2.0)
except RobotCollisionError as error:
    print("El robot se detuvo:", error)
    # Volver a subir
    robot.move_joints({"shoulder_lift_joint": -1.57}, duration=3.0)`;

// Firmas de la referencia: fragmentos, no programas. No llevan «Abrir en el editor».
const SIG_IMPORT = `from robot_api import Robot, RobotCollisionError

robot = Robot()`;
const SIG_MOVE = `robot.move_joints(angulos, duration=2.0)`;
const SIG_STATES = `robot.get_joint_states()  # → {"shoulder_pan_joint": 0.0, ...}`;
const SIG_GRIPPER = `robot.open_gripper(duration=1.0)
robot.close_gripper(duration=1.0)`;
const SIG_HOME = `robot.home(duration=3.0)`;

// ── Datos de referencia ─────────────────────────────────────────────────────

const SECTIONS = [
  ["como-funciona", "Cómo funciona"],
  ["primer-programa", "Primer programa"],
  ["referencia", "Referencia"],
  ["articulaciones", "Articulaciones"],
  ["recetas", "Recetas"],
  ["limites", "Límites"],
  ["errores", "Errores"],
  ["herramientas", "Herramientas"],
];

const JOINTS = [
  ["shoulder_pan_joint", "Base", "Gira todo el brazo alrededor del eje vertical.", "±360°"],
  ["shoulder_lift_joint", "Hombro", "Sube y baja el brazo. −1,57 lo deja vertical; 0, horizontal; positivo lo baja hacia el suelo.", "±360°"],
  ["elbow_joint", "Codo", "Dobla el antebrazo.", "±180°"],
  ["wrist_1_joint", "Muñeca 1", "Inclina la muñeca hacia arriba o abajo.", "±360°"],
  ["wrist_2_joint", "Muñeca 2", "Gira la muñeca hacia los lados.", "±360°"],
  ["wrist_3_joint", "Muñeca 3", "Gira la herramienta (la pinza) sobre su eje.", "±360°"],
];

const CONVERSIONS = [
  ["30°", "0,524", "math.pi / 6"],
  ["45°", "0,785", "math.pi / 4"],
  ["90°", "1,571", "math.pi / 2"],
  ["180°", "3,142", "math.pi"],
  ["360°", "6,283", "2 * math.pi"],
];

const POSES = [
  ["Vertical", "0, −1,57, 0, −1,57, 0, 0", "Brazo recto hacia arriba. El mejor punto de partida: lejos del suelo y de sí mismo."],
  ["Trabajo", "0, −1,57, 1,57, −1,57, −1,57, 0", "Codo doblado y pinza hacia abajo, lista para tomar algo de la mesa."],
  ["Cero (home)", "0, 0, 0, 0, 0, 0", "Brazo extendido en horizontal. La herramienta queda a unos 6 cm del suelo."],
];

const ERRORS = [
  {
    match: "NameError: name 'robot' is not defined",
    cause: "Falta crear el robot antes de usarlo.",
    fix: "Añade robot = Robot() después del import.",
  },
  {
    match: "ModuleNotFoundError / ImportError",
    cause: "El nombre de la librería está mal escrito.",
    fix: "La línea exacta es from robot_api import Robot.",
  },
  {
    match: "ValueError: Articulaciones desconocidas",
    cause: "Un nombre de articulación tiene una errata.",
    fix: "Usa los seis nombres de la tabla de articulaciones, con guion bajo y en minúsculas.",
  },
  {
    match: "ValueError: … está fuera del rango del UR5e",
    cause: "Casi siempre son grados escritos donde van radianes: 90 en vez de 1,57.",
    fix: "Convierte con math.radians(90). El robot rechaza el ángulo en vez de recortarlo, para que no acabe en otro sitio.",
  },
  {
    match: "AVISO: el UR5e no gira a más de 180°/s",
    cause: "La duración pedida es más corta de lo que el robot puede hacer.",
    fix: "No es un error: el movimiento se alarga a lo mínimo posible. Para evitar el aviso, sube duration.",
  },
  {
    match: "AVISO: … quedó a N° del objetivo",
    cause: "Algo impidió que la articulación llegara: normalmente, un contacto.",
    fix: "Revisa si la postura toca el suelo o el propio brazo.",
  },
  {
    match: "PARADA: Parada de protección",
    cause: "El brazo chocó consigo mismo o con el suelo y se detuvo donde estaba.",
    fix: "Sube primero el brazo (shoulder_lift_joint hacia −1,57) y luego haz el giro. Si quieres que el programa siga, captura RobotCollisionError.",
  },
  {
    match: "Tu programa superó el tiempo máximo de 40 s",
    cause: "El programa tardó más de lo permitido.",
    fix: "Acorta las duraciones o el número de movimientos. Lo que alcanzó a hacer se muestra igual.",
  },
];

// ── Piezas ──────────────────────────────────────────────────────────────────

const CODE_STYLE = { fontFamily: CODE_FONT_FAMILY, fontVariantLigatures: "contextual" };

/** Código coloreado con el mismo tokenizador y tema que el editor. */
const CodeBlock = memo(function CodeBlock({ code, onUse }) {
  const [html, setHtml] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    // colorize pinta con el tema activo: se fija aquí por si la Guía se abre antes que el
    // editor. Devuelve HTML generado por Monaco a partir de estos textos fijos.
    monaco.editor.setTheme(EDITOR_THEME);
    monaco.editor
      .colorize(code, "python", { tabSize: 4 })
      .then((out) => alive && setHtml(out))
      .catch(() => { /* sin color: se queda el texto plano */ });
    return () => { alive = false; };
  }, [code]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* sin permiso de portapapeles */
    }
  }, [code]);

  return (
    <div className="group relative my-4 overflow-hidden rounded-xl border border-[#1f1f26] bg-[#0a0a0d]">
      <div className="absolute right-2 top-2 flex gap-1 opacity-80 transition-opacity group-hover:opacity-100">
        {onUse && (
          <button
            type="button"
            onClick={() => onUse(code)}
            title="Reemplaza el código del editor por este ejemplo. Ctrl+Z lo deshace."
            className="inline-flex h-7 items-center gap-1.5 rounded-md border border-[#2a2a31] bg-[#16161b] px-2 text-[11px] font-semibold text-[#a5a1ee] transition-colors hover:border-[#7d79e3]/50 hover:bg-[#7d79e3]/[0.14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a5a1ee]"
          >
            <CornerDownLeft className="h-3.5 w-3.5" strokeWidth={1.8} />
            Abrir en el editor
          </button>
        )}
        <button
          type="button"
          onClick={handleCopy}
          title={copied ? "Copiado" : "Copiar"}
          aria-label={copied ? "Copiado" : "Copiar el código"}
          className="grid h-7 w-7 place-items-center rounded-md border border-[#2a2a31] bg-[#16161b] text-[#8b8a95] transition-colors hover:text-[#f4f4f6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a5a1ee]"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-[#6ee7b7]" strokeWidth={2} /> : <Copy className="h-3.5 w-3.5" strokeWidth={1.8} />}
        </button>
      </div>
      {html ? (
        <pre
          className="m-0 overflow-x-auto px-4 py-3.5 text-[12.5px] leading-[1.7] text-[#e4e3ea]"
          style={CODE_STYLE}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <pre className="m-0 overflow-x-auto px-4 py-3.5 text-[12.5px] leading-[1.7] text-[#e4e3ea]" style={CODE_STYLE}>
          {code}
        </pre>
      )}
    </div>
  );
});

const C = ({ children }) => (
  <code
    className="rounded-[5px] border border-[#24242b] bg-white/[0.04] px-[5px] py-px text-[0.86em] text-[#d6d4f5]"
    style={CODE_STYLE}
  >
    {children}
  </code>
);

const Section = ({ id, kicker, title, children }) => (
  <section id={id} className="scroll-mt-4 border-t border-[#1c1c22] pt-10 first:border-t-0 first:pt-0">
    {kicker && <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[#7d79e3]">{kicker}</p>}
    <h2 className="mb-4 text-[21px] font-bold tracking-[-0.01em] text-[#f4f4f6]">{title}</h2>
    <div className="space-y-4 text-[14px] leading-[1.72] text-[#b4b3bd]">{children}</div>
  </section>
);

const Callout = ({ tone = "info", children }) => {
  const warn = tone === "warn";
  const Icon = warn ? TriangleAlert : Info;
  return (
    <div className={`flex gap-3 rounded-xl border p-4 text-[13.5px] leading-[1.65] ${
      warn ? "border-[#fbbf24]/25 bg-[#fbbf24]/[0.06] text-[#e9dcb8]" : "border-[#7d79e3]/25 bg-[#7d79e3]/[0.07] text-[#cfcde8]"
    }`}>
      <Icon className={`mt-[3px] h-4 w-4 shrink-0 ${warn ? "text-[#fcd34d]" : "text-[#a5a1ee]"}`} strokeWidth={1.9} />
      <div className="min-w-0">{children}</div>
    </div>
  );
};

/** Una entrada de la referencia de la API. */
const ApiEntry = ({ signature, children }) => (
  <div className="rounded-xl border border-[#1f1f26] bg-[#111114] px-5 pb-1 pt-4">
    <CodeBlock code={signature} />
    <div className="space-y-3 pb-3 text-[13.5px] leading-[1.7] text-[#b4b3bd]">{children}</div>
  </div>
);

const Params = ({ rows }) => (
  <div className="overflow-hidden rounded-lg border border-[#1f1f26]">
    {rows.map(([name, type, desc]) => (
      <div key={name} className="grid grid-cols-[minmax(0,150px)_minmax(0,1fr)] gap-3 border-t border-[#1f1f26] px-3.5 py-2.5 first:border-t-0">
        <div className="min-w-0">
          <C>{name}</C>
          <p className="mt-1 text-[11.5px] text-[#6e6d78]">{type}</p>
        </div>
        <p className="min-w-0 text-[13px] leading-[1.6] text-[#b4b3bd]">{desc}</p>
      </div>
    ))}
  </div>
);

const Recipe = ({ title, children, code, onUse }) => (
  <div>
    <h3 className="text-[15px] font-semibold text-[#f4f4f6]">{title}</h3>
    <p className="mt-1 text-[13.5px] leading-[1.65] text-[#a1a0ab]">{children}</p>
    <CodeBlock code={code} onUse={onUse} />
  </div>
);

// ── Guía ────────────────────────────────────────────────────────────────────

export default function DocumentationPanel({ onUseCode }) {
  const goTo = useCallback((id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <div className="h-full w-full overflow-y-auto bg-[#0d0d10] text-[#dcdbe4]">
      <div className="mx-auto max-w-[780px] px-6 pb-16 pt-9 sm:px-8">

        <header className="mb-8">
          <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.2em] text-[#a5a1ee]">Guía de programación</p>
          <h1 className="text-[30px] font-bold leading-[1.15] tracking-[-0.02em] text-[#f4f4f6]">
            Programa el UR5e con Python
          </h1>
          <p className="mt-3 max-w-[600px] text-[14.5px] leading-[1.7] text-[#a1a0ab]">
            Todo lo necesario para mover el brazo y la pinza con <C>robot_api</C>: cómo se ejecuta un programa,
            la referencia completa de la librería, recetas probadas y qué hacer cuando algo falla.
          </p>
        </header>

        <nav aria-label="Secciones de la guía" className="mb-10 flex flex-wrap gap-1.5">
          {SECTIONS.map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => goTo(id)}
              className="rounded-full border border-[#23232a] bg-white/[0.02] px-3 py-1 text-[12px] font-medium text-[#a1a0ab] transition-colors hover:border-[#7d79e3]/45 hover:text-[#f4f4f6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a5a1ee]"
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="space-y-10">

          <Section id="como-funciona" kicker="Antes de empezar" title="Cómo funciona una ejecución">
            <ol className="space-y-3">
              {[
                <>Pulsa <strong className="text-[#f4f4f6]">Iniciar simulador</strong> en el panel del robot. Encender la máquina en la nube puede tardar hasta 2 minutos; mientras, puedes ir escribiendo.</>,
                <>Escribe tu programa y pulsa <strong className="text-[#f4f4f6]">Ejecutar</strong> o <C>Ctrl</C> + <C>Enter</C>. El programa viaja al simulador, en la nube.</>,
                <>Allí se ejecuta entero, con física: el brazo tiene peso, motores con límites de velocidad y puede chocar. Es Python 3 normal: variables, bucles, funciones y <C>math</C> funcionan como siempre.</>,
                <>Cuando termina, la terminal muestra lo que imprimió y el visor <strong className="text-[#f4f4f6]">reproduce el movimiento</strong> a la misma velocidad a la que ocurrió.</>,
              ].map((step, i) => (
                <li key={i} className="flex gap-3.5">
                  <span className="mt-[2px] grid h-6 w-6 shrink-0 place-items-center rounded-md border border-[#7d79e3]/30 bg-[#7d79e3]/[0.12] text-[12px] font-bold text-[#a5a1ee]">{i + 1}</span>
                  <p className="min-w-0">{step}</p>
                </li>
              ))}
            </ol>
            <Callout>
              Por eso los <C>print</C> aparecen todos juntos al final, y el brazo se mueve después de
              «Programa terminado»: lo que ves es la grabación de lo que hizo el robot.
            </Callout>
            <Callout>
              <strong className="text-[#f4f4f6]">El brazo conserva su postura entre ejecuciones</strong>, como un robot
              real. Si ejecutas dos veces un programa que lleva a una postura, la segunda vez no se mueve: ya está ahí.
              Para ver movimiento siempre, empieza el programa llevando el brazo a una postura conocida (por ejemplo,
              la vertical) y muévelo desde allí.
            </Callout>
          </Section>

          <Section id="primer-programa" kicker="Paso a paso" title="Tu primer programa">
            <p>Este programa pone el brazo vertical y después gira la base 90° a la izquierda.</p>
            <CodeBlock code={FIRST} onUse={onUseCode} />
            <ul className="list-disc space-y-2 pl-5 marker:text-[#55545e]">
              <li><C>from robot_api import Robot</C> trae la librería del robot. Va al principio de todo programa.</li>
              <li><C>robot = Robot()</C> crea la conexión con el brazo. Con una por programa basta.</li>
              <li><C>move_joints</C> recibe un diccionario <em>articulación → ángulo en radianes</em> y una duración en segundos. Las articulaciones que no nombres se quedan donde están: por eso el segundo movimiento solo menciona la base.</li>
            </ul>
          </Section>

          <Section id="referencia" kicker="robot_api" title="Referencia de la librería">
            <ApiEntry signature={SIG_IMPORT}>
              <p>
                <C>Robot</C> es la interfaz con el brazo y la pinza. <C>RobotCollisionError</C> es el error que se lanza en una
                parada de protección; solo hace falta importarlo si lo vas a capturar.
              </p>
              <p>
                El módulo también expone <C>ARM_JOINTS</C> (la lista de las seis articulaciones), <C>JOINT_LIMITS</C> (el
                rango de cada una, en radianes) y <C>MAX_VELOCITY</C> (π rad/s).
              </p>
            </ApiEntry>

            <ApiEntry signature={SIG_MOVE}>
              <p>Mueve las articulaciones del brazo a los ángulos indicados y <strong className="text-[#f4f4f6]">vuelve cuando el brazo ha llegado</strong>, no tras un tiempo fijo: la línea siguiente empieza con el movimiento terminado.</p>
              <Params rows={[
                ["angulos", "dict", "Articulación → ángulo en radianes. Puedes nombrar de una a seis; las demás conservan su ángulo."],
                ["duration", "float · 2.0", "Segundos que dura el movimiento. El brazo sale y llega suave, sin tirones."],
              ]} />
              <p>
                <strong className="text-[#f4f4f6]">Velocidad.</strong> Ninguna articulación del UR5e gira a más de 180°/s.
                El movimiento es suave, así que a mitad de camino va a 1,875 veces su velocidad media; si la duración pedida
                lo obligaría a pasar de 180°/s, se alarga a lo mínimo posible y la terminal lo avisa. Girar 90° dura, como
                mínimo, 0,94 s.
              </p>
              <p>
                <strong className="text-[#f4f4f6]">Errores.</strong> <C>ValueError</C> si una articulación no existe, si el ángulo
                no es un número o si está fuera de su rango; <C>RobotCollisionError</C> si el brazo choca durante el movimiento.
                Si una articulación termina a más de 2° del objetivo, la terminal muestra un aviso.
              </p>
            </ApiEntry>

            <ApiEntry signature={SIG_STATES}>
              <p>
                Devuelve los ángulos <em>medidos</em> en este momento, en radianes, en un diccionario con las seis articulaciones del
                brazo y también las de la pinza. Sirve para moverse respecto a donde está el brazo (ver «Mover respecto a la
                postura actual» en Recetas).
              </p>
            </ApiEntry>

            <ApiEntry signature={SIG_GRIPPER}>
              <p>
                Abren y cierran la pinza Robotiq 85. Vuelven cuando la pinza deja de moverse, aunque se cierre sobre un objeto
                y no llegue al final: justo lo que pasa al agarrar algo. <C>duration</C> va en segundos (mínimo 0,1).
              </p>
            </ApiEntry>

            <ApiEntry signature={SIG_HOME}>
              <p>Lleva todas las articulaciones a 0: el brazo extendido en horizontal.</p>
              <Callout tone="warn">
                En esa postura la herramienta queda a unos 6 cm del suelo, apuntando de lado. Girar la muñeca ahí barre los
                dedos de la pinza contra el suelo y provoca una parada de protección, como le pasaría a un UR5e sobre una mesa.
                Para girar la muñeca, hazlo con el brazo vertical.
              </Callout>
            </ApiEntry>

            <ApiEntry signature="RobotCollisionError">
              <p>
                Si durante un movimiento el brazo choca consigo mismo o con el suelo, se detiene donde está —una
                <em> parada de protección</em>, como en un robot real— y se lanza este error. Si no lo capturas, el programa
                termina ahí y la terminal lo marca como <strong className="text-[#fdba74]">PARADA</strong>. Con
                <C>try</C> / <C>except</C> puedes reaccionar y seguir (ver «Reaccionar a un choque» en Recetas).
              </p>
            </ApiEntry>
          </Section>

          <Section id="articulaciones" kicker="El UR5e" title="Articulaciones, unidades y posturas">
            <div className="overflow-hidden rounded-xl border border-[#1f1f26]">
              {JOINTS.map(([name, label, desc, range]) => (
                <div key={name} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1 border-t border-[#1f1f26] bg-[#111114] px-4 py-3 first:border-t-0">
                  <div className="min-w-0">
                    <span className="text-[13.5px] font-semibold text-[#f4f4f6]">{label}</span>{" "}
                    <C>{name}</C>
                    <p className="mt-1 text-[13px] leading-[1.6] text-[#a1a0ab]">{desc}</p>
                  </div>
                  <span className="pt-0.5 text-[12px] tabular-nums text-[#8b8a95]" style={CODE_STYLE}>{range}</span>
                </div>
              ))}
            </div>

            <p>
              Los ángulos van en <strong className="text-[#f4f4f6]">radianes</strong>. Una vuelta completa son 2π ≈ 6,283 rad.
              Si piensas en grados, convierte con <C>math.radians(grados)</C>.
            </p>
            <div className="grid grid-cols-3 overflow-hidden rounded-xl border border-[#1f1f26] text-[12.5px]">
              {["Grados", "Radianes", "En Python"].map((h) => (
                <div key={h} className="bg-white/[0.03] px-3.5 py-2 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[#6e6d78]">{h}</div>
              ))}
              {CONVERSIONS.flatMap(([deg, rad, py]) => [
                <div key={`${deg}d`} className="border-t border-[#1f1f26] px-3.5 py-2 text-[#dcdbe4]">{deg}</div>,
                <div key={`${deg}r`} className="border-t border-[#1f1f26] px-3.5 py-2 tabular-nums text-[#dcdbe4]" style={CODE_STYLE}>{rad}</div>,
                <div key={`${deg}p`} className="border-t border-[#1f1f26] px-3.5 py-2 text-[#d6d4f5]" style={CODE_STYLE}>{py}</div>,
              ])}
            </div>

            <h3 className="pt-2 text-[15px] font-semibold text-[#f4f4f6]">Posturas de referencia</h3>
            <p className="text-[13px] text-[#8b8a95]">Ángulos en el orden base, hombro, codo, muñeca 1, muñeca 2, muñeca 3.</p>
            <div className="space-y-2">
              {POSES.map(([name, angles, desc]) => (
                <div key={name} className="rounded-xl border border-[#1f1f26] bg-[#111114] px-4 py-3">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="text-[13.5px] font-semibold text-[#f4f4f6]">{name}</span>
                    <span className="text-[12px] text-[#a5a1ee]" style={CODE_STYLE}>{angles}</span>
                  </div>
                  <p className="mt-1 text-[13px] leading-[1.6] text-[#a1a0ab]">{desc}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section id="recetas" kicker="Probadas en el simulador" title="Recetas">
            <p>
              Cada receta es un programa completo. <strong className="text-[#f4f4f6]">Abrir en el editor</strong> reemplaza tu
              código por el ejemplo; si lo pulsas sin querer, <C>Ctrl</C> + <C>Z</C> en el editor lo recupera.
            </p>
            <Recipe title="Trabajar en grados" code={DEGREES} onUse={onUseCode}>
              <C>math.radians</C> convierte grados a radianes, para no tener que hacer la cuenta.
            </Recipe>
            <Recipe title="Repetir con un bucle" code={LOOP} onUse={onUseCode}>
              La base visita varias posiciones una tras otra. Cada <C>move_joints</C> espera a que termine el anterior.
            </Recipe>
            <Recipe title="Mover respecto a la postura actual" code={RELATIVE} onUse={onUseCode}>
              <C>get_joint_states</C> lee dónde está el brazo; a partir de ahí, se suma o resta lo que se quiera.
            </Recipe>
            <Recipe title="Usar la pinza" code={GRIPPER} onUse={onUseCode}>
              Cerrar y abrir; la apertura, más rápida que el cierre.
            </Recipe>
            <Recipe title="Postura de trabajo" code={WORK_POSE} onUse={onUseCode}>
              El codo doblado y la pinza apuntando hacia abajo: la postura típica para tomar algo de la mesa.
            </Recipe>
            <Recipe title="Reaccionar a un choque" code={COLLISION} onUse={onUseCode}>
              El brazo baja hasta tocar el suelo, el robot se detiene y el programa, en vez de terminar, lo sube de nuevo.
            </Recipe>
          </Section>

          <Section id="limites" kicker="Para tener en cuenta" title="Límites del simulador">
            <ul className="space-y-3">
              {[
                ["40 segundos por programa.", "Si se pasa, se detiene; lo que alcanzó a imprimir y a moverse se muestra igual."],
                ["Un robot para todos.", "Hay un solo simulador, así que se ejecuta un programa a la vez. Si otra persona está ejecutando, esperas tu turno y la terminal te dice tu puesto en la fila; la espera máxima es de 5 minutos."],
                ["Programas de tamaño normal.", "Un programa muy largo no cabe en el envío y la terminal lo avisa. Un programa de clase está muy lejos de ese límite."],
                ["Sin teclado.", "El programa no puede pedir datos mientras corre: input() no está disponible."],
                ["Detener no frena el brazo.", "Deja de esperar la respuesta en esta pantalla, pero el programa que ya se envió termina igual en el simulador (como máximo 40 s) y el brazo queda donde ese programa lo deje."],
                ["Tu código se guarda solo.", "En este navegador, por usuario y por ejercicio: si recargas o cambias de clase, cada programa sigue en su sitio."],
              ].map(([title, body]) => (
                <li key={title} className="flex gap-3">
                  <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#7d79e3]" />
                  <p className="min-w-0"><strong className="text-[#f4f4f6]">{title}</strong> {body}</p>
                </li>
              ))}
            </ul>
          </Section>

          <Section id="errores" kicker="Cuando algo falla" title="Errores frecuentes">
            <p>
              Si el programa falla, la línea del error se marca en rojo en el editor y la terminal muestra el detalle, con el
              número de línea de <em>tu programa</em>.
            </p>
            <div className="space-y-2">
              {ERRORS.map(({ match, cause, fix }) => (
                <div key={match} className="rounded-xl border border-[#1f1f26] bg-[#111114] px-4 py-3">
                  <p className="text-[12.5px] text-[#fda4af]" style={CODE_STYLE}>{match}</p>
                  <p className="mt-1.5 text-[13px] leading-[1.6] text-[#b4b3bd]">{cause}</p>
                  <p className="mt-1 text-[13px] leading-[1.6] text-[#8b8a95]">{fix}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section id="herramientas" kicker="El entorno" title="Herramientas del editor">
            <ul className="space-y-3">
              {[
                [<><C>Ctrl</C> + <C>Enter</C></>, "Ejecuta el programa, igual que el botón Ejecutar."],
                [<><C>Ctrl</C> + <C>Z</C></>, "Deshace cualquier cambio, también los de «Abrir en el editor», «Añadir al editor» y «Restablecer el código de la clase»."],
                ["Vista previa de posturas", "El botón de deslizadores, en el panel del robot. Mueve solo la vista, no el robot: sirve para buscar una postura. Cuando la tengas, «Añadir al editor» agrega al final de tu programa un move_joints con esos ángulos, y también el import y robot = Robot() si faltaban. Ejecuta el programa para que el robot vaya ahí."],
                ["Terminal", "Muestra lo que imprime tu programa y los avisos del robot. Arrastra su borde superior para cambiar el alto; la flecha la pliega, y al ejecutar se abre sola."],
                ["Código de la clase", "Si la clase trae código, aparece en el editor. «Restablecer el código de la clase» vuelve al del profesor."],
                ["Descargar y subir", "Descargar guarda tu programa como programa.py; subir abre un archivo .py en el editor."],
              ].map(([title, body], i) => (
                <li key={i} className="grid grid-cols-[minmax(0,170px)_minmax(0,1fr)] gap-4 rounded-xl border border-[#1f1f26] bg-[#111114] px-4 py-3">
                  <span className="text-[13px] font-semibold text-[#f4f4f6]">{title}</span>
                  <span className="text-[13px] leading-[1.6] text-[#a1a0ab]">{body}</span>
                </li>
              ))}
            </ul>
          </Section>
        </div>

        <footer className="mt-14 border-t border-[#1c1c22] pt-6">
          <p className="text-center text-[11.5px] text-[#55545e]">EduRobotics · CIRTA</p>
        </footer>
      </div>
    </div>
  );
}
