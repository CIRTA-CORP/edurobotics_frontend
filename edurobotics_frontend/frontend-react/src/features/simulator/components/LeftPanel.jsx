import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useLocation } from "react-router-dom";
import CodeButtons from '@/features/simulator/components/CodeButtons';
import Panel from '@/features/simulator/components/Panel';
import EditorPanel from '@/features/simulator/editors/EditorPanel';
import DocumentationPanel from '@/features/simulator/components/DocumentationPanel';
import Terminal from '@/features/simulator/components/Terminal';
import { Code2, BookOpen, RotateCcw } from "lucide-react";
import { getToken, getStoredUser } from '@/features/auth/services/auth';
import { classifyMessage } from '@/features/simulator/lib/terminalLines';
import { planInsertion } from '@/features/simulator/lib/editorCode';

const BLOCKLY = "blockly";
const EDITOR = "editor";

// Enfoca el editor y muestra una línea cuando ya se ve. Quien llama acaba de cambiar a la
// pestaña Editor, pero el cambio se pinta en el siguiente render: hasta entonces el editor
// está oculto (display: none), sin tamaño, y ni el foco ni el desplazamiento surten efecto.
function focusWhenVisible(editor, lineNumber) {
  requestAnimationFrame(() => requestAnimationFrame(() => {
    editor.layout();
    editor.revealLineInCenterIfOutsideViewport(lineNumber);
    editor.focus();
  }));
}
const DOCUMENTATION = "docs";

// Terminal: alto por defecto y límites, en píxeles. El alto se recuerda en el navegador.
const TERMINAL_HEADER = 36;
const TERMINAL_DEFAULT = 220;
const TERMINAL_MIN = 96;
const EDITOR_MIN = 140;
const TERMINAL_HEIGHT_KEY = "simTerminalHeight";

function readTerminalHeight() {
  try {
    const stored = Number(localStorage.getItem(TERMINAL_HEIGHT_KEY));
    return Number.isFinite(stored) && stored >= TERMINAL_MIN ? stored : TERMINAL_DEFAULT;
  } catch {
    return TERMINAL_DEFAULT;
  }
}

// Resalta unas líneas un momento. Cuando el código cambia desde fuera del editor —una postura
// añadida, un ejemplo, un archivo— el cambio no se nota si no se señala.
function flashLines(editor, monaco, ranges) {
  if (!editor || !monaco || !ranges.length) return;
  const collection = editor.createDecorationsCollection(ranges.map(([from, to]) => ({
    range: new monaco.Range(from, 1, to, 1),
    options: { isWholeLine: true, className: "sim-line-added" },
  })));
  setTimeout(() => collection.clear(), 1600);
}

/* ── Top bar tab button (canvas: pestañas en la cabecera del panel) ──────────── */
function TabButton({ label, icon, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`
        inline-flex h-8 flex-shrink-0 items-center gap-2 rounded-lg px-3.5
        text-[12.5px] font-semibold transition-colors focus-visible:outline-none
        focus-visible:ring-2 focus-visible:ring-[#a5a1ee]
        ${active
          ? 'bg-[#7d79e3]/[0.14] text-[#a5a1ee]'
          : 'text-[#6e6d78] hover:text-[#f4f4f6]'}
      `}
    >
      {icon}
      {label}
    </button>
  );
}

