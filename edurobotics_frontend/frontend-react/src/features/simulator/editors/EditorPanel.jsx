import React, { memo, useEffect, useCallback, useRef } from "react";
import Editor, { loader } from "@monaco-editor/react";
import { useResizeDetector } from "react-resize-detector";
import { CODE_FONT_FAMILY, remeasureWhenFontLoads } from "@/features/simulator/lib/codeFont";

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

// Tema propio con la paleta del simulador. `vs-dark` tiene un fondo gris azulado que
// desentonaba con el resto de la pantalla. Colores de sintaxis en la línea de One Dark, la
// paleta que usa codi.link, ajustados al fondo casi negro.
export const EDITOR_THEME = "edurobotics-dark";
monaco.editor.defineTheme(EDITOR_THEME, {
  base: "vs-dark",
  inherit: true,
  rules: [
    { token: "comment", foreground: "6b6a76", fontStyle: "italic" },
    { token: "keyword", foreground: "c792ea" },
    { token: "string", foreground: "a5d6a7" },
    { token: "string.escape", foreground: "89ddff" },
    { token: "number", foreground: "f5b97a" },
    { token: "delimiter", foreground: "8b8a95" },
    { token: "delimiter.bracket", foreground: "a1a0ab" },
    { token: "identifier", foreground: "e4e3ea" },
    { token: "type", foreground: "82aaff" },
    { token: "predefined", foreground: "82aaff" },
  ],
  colors: {
    "editor.background": "#0d0d10",
    "editor.foreground": "#e4e3ea",
    "editor.lineHighlightBackground": "#ffffff08",
    "editor.lineHighlightBorder": "#00000000",
    "editor.selectionBackground": "#7d79e340",
    "editor.inactiveSelectionBackground": "#7d79e322",
    "editor.selectionHighlightBackground": "#7d79e31f",
    "editorCursor.foreground": "#a5a1ee",
    "editorLineNumber.foreground": "#3f3f48",
    "editorLineNumber.activeForeground": "#8b8a95",
    "editorIndentGuide.background1": "#ffffff0a",
    "editorIndentGuide.activeBackground1": "#ffffff1f",
    "editorBracketMatch.background": "#7d79e326",
    "editorBracketMatch.border": "#7d79e366",
    "editorWidget.background": "#16161b",
    "editorWidget.border": "#2a2a31",
    "editorSuggestWidget.background": "#16161b",
    "editorSuggestWidget.border": "#2a2a31",
    "editorSuggestWidget.selectedBackground": "#7d79e333",
    "scrollbarSlider.background": "#ffffff14",
    "scrollbarSlider.hoverBackground": "#ffffff24",
    "scrollbarSlider.activeBackground": "#ffffff30",
  },
});

loader.config({ monaco });

// Opciones tomadas de codi.link: poco adorno (sin minimapa, sin margen de iconos, sin
// plegado), relleno arriba y abajo, nada de desplazamiento más allá del final, cursor y
// desplazamiento suaves. Más ajuste de línea —los diccionarios de move_joints son largos— y
// sangría de 4, que es Python.
const EDITOR_OPTIONS = {
  fontFamily: CODE_FONT_FAMILY,
  fontSize: 14,
  lineHeight: 23,
  fontLigatures: true,
  tabSize: 4,
  insertSpaces: true,
  wordWrap: "on",
  minimap: { enabled: false },
  glyphMargin: false,
  folding: false,
  lineDecorationsWidth: 14,
  lineNumbersMinChars: 3,
  padding: { top: 16, bottom: 16 },
  scrollBeyondLastLine: false,
  smoothScrolling: true,
  cursorBlinking: "smooth",
  cursorSmoothCaretAnimation: "on",
  roundedSelection: true,
  renderLineHighlight: "line",
  overviewRulerBorder: false,
  overviewRulerLanes: 0,
  hideCursorInOverviewRuler: true,
  bracketPairColorization: { enabled: true },
  guides: { indentation: true, bracketPairs: false },
  fixedOverflowWidgets: true,
  scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8, useShadows: false },
  semanticHighlighting: { enabled: true },
};

const PanelEditor = memo(({ handleEditorDidMount, handleEditorChange }) => {
  const editorRef = useRef();

  const _handleEditorDidMount = useCallback(
    (editor, monaco) => {
      editorRef.current = editor;
      remeasureWhenFontLoads(monaco);
      handleEditorDidMount(editor, monaco);
    },
    [handleEditorDidMount]
  );

  // react-resize-detector 12 pasa UN objeto { width, height, entry }. Esto recibía dos
  // argumentos sueltos, así que `width` era el objeto, la guarda nunca se cumplía y el editor
  // no se recolocaba nunca: funcionaba porque su contenedor tenía un alto fijo. Con la
  // terminal redimensionable, el editor tiene que seguir a su contenedor de verdad.
  const onResize = useCallback(({ width, height }) => {
    // Nunca dimensiones 0: pasa cuando el panel está oculto con la clase 'hidden'.
    if (editorRef.current && width > 0 && height > 0) {
      editorRef.current.layout({ height, width });
    }
  }, []);

  const { ref } = useResizeDetector({
    handleHeight: true,
    handleWidth: true,
    refreshMode: "debounce",
    refreshRate: 100,
    onResize,
  });

  // Sin argumentos, Monaco mide su contenedor. Con { width: "auto", height: "auto" } —lo que
  // había— no entiende el texto y se queda en 0 de alto.
  const windowResize = useCallback(() => {
    editorRef.current?.layout();
  }, []);

  useEffect(() => {
    window.addEventListener("resize", windowResize);

    return () => {
      window.removeEventListener("resize", windowResize);
    };
  }, [windowResize]);

  return (
    <div
      className="relative w-full h-full overflow-hidden bg-[#0d0d10]"
      ref={ref}
    >
      <Editor
        className="panel"
        // El simulador ejecuta Python y nada más. Antes esto caía a "cpp" cuando
        // el lenguaje no era python, una rama inalcanzable porque el entorno lo
        // fija a "python": solo servía para sugerir un soporte que no existe, y
        // obligaba a empaquetar un lenguaje que nunca se usa.
        language="python"
        theme={EDITOR_THEME}
        onChange={handleEditorChange}
        onMount={_handleEditorDidMount}
        options={EDITOR_OPTIONS}
        loading={<div className="h-full w-full bg-[#0d0d10]" />}
      />
    </div>
  );
});

export default PanelEditor;
