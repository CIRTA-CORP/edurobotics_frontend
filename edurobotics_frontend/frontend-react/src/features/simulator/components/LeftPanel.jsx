import React, { useEffect, useState, useRef, useCallback } from "react";
import CodeButtons from '@/features/simulator/components/CodeButtons';
import Panel from '@/features/simulator/components/Panel';
import EditorPanel from '@/features/simulator/editors/EditorPanel';
import DocumentationPanel from '@/features/simulator/components/DocumentationPanel';
import Terminal from '@/features/simulator/components/Terminal';
import { Code2, BookOpen } from "lucide-react";
import { getToken } from '@/features/auth/services/auth';

const BLOCKLY = "blockly";
const EDITOR = "editor";
const DOCUMENTATION = "docs";

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
// Además arranca con un programa que funciona: mover el robot a su posición de reposo.
// Ver algo moverse antes de escribir nada es mejor introducción que un archivo vacío.
const STARTER_CODE = `# Escribe aquí tu programa.
# Pulsa Ejecutar para ver el robot moverse en la vista 3D.

from robot_api import Robot

robot = Robot()

# Posición de reposo: el UR5e queda extendido en horizontal.
robot.move_joints({
    "shoulder_pan_joint": 0.000,
    "shoulder_lift_joint": 0.000,
    "elbow_joint": 0.000,
    "wrist_1_joint": 0.000,
    "wrist_2_joint": 0.000,
    "wrist_3_joint": 0.000,
}, duration=2.0)
`;