// Plantilla inicial del editor. El entorno es Python (`python_env`), así que el comentario
// va con `#`: la plantilla anterior empezaba con `//`, que es C++, y un estudiante que
// pulsara Ejecutar sin escribir nada recibía un SyntaxError como primera experiencia.
//
// Es un recorrido que siempre se ve moverse. La plantilla anterior llevaba el brazo a todo
// cero: si ya estaba ahí, no pasaba nada, y parecía que el simulador no funcionaba. Esta
// empieza poniendo el brazo vertical, venga de donde venga, y gira la muñeca con el brazo
// arriba: con el brazo horizontal la herramienta queda a 6 cm del suelo y los dedos chocan
// con él. Verificada en la máquina real: sin choques ni avisos, ~22 s.
const STARTER_CODE = `# Tu primer programa: un recorrido por lo que sabe hacer el robot.
# Pulsa Ejecutar (o Ctrl+Enter). Abre la Guía para ver todo lo que puedes usar.

from robot_api import Robot

robot = Robot()

print("1. Brazo vertical")
robot.move_joints({
    "shoulder_pan_joint": 0.0,
    "shoulder_lift_joint": -1.57,
    "elbow_joint": 0.0,
    "wrist_1_joint": -1.57,
    "wrist_2_joint": 0.0,
    "wrist_3_joint": 0.0,
}, duration=3.0)

print("2. Girar la muñeca una vuelta y media")
robot.move_joints({"wrist_3_joint": 3.14}, duration=2.5)
robot.move_joints({"wrist_3_joint": 0.0}, duration=2.5)

print("3. Postura de trabajo: codo doblado, pinza hacia abajo")
robot.move_joints({
    "shoulder_lift_joint": -1.57,
    "elbow_joint": 1.57,
    "wrist_1_joint": -1.57,
    "wrist_2_joint": -1.57,
}, duration=3.0)

print("4. Girar la base a la izquierda")
robot.move_joints({"shoulder_pan_joint": 1.0}, duration=3.0)

print("5. Cerrar y abrir la pinza")
robot.close_gripper()
robot.open_gripper()

print("6. Girar la base a la derecha")
robot.move_joints({"shoulder_pan_joint": -1.0}, duration=3.0)

print("7. Volver al brazo vertical")
robot.move_joints({
    "shoulder_pan_joint": 0.0,
    "shoulder_lift_joint": -1.57,
    "elbow_joint": 0.0,
    "wrist_1_joint": -1.57,
    "wrist_2_joint": 0.0,
    "wrist_3_joint": 0.0,
}, duration=3.0)

print("Listo")
`;

