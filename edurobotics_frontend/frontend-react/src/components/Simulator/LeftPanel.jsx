import React, { useEffect, useState, useRef, useCallback } from "react";
import CodeButtons from "./panels/components/CodeButtons";
import Panel from "./panels/Panel";
import BlocklyPanel from "./panels/BlocklyPanel";
import EditorPanel from "./panels/EditorPanel";
import DocumentationPanel from "./panels/DocumentationPanel";
import Terminal from "./panels/components/Terminal";
import { getToken } from "../../services/auth";

const BLOCKLY = "blockly";
const EDITOR = "editor";
const DOCUMENTATION = "docs";

const ARDUINO_TEMPLATE_CODE = `
// En este editor debes escribir tu código

`;

export default function LeftPanel({ setAlertType, handleHide, onJointAngles }) {
  const [enviromentConfig, setEnviromentConfig] = useState({
    language: "python",
    editor: "python",
    "blockly?": true,
  });
  const runningEnviroment = "python_env";

  const [runLoading, setRunLoading] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState("");
  const [panelSelected, setPanelSelected] = useState(
    localStorage.getItem("panelSelected") || EDITOR
  );

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

  // HANDLING BLOCKLY
  const blocklyCodeRef = useRef("");

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
      savedCode !== null && savedCode !== undefined ? savedCode : ARDUINO_TEMPLATE_CODE
    );
  }, [runningEnviroment]);

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
    const code = editorRef.current?.getValue()?.trim() || blocklyCodeRef.current?.trim();
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
    const wsUrl = `${wsBase}/api/simulator/ws?token=${token}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    setRunLoading(true);
    appendLine("Connecting...");

    ws.onopen = () => {
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
    <div className="flex flex-col h-full w-full bg-[#1e1e1e] text-white">
      <CodeButtons
        runLoading={runLoading}
        stopDisabled={false}
        handleRun={handleRun}
        handleStop={handleStop}
        handleDownload={() => {}}
        handleUpload={handleUpload}
        handleHide={handleHide}
      />

      <div className="flex-grow flex flex-col w-full overflow-hidden relative">
        {enviromentConfig && enviromentConfig["blockly?"] && (
          <div className={`absolute inset-0 ${panelSelected === BLOCKLY ? 'block' : 'hidden'}`}>
            <Panel selected={panelSelected === BLOCKLY}>
              {panelSelected === BLOCKLY && <BlocklyPanel blocklyCodeRef={blocklyCodeRef} />}
            </Panel>
          </div>
        )}

        <div className={`absolute inset-0 ${panelSelected === EDITOR ? 'flex flex-col' : 'hidden'}`}>
          <Panel selected={panelSelected === EDITOR}>
            <div className="flex-grow h-[70%]">
              <EditorPanel
                language={enviromentConfig?.editor}
                handleEditorDidMount={handleEditorDidMount}
                handleEditorChange={handleEditorChange}
              />
            </div>
            <div id="terminal-container" className="h-[30%] max-h-[250px] overflow-y-auto border-t border-gray-700 bg-black">
              <Terminal output={terminalOutput} onHide={handleHideTerminal} onClear={clearTerminal} />
            </div>
          </Panel>
        </div>

        <div className={`absolute inset-0 ${panelSelected === DOCUMENTATION ? 'block' : 'hidden'}`}>
          <Panel id="documentacion" selected={panelSelected === DOCUMENTATION}>
             <DocumentationPanel url_doc={enviromentConfig?.doc_url} />
          </Panel>
        </div>
      </div>

      {/* TABS */}
      <div className="w-full h-12 flex border-t border-gray-700 bg-[#252526] shrink-0">
        {enviromentConfig && enviromentConfig["blockly?"] && (
          <button
            onClick={() => setPanelSelected(BLOCKLY)}
            className={`flex-1 flex justify-center items-center font-medium focus:outline-none ${panelSelected === BLOCKLY ? 'bg-[#007acc] text-white' : 'text-gray-400 hover:bg-[#2d2d2d] hover:text-white'}`}
          >
            Bloques
          </button>
        )}
        <button
          onClick={() => {
            if (panelSelected === BLOCKLY && blocklyCodeRef.current && editorRef.current) {
              editorRef.current.setValue(blocklyCodeRef.current);
            }
            setPanelSelected(EDITOR);
          }}
          className={`flex-1 flex justify-center items-center font-medium focus:outline-none ${panelSelected === EDITOR ? 'bg-[#007acc] text-white' : 'text-gray-400 hover:bg-[#2d2d2d] hover:text-white'}`}
        >
          Editor
        </button>
        <button
          onClick={() => setPanelSelected(DOCUMENTATION)}
          className={`flex-1 flex justify-center items-center font-medium focus:outline-none ${panelSelected === DOCUMENTATION ? 'bg-[#007acc] text-white' : 'text-gray-400 hover:bg-[#2d2d2d] hover:text-white'}`}
        >
          Doc
        </button>
      </div>
    </div>
  );
}
