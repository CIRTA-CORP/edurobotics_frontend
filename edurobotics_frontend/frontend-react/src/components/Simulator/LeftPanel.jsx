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

export default function LeftPanel({ setAlertType, handleHide }) {
  const [enviromentConfig, setEnviromentConfig] = useState({
    language: "python",
    editor: "python",
    "blockly?": true,
  });
  const runningEnviroment = "python_env";

  const [runLoading, setRunLoading] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState("Terminal ");
  const [terminalLine, setTerminalLine] = useState("");
  const [panelSelected, setPanelSelected] = useState(
    localStorage.getItem("panelSelected") || EDITOR
  );
  
  const [openDownloadModal, setOpenDownloadModal] = useState(false);

  useEffect(() => {
    setTerminalOutput((oldOutput) => oldOutput + "\n" + terminalLine);
  }, [terminalLine]); 

  // HANDLING BLOCKLY
  const blocklyCodeRef = useRef("");

  // HANDLING EDITOR
  const editorRef = useRef();

  const handleEditorDidMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
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
      // 150ms: debe ser mayor al debounce del ResizeDetector (100ms)
      // para que este layout() sea el último en ejecutarse
      const timer = setTimeout(() => {
        editorRef.current?.layout();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [panelSelected]);

  // WebSocket reference para la ejecución de código
  const wsRef = useRef(null);

  const handleRun = useCallback(() => {
    // Obtener código: editor tiene prioridad si tiene contenido
    const code = editorRef.current?.getValue()?.trim() || blocklyCodeRef.current?.trim();
    if (!code) {
      setTerminalLine("⚠️  No hay código para ejecutar.");
      return;
    }

    // Cerrar WS anterior si existe
    if (wsRef.current) {
      wsRef.current.close();
    }

    const token = getToken();
    const wsUrl = `ws://localhost:8000/api/simulator/ws?token=${token}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    setRunLoading(true);
    setTerminalLine("🔌 Conectando con el simulador...");

    ws.onopen = () => {
      setTerminalLine("✅ Conexión establecida. Enviando código...");
      ws.send(JSON.stringify({ type: "run", body: code }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "log" || data.type === "success" || data.type === "error") {
          setTerminalLine(data.msg);
        }
        if (data.type === "success" || data.type === "error") {
          setRunLoading(false);
          ws.close();
        }
      } catch {
        setTerminalLine(event.data);
      }
    };

    ws.onerror = () => {
      setTerminalLine("❌ Error de conexión WebSocket. ¿Está el backend corriendo?");
      setRunLoading(false);
    };

    ws.onclose = () => {
      setRunLoading(false);
    };
  }, []);

  const handleStop = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setTerminalLine("🛑 Ejecución detenida por el usuario.");
    setRunLoading(false);
  }, []);


  const handleDownload = useCallback(() => {
      // Mock download
  }, []);

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
        handleDownload={() => setOpenDownloadModal(true)}
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
              <Terminal output={terminalOutput} onHide={handleHideTerminal} />
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
            // Si venimos de Bloques, sincronizar el código generado al Editor
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