export default function LeftPanel({ setAlertType, handleHide, onJointAngles, editorApiRef }) {
  const [enviromentConfig, setEnviromentConfig] = useState({
    language: "python",
    editor: "python",
  });
  const runningEnviroment = "python_env";

  const [runLoading, setRunLoading] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState("");
  const [panelSelected, setPanelSelected] = useState(() => {
    const stored = localStorage.getItem("panelSelected") || EDITOR;
    // Blockly se retiró, pero queda gente con esa pestaña guardada de antes:
    // sin esta guarda, abrirían el simulador en un panel que ya no existe.
    return stored === BLOCKLY ? EDITOR : stored;
  });

  const monacoRef       = useRef(null);
  const decorationsRef  = useRef([]);
  const startTimeRef    = useRef(null);
  // Lines of wrapper code before user code — used to map traceback line → editor line
  const WRAPPER_OFFSET  = 37;

  const ts = () => {
    const n = new Date();
    return `[${String(n.getHours()).padStart(2,"0")}:${String(n.getMinutes()).padStart(2,"0")}:${String(n.getSeconds()).padStart(2,"0")}]`;
  };

  const appendLine = useCallback((line) => {
    setTerminalOutput(prev => (prev ? prev + "\n" : "") + ts() + " " + line);
  }, []);

  const clearTerminal = useCallback(() => setTerminalOutput(""), []);

  const clearDecorations = useCallback(() => {
    if (editorRef.current && decorationsRef.current.length) {
      decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, []);
    }
  }, []);

  const highlightErrorLine = useCallback((wrapperLine) => {
    const editor  = editorRef.current;
    const monaco  = monacoRef.current;
    if (!editor || !monaco) return;
    const userLine = wrapperLine - WRAPPER_OFFSET;
    if (userLine < 1) return;
    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, [{
      range: new monaco.Range(userLine, 1, userLine, 1),
      options: { isWholeLine: true, className: "monaco-error-line" },
    }]);
    editor.revealLineInCenter(userLine);
  }, []);

  const panelSelectedRef = useRef(panelSelected);
  useEffect(() => { panelSelectedRef.current = panelSelected; }, [panelSelected]);

  // HANDLING EDITOR
  const editorRef = useRef();

  const handleEditorDidMount = useCallback((editor, monaco) => {
    editorRef.current  = editor;
    monacoRef.current  = monaco;
    // Inject CSS for error line highlight
    const style = document.createElement("style");
    style.textContent = ".monaco-error-line { background: rgba(255,60,60,0.18) !important; border-left: 3px solid #ff3c3c; }";
    document.head.appendChild(style);
    const savedCode = localStorage.getItem(`code_${runningEnviroment}`) || null;
    editorRef.current.setValue(
      savedCode !== null && savedCode !== undefined ? savedCode : STARTER_CODE
    );

    // El botón «Copiar al editor» de las juntas vive en el panel del simulador, al otro
    // lado del divisor. Se expone aquí la única operación que necesita, para no sacar el
    // editor entero de este componente.
    if (editorApiRef) {
      editorApiRef.current = {
        replaceCode: (code) => {
          editorRef.current?.setValue(code);
          localStorage.setItem(`code_${runningEnviroment}`, code);
          // Si el estudiante está en la Guía, el código aparecería fuera de su vista.
          setPanelSelected(EDITOR);
          editorRef.current?.focus();
        },
      };
    }
  }, [runningEnviroment, editorApiRef]);

  const handleEditorChange = useCallback((value) => {
    localStorage.setItem(`code_${runningEnviroment}`, value);
  }, [runningEnviroment]);

  const handleHideTerminal = useCallback(() => {
    if (editorRef.current) {
        editorRef.current.layout({ width: "auto", height: "auto" });
    }
  }, []);

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
      appendLine("Error: no hay código para ejecutar.");
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
          onJointAngles?.(data.angles);
          return;
        }

        // Session limit (#43): the simulator is full — surface the message and
        // stop the spinner (the server closes right after with 1013).
        if (data.type === "busy") {
          appendLine(data.msg);
          setRunLoading(false);
          return;
        }

        if (data.type === "log" || data.type === "success" || data.type === "error" || data.type === "done") {
          appendLine(data.msg);
          // Detect Python traceback and highlight the offending line in the editor
          if (data.msg) {
            const m = data.msg.match(/File "<string>", line (\d+)/);
            if (m) highlightErrorLine(parseInt(m[1]));
          }
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
      appendLine("Error: no se pudo conectar. ¿Está el backend corriendo?");
      setRunLoading(false);
    };

    ws.onclose = () => {
      setRunLoading(false);
    };
  }, [appendLine, onJointAngles, clearDecorations, highlightErrorLine]);

  const handleStop = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    appendLine("Stopped.");
    setRunLoading(false);
  }, [appendLine]);

  const handleUpload = useCallback((event) => {
    const file = event.target.files[0];
    const fileReader = new FileReader();
    fileReader.onloadend = () => {
      const content = fileReader.result;
      if (editorRef.current) {
        editorRef.current.setValue(content);
      }
      setPanelSelected(EDITOR);
    };
    if (file) {
        fileReader.readAsText(file);
    }
  }, []);

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
          stopDisabled={false}
          handleRun={handleRun}
          handleStop={handleStop}
          handleDownload={() => {}}
          handleUpload={handleUpload}
          handleHide={handleHide}
        />
      </div>

      <div className="flex-grow flex flex-col w-full overflow-hidden relative">
        <div className={`absolute inset-0 ${panelSelected === EDITOR ? 'flex flex-col' : 'hidden'}`}>
          <Panel selected={panelSelected === EDITOR}>
            <div className="flex-grow h-[70%]">
              <EditorPanel
                language={enviromentConfig?.editor}
                handleEditorDidMount={handleEditorDidMount}
                handleEditorChange={handleEditorChange}
              />
            </div>
            <div id="terminal-container" className="h-[30%] max-h-[250px] overflow-y-auto border-t border-[#23232a] bg-[#0d0d10]">
              <Terminal output={terminalOutput} running={runLoading} onHide={handleHideTerminal} onClear={clearTerminal} />
            </div>
          </Panel>
        </div>

        <div className={`absolute inset-0 ${panelSelected === DOCUMENTATION ? 'block' : 'hidden'}`}>
          <Panel id="documentacion" selected={panelSelected === DOCUMENTATION}>
             <DocumentationPanel url_doc={enviromentConfig?.doc_url} />
          </Panel>
        </div>
      </div>
    </div>
  );
}