export default function LeftPanel({ handleHide, onJointAngles, onQueueChange, editorApiRef }) {
  const runningEnviroment = "python_env";

  // Código de la clase, si se llegó desde un bloque «Código para el simulador»
  // (ContentViewer). Solo se acepta con la forma exacta que pone la clase: el estado de la
  // navegación viene del historial del navegador, y un estado viejo o raro no debe poner
  // nada inesperado en el editor.
  const location = useLocation();
  const lessonCode = useMemo(() => {
    const lc = location.state?.lessonCode;
    if (!lc || typeof lc.code !== "string" || lc.unitId == null || !Number.isInteger(lc.index)) {
      return null;
    }
    return lc;
  }, [location.state]);

  // Una clave por cuenta y por ejercicio: usuario + unidad + posición del bloque entre los
  // de simulador de esa unidad.
  //
  // El usuario va en la clave porque esto vive en el navegador, no en la cuenta, y cerrar
  // sesión no lo borra. En una sala de computación, el alumno que se sienta después en el
  // mismo equipo vería la versión del anterior. Con el usuario en la clave, cada cuenta ve
  // lo suyo aunque compartan navegador. Sin sesión (no debería pasar aquí) se usa `anon`,
  // que tampoco se mezcla con nadie.
  //
  // La unidad y la posición, porque antes había una sola clave para todo y lo escrito en una
  // clase aparecía en otra. No se usa un hash del código: corregir una errata en el bloque
  // cambiaría la clave y el alumno perdería lo que llevaba. El coste es que reordenar
  // bloques los cruza; para eso está «Restablecer».
  //
  // Entrar sin venir de una clase usa `code_python_env:user:<id>`. Lo guardado antes en la
  // clave antigua, sin usuario, no se adopta a propósito: no hay forma de saber de quién
  // era, y en un equipo compartido adoptarlo sería justo el cruce que esto evita.
  const userKey = useMemo(() => getStoredUser()?.id ?? "anon", []);
  const storageKey = lessonCode
    ? `code_${runningEnviroment}:user:${userKey}:unit:${lessonCode.unitId}:${lessonCode.index}`
    : `code_${runningEnviroment}:user:${userKey}`;

  // Si el código actual difiere del de la clase. Solo cambia cuando cruza esa frontera,
  // así que no vuelve a pintar el panel en cada tecla.
  const [isModified, setIsModified] = useState(false);
  // El editor de Monaco ya está montado: hace falta para registrar el atajo de teclado.
  const [editorReady, setEditorReady] = useState(false);

  const [runLoading, setRunLoading] = useState(false);
  const [terminalOpen, setTerminalOpen] = useState(true);
  const [terminalHeight, setTerminalHeight] = useState(readTerminalHeight);
  const editorAreaRef = useRef(null);
  // Aviso breve sobre el editor ({ id, text }); se va solo.
  const [notice, setNotice] = useState(null);
  const noticeTimerRef = useRef(null);
  const showNotice = useCallback((text) => {
    clearTimeout(noticeTimerRef.current);
    setNotice({ id: Date.now(), text });
    noticeTimerRef.current = setTimeout(() => setNotice(null), 2600);
  }, []);
  useEffect(() => () => clearTimeout(noticeTimerRef.current), []);
  // Filas de la terminal, ya clasificadas: { id, time, kind, text } (lib/terminalLines.js).
  const [terminalEntries, setTerminalEntries] = useState([]);
  const entryIdRef = useRef(0);
  const [panelSelected, setPanelSelected] = useState(() => {
    // Viniendo de una clase se abre en el Editor: es donde está el código que se pidió ver,
    // aunque la última vez el alumno dejara abierta la Guía.
    if (lessonCode) return EDITOR;
    const stored = localStorage.getItem("panelSelected") || EDITOR;
    // Blockly se retiró, pero queda gente con esa pestaña guardada de antes:
    // sin esta guarda, abrirían el simulador en un panel que ya no existe.
    return stored === BLOCKLY ? EDITOR : stored;
  });

  // Declarado antes de los callbacks que lo usan (clearDecorations, highlightErrorLine…)
  const editorRef       = useRef();
  const monacoRef       = useRef(null);
  const decorationsRef  = useRef([]);
  const startTimeRef    = useRef(null);

  const ts = () => {
    const n = new Date();
    return `${String(n.getHours()).padStart(2,"0")}:${String(n.getMinutes()).padStart(2,"0")}:${String(n.getSeconds()).padStart(2,"0")}`;
  };

  // `type` es el tipo del mensaje del backend (log, success, error…) o 'local' para los del
  // propio panel. Se clasifica al entrar, no al pintar: ver lib/terminalLines.js.
  const appendMessage = useCallback((type, msg) => {
    const row = classifyMessage(type, msg);
    if (!row) return;
    entryIdRef.current += 1;
    const entry = { id: entryIdRef.current, time: ts(), ...row };
    setTerminalEntries((prev) => [...prev, entry]);
  }, []);

  const appendLine = useCallback((line) => appendMessage("local", line), [appendMessage]);
  const appendError = useCallback((line) => appendMessage("local-error", line), [appendMessage]);

  const clearTerminal = useCallback(() => setTerminalEntries([]), []);

  const clearDecorations = useCallback(() => {
    if (editorRef.current && decorationsRef.current.length) {
      decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, []);
    }
  }, []);

  // Recibe la línea YA en la numeración del editor: la traduce el backend, que es el único
  // que sabe cuánto mide el código que envuelve al del alumno (mensaje `error_line`).
  //
  // Antes se restaba aquí un 37 escrito a mano y se buscaba `File "<string>"` en el texto.
  // Nunca funcionó: el programa corre leyendo de la entrada estándar y Python escribe
  // `File "<stdin>"`, así que la expresión no coincidía nunca. Y el 37 dejó de ser cierto
  // en cuanto el wrapper cambió de longitud.
  const highlightErrorLine = useCallback((userLine) => {
    const editor  = editorRef.current;
    const monaco  = monacoRef.current;
    if (!editor || !monaco || !Number.isInteger(userLine) || userLine < 1) return;
    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, [{
      range: new monaco.Range(userLine, 1, userLine, 1),
      options: { isWholeLine: true, className: "monaco-error-line" },
    }]);
    editor.revealLineInCenter(userLine);
  }, []);

  const panelSelectedRef = useRef(panelSelected);
  useEffect(() => { panelSelectedRef.current = panelSelected; }, [panelSelected]);

  // HANDLING EDITOR
  const handleEditorDidMount = useCallback((editor, monaco) => {
    editorRef.current  = editor;
    monacoRef.current  = monaco;
    setEditorReady(true);
    // Primero la versión del alumno de este ejercicio; si no hay, la de la clase; si no se
    // viene de una clase, la plantilla.
    const savedCode = localStorage.getItem(storageKey) || null;
    const initial = savedCode ?? lessonCode?.code ?? STARTER_CODE;
    editorRef.current.setValue(initial);
    setIsModified(Boolean(lessonCode) && initial !== lessonCode.code);

    // «Añadir al editor», de la vista previa de posturas, vive en el panel del simulador, al
    // otro lado del divisor. Se expone aquí la única operación que necesita.
    //
    // AÑADE, no reemplaza: antes ponía una sola línea `robot.move_joints(...)` en lugar del
    // programa entero, sin import ni `robot = Robot()`, y al ejecutarla daba NameError. Ahora
    // se agrega al final lo que falte (ver lib/editorCode.js), como una edición: Ctrl+Z la
    // deshace. El guardado lo hace handleEditorChange, que salta con la edición.
    if (editorApiRef) {
      editorApiRef.current = {
        insertMove: (angles) => {
          const ed = editorRef.current;
          const model = ed?.getModel();
          if (!ed || !model) return;
          const { prefix, suffix, bodyLength } = planInsertion(model.getValue(), angles);
          const bodyEnd = model.getPositionAt(bodyLength);
          const fileEnd = model.getFullModelRange().getEndPosition();
          const edits = [{
            range: new monaco.Range(bodyEnd.lineNumber, bodyEnd.column, fileEnd.lineNumber, fileEnd.column),
            text: suffix,
          }];
          if (prefix) edits.unshift({ range: new monaco.Range(1, 1, 1, 1), text: prefix });
          ed.pushUndoStop();
          ed.executeEdits("anadir-movimiento", edits);
          ed.pushUndoStop();
          // Si el estudiante está en la Guía, el código aparecería fuera de su vista.
          setPanelSelected(EDITOR);
          const last = model.getLineCount();
          ed.setPosition({ lineNumber: last, column: 1 });
          focusWhenVisible(ed, last);
          // Lo añadido al final ocupa las últimas líneas antes de la línea vacía final; la
          // cabecera, si se puso, las primeras.
          const added = suffix.replace(/^\n+|\n+$/g, "").split("\n").length;
          const ranges = [[last - added, last - 1]];
          if (prefix) ranges.push([1, prefix.replace(/\n+$/, "").split("\n").length]);
          flashLines(ed, monaco, ranges);
          showNotice("Postura añadida al final de tu programa · Ctrl+Z para deshacer");
        },
      };
    }
  }, [storageKey, lessonCode, editorApiRef, showNotice]);

  const handleEditorChange = useCallback((value) => {
    localStorage.setItem(storageKey, value);
    if (lessonCode) setIsModified(value !== lessonCode.code);
  }, [storageKey, lessonCode]);

  // Vuelve al código ACTUAL del profesor, el que trae la clase, no a una copia guardada.
  //
  // Se reemplaza con una edición y no con setValue, a propósito: setValue vacía el
  // historial de deshacer, y entonces pulsar Restablecer sin querer borraría el trabajo del
  // alumno sin vuelta atrás. Así, Ctrl+Z lo recupera.
  const handleRestoreLessonCode = useCallback(() => {
    const editor = editorRef.current;
    const model = editor?.getModel();
    if (!editor || !model || !lessonCode) return;
    editor.pushUndoStop();
    editor.executeEdits("restablecer-codigo-clase", [
      { range: model.getFullModelRange(), text: lessonCode.code },
    ]);
    editor.pushUndoStop();
    editor.focus();
  }, [lessonCode]);

  // Antes plegar la terminal ocultaba su contenido pero dejaba el hueco: el editor no
  // crecía. Ahora plegada ocupa solo su cabecera, y el editor (que vigila su tamaño) se
  // reajusta solo.
  const toggleTerminal = useCallback(() => setTerminalOpen((open) => !open), []);

  const clampTerminal = useCallback((height) => {
    const area = editorAreaRef.current?.clientHeight ?? 0;
    const max = Math.max(TERMINAL_MIN, area - EDITOR_MIN);
    return Math.round(Math.min(max, Math.max(TERMINAL_MIN, height)));
  }, []);

  const saveTerminalHeight = useCallback((height) => {
    try { localStorage.setItem(TERMINAL_HEIGHT_KEY, String(height)); } catch { /* sin almacenamiento */ }
  }, []);

  // Arrastrar el borde entre editor y terminal.
  const handleResizeStart = useCallback((event) => {
    event.preventDefault();
    const area = editorAreaRef.current;
    if (!area) return;
    const bottom = area.getBoundingClientRect().bottom;
    let latest = null;
    const onMove = (e) => {
      latest = clampTerminal(bottom - e.clientY);
      setTerminalHeight(latest);
      setTerminalOpen(true);
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      if (latest !== null) saveTerminalHeight(latest);
    };
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }, [clampTerminal, saveTerminalHeight]);

  // Y con el teclado: flechas arriba y abajo, de 24 en 24 píxeles.
  const handleResizeKey = useCallback((event) => {
    const step = event.key === "ArrowUp" ? 24 : event.key === "ArrowDown" ? -24 : 0;
    if (!step) return;
    event.preventDefault();
    const next = clampTerminal(terminalHeight + step);
    setTerminalHeight(next);
    setTerminalOpen(true);
    saveTerminalHeight(next);
  }, [clampTerminal, saveTerminalHeight, terminalHeight]);

  // Fix Monaco negro: cuando el tab Editor se activa, hay que forzar layout()
  // porque Monaco pierde sus dimensiones al estar oculto con 'hidden'
  useEffect(() => {
    if (panelSelected === EDITOR && editorRef.current) {
      const timer = setTimeout(() => {
        editorRef.current?.layout();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [panelSelected]);

  // WebSocket reference para la ejecución de código
  const wsRef = useRef(null);

  const handleRun = useCallback(() => {
    const code = editorRef.current?.getValue()?.trim();
    if (!code) {
      appendError("No hay código para ejecutar.");
      return;
    }

    clearDecorations();

    if (wsRef.current) {
      wsRef.current.close();
    }

    const token = getToken();
    const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:8001';
    const wsBase = apiBase.replace(/^http/, 'ws');
    const wsUrl = `${wsBase}/api/simulator/ws`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    setRunLoading(true);
    setTerminalOpen(true);
    appendLine("Connecting...");

    ws.onopen = () => {
      // Authenticate off-URL: send the token as the FIRST message (query-string
      // tokens leak into proxy/server logs), then the run request.
      ws.send(JSON.stringify({ token }));
      startTimeRef.current = Date.now();
      appendLine("Connected. Executing...");
      ws.send(JSON.stringify({ type: "run", body: code }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "joint_angles") {
          // `t` es el instante de captura, en segundos desde que arrancó la
          // grabación. El visor lo necesita para saber cuánto tardó el robot en
          // ir de una posición a la siguiente, y reproducirlo a esa velocidad.
          onJointAngles?.(data.angles, data.t);
          return;
        }

        // Hay una sola máquina con un solo robot, así que ejecuta uno cada vez.
        // Cuando está ocupada no se rechaza al alumno: espera turno y el servidor
        // le va diciendo su puesto. No tiene que pulsar nada — cuando le toca, su
        // programa arranca solo. El indicador de "ejecutando" se mantiene, porque
        // desde su punto de vista sigue esperando a que su código corra.
        if (data.type === "queued") {
          onQueueChange?.({ position: data.position });
          appendLine(`En cola — tu turno: ${data.position}. Esperando a que se libere el simulador…`);
          return;
        }

        if (data.type === "queue_ready") {
          onQueueChange?.(null);
          appendLine("Es tu turno. Ejecutando…");
          return;
        }

        if (data.type === "queue_timeout") {
          onQueueChange?.(null);
          appendMessage("error", data.msg);
          setRunLoading(false);
          return;
        }

        if (data.type === "error_line") {
          highlightErrorLine(data.line);
          return;
        }

        if (data.type === "log" || data.type === "success" || data.type === "error" || data.type === "done") {
          appendMessage(data.type, data.msg);
        }

        // On success/error: stop the spinner immediately so the user sees feedback,
        // but keep the WS open — joint_angles frames arrive AFTER these messages.
        if (data.type === "success" || data.type === "error") {
          const elapsed = startTimeRef.current
            ? ((Date.now() - startTimeRef.current) / 1000).toFixed(1)
            : null;
          if (elapsed) appendLine(`Execution time: ${elapsed}s`);
          setRunLoading(false);
          return;
        }

        // 'done' means the backend has finished sending all animation frames — safe to close
        if (data.type === "done") {
          ws.close();
        }
      } catch {
        appendLine(event.data);
      }
    };

    ws.onerror = () => {
      onQueueChange?.(null);
      appendError("No se pudo conectar con el simulador. Revisa tu conexión y vuelve a intentarlo.");
      setRunLoading(false);
    };

    ws.onclose = () => {
      onQueueChange?.(null);
      setRunLoading(false);
    };
  }, [appendLine, appendError, appendMessage, onJointAngles, onQueueChange, clearDecorations, highlightErrorLine]);

  // Ctrl+Enter / Cmd+Enter ejecuta, como en cualquier playground. Se registra como acción
  // del editor y se vuelve a registrar cuando handleRun cambia, para que el atajo llame
  // siempre a la versión actual.
  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editorReady || !editor || !monaco) return undefined;
    const action = editor.addAction({
      id: "edurobotics.ejecutar",
      label: "Ejecutar el programa",
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
      run: () => handleRun(),
    });
    return () => action.dispose();
  }, [editorReady, handleRun]);

  const handleStop = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    appendLine("Stopped.");
    setRunLoading(false);
  }, [appendLine]);

  // Descargar el programa como programa.py. El botón existía pero no hacía nada.
  const handleDownload = useCallback(() => {
    const code = editorRef.current?.getValue() ?? "";
    const url = URL.createObjectURL(new Blob([code], { type: "text/x-python;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "programa.py";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, []);

  // Reemplaza el programa entero como una edición, no con setValue: setValue vacía el
  // historial y el alumno perdería lo que tenía sin poder volver con Ctrl+Z.
  const replaceProgram = useCallback((code, source, message) => {
    const editor = editorRef.current;
    const model = editor?.getModel();
    if (!editor || !model) return;
    editor.pushUndoStop();
    editor.executeEdits(source, [{ range: model.getFullModelRange(), text: code }]);
    editor.pushUndoStop();
    setPanelSelected(EDITOR);
    editor.setPosition({ lineNumber: 1, column: 1 });
    focusWhenVisible(editor, 1);
    showNotice(message);
  }, [showNotice]);

  // «Abrir en el editor», en los ejemplos de la Guía.
  const handleUseExample = useCallback(
    (code) => replaceProgram(code, "abrir-ejemplo", "Ejemplo abierto en el editor · Ctrl+Z para volver a tu código"),
    [replaceProgram],
  );

  const handleUpload = useCallback((event) => {
    const input = event.target;
    const file = input.files[0];
    if (!file) return;
    const fileReader = new FileReader();
    fileReader.onloadend = () => {
      if (typeof fileReader.result === "string") {
        replaceProgram(fileReader.result, "subir-archivo", `${file.name} abierto en el editor · Ctrl+Z para volver`);
      }
    };
    fileReader.readAsText(file);
    // Sin esto, volver a subir el mismo archivo no dispara onChange.
    input.value = "";
  }, [replaceProgram]);

  return (
    <div className="flex h-full w-full flex-col bg-[#131316] text-[#f4f4f6]">
      {/* Barra superior: pestañas a la izquierda, acciones a la derecha
          (canvas Simulador: las pestañas suben del pie a la cabecera del panel). */}
      <div className="flex h-[46px] shrink-0 items-center justify-between gap-4 border-b border-[#23232a] bg-[#1a1a1f] px-3">
        <div className="flex min-w-0 items-center gap-[2px]">
          <TabButton
            label="Editor"
            icon={<Code2 className="w-3.5 h-3.5" strokeWidth={1.8} />}
            active={panelSelected === EDITOR}
            onClick={() => setPanelSelected(EDITOR)}
          />
          <TabButton
            label="Guía"
            icon={<BookOpen className="w-3.5 h-3.5" strokeWidth={1.8} />}
            active={panelSelected === DOCUMENTATION}
            onClick={() => setPanelSelected(DOCUMENTATION)}
          />
        </div>
        <CodeButtons
          runLoading={runLoading}
          stopDisabled={!runLoading}
          handleRun={handleRun}
          handleStop={handleStop}
          handleDownload={handleDownload}
          handleUpload={handleUpload}
          handleHide={handleHide}
        />
      </div>

      <div className="flex-grow flex flex-col w-full overflow-hidden relative">
        <div className={`absolute inset-0 ${panelSelected === EDITOR ? 'flex flex-col' : 'hidden'}`}>
          <Panel selected={panelSelected === EDITOR}>
            {lessonCode && (
              <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#23232a] bg-[#7d79e3]/[0.08] px-3.5 py-2">
                <p className="min-w-0 truncate text-[12px] text-[#a1a0ab]">
                  Código de la clase:{" "}
                  <span className="font-semibold text-[#f4f4f6]" title={lessonCode.unitTitle}>
                    {lessonCode.unitTitle || "sin título"}
                  </span>
                </p>
                <button
                  type="button"
                  onClick={handleRestoreLessonCode}
                  disabled={!isModified}
                  title="Vuelve al código que puso el profesor. Ctrl+Z lo deshace."
                  className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-[11.5px] font-semibold text-[#a5a1ee] transition-colors hover:bg-[#7d79e3]/[0.14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a5a1ee] disabled:cursor-default disabled:text-[#55555f] disabled:hover:bg-transparent"
                >
                  <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.8} />
                  Restablecer el código de la clase
                </button>
              </div>
            )}
            <div ref={editorAreaRef} className="flex min-h-0 flex-1 flex-col">
              <div className="relative min-h-0 flex-1">
                <EditorPanel
                  handleEditorDidMount={handleEditorDidMount}
                  handleEditorChange={handleEditorChange}
                />
                {notice && (
                  <div
                    key={notice.id}
                    role="status"
                    className="sim-notice pointer-events-none absolute bottom-3 right-4 z-20 max-w-[calc(100%-2rem)] rounded-lg border border-[#7d79e3]/30 bg-[#16161b]/95 px-3 py-2 text-[12px] font-medium text-[#d6d4f5] shadow-lg shadow-black/40 backdrop-blur"
                  >
                    {notice.text}
                  </div>
                )}
              </div>
              {terminalOpen && (
                <div
                  role="separator"
                  aria-orientation="horizontal"
                  aria-label="Cambiar el alto de la terminal"
                  aria-valuenow={terminalHeight}
                  tabIndex={0}
                  onPointerDown={handleResizeStart}
                  onKeyDown={handleResizeKey}
                  className="group relative h-[5px] shrink-0 cursor-row-resize border-t border-[#23232a] bg-[#0d0d10] focus-visible:outline-none"
                >
                  <span className="absolute inset-x-0 top-[-3px] h-[7px] transition-colors group-hover:bg-[#7d79e3]/40 group-focus-visible:bg-[#7d79e3]/60 group-active:bg-[#7d79e3]/60" />
                </div>
              )}
              <div
                id="terminal-container"
                style={{ height: terminalOpen ? terminalHeight : TERMINAL_HEADER }}
                className={`shrink-0 overflow-hidden bg-[#0d0d10] ${terminalOpen ? "" : "border-t border-[#23232a]"}`}
              >
                <Terminal
                  entries={terminalEntries}
                  running={runLoading}
                  open={terminalOpen}
                  onToggle={toggleTerminal}
                  onClear={clearTerminal}
                />
              </div>
            </div>
          </Panel>
        </div>

        <div className={`absolute inset-0 ${panelSelected === DOCUMENTATION ? 'block' : 'hidden'}`}>
          <Panel id="documentacion" selected={panelSelected === DOCUMENTATION}>
             <DocumentationPanel onUseCode={handleUseExample} />
          </Panel>
        </div>
      </div>
    </div>
  );
}
