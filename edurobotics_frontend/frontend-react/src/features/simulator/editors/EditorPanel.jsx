import React, { memo, useEffect, useCallback, useRef } from "react";
import Editor, { loader } from "@monaco-editor/react";
import { useResizeDetector } from "react-resize-detector";

// El editor viaja con la aplicación, no se descarga de un CDN.
//
// `@monaco-editor/react` es solo el envoltorio; el editor de verdad es
// `monaco-editor`. Si no se le dice dónde está, `@monaco-editor/loader` recurre a
// una URL de jsDelivr que lleva cableada, y entonces cada alumno descarga y
// ejecuta varios MB de código de un tercero, con acceso al token de su sesión.
//
// Se importa la API del editor y el registro de lenguajes básicos, que es lo que
// da el coloreado de Python. No se entra a la ruta interna de un solo lenguaje:
// esas rutas cambian entre versiones de Monaco —en la 0.55 había una carpeta por
// lenguaje y en la 0.56 ya no— y este es el punto de entrada estable. Las
// gramáticas se cargan bajo demanda, así que no se paga por los que no se usan.
import * as monaco from "monaco-editor/editor/editor.api";
import "monaco-editor/basic-languages/monaco.contribution";

// Monaco delega trabajo a web workers. Python no tiene worker de lenguaje —se
// resuelve con coloreado, sin análisis en segundo plano— así que basta el worker
// base. El sufijo `?worker` le dice a Vite que lo empaquete como worker.
import EditorWorker from "monaco-editor/editor/editor.worker?worker";

self.MonacoEnvironment = {
  getWorker() {
    return new EditorWorker();
  },
};

loader.config({ monaco });

const PanelEditor = memo(({ handleEditorDidMount, handleEditorChange }) => {
  const editorRef = useRef();

  const _handleEditorDidMount = useCallback(
    (editor, monaco) => {
      editorRef.current = editor;
      handleEditorDidMount(editor, monaco);
    },
    [handleEditorDidMount]
  );

  const onResize = useCallback(
    (width, height) => {
      // Guard: never pass 0 dimensions to Monaco
      // (happens when panel is hidden with 'hidden' class)
      if (editorRef.current && width > 0 && height > 0) {
        editorRef.current?.layout({ height, width });
      }
    },
    [editorRef]
  );

  const { ref } = useResizeDetector({
    handleHeight: true,
    handleWidth: true,
    refreshMode: "debounce",
    refreshRate: 100,
    onResize,
  });

  const windowResize = useCallback(() => {
    editorRef.current?.layout({
      width: "auto",
      height: "auto",
    });
  }, [editorRef]);

  useEffect(() => {
    window.addEventListener("resize", windowResize);

    return () => {
      window.removeEventListener("resize", windowResize);
    };
  }, [windowResize]);

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      ref={ref}
    >
      <Editor
        className="panel"
        // El simulador ejecuta Python y nada más. Antes esto caía a "cpp" cuando
        // el lenguaje no era python, una rama inalcanzable porque el entorno lo
        // fija a "python": solo servía para sugerir un soporte que no existe, y
        // obligaba a empaquetar un lenguaje que nunca se usa.
        language="python"
        theme="vs-dark"
        onChange={handleEditorChange}
        onMount={_handleEditorDidMount}
        options={{
          minimap: {
            enabled: false,
          },
          semanticHighlighting: {
            enabled: true,
          },
          scrollBeyondLastLine: false,
        }}
      />
    </div>
  );
});

export default PanelEditor;
