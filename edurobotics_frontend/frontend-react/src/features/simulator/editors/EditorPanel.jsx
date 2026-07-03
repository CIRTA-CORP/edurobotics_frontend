import React, { memo, useEffect, useCallback, useRef } from "react";
import Editor from "@monaco-editor/react";
import { useResizeDetector } from "react-resize-detector";

const PanelEditor = memo(({ language, handleEditorDidMount, handleEditorChange }) => {
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
        language={language === "python" ? language : "cpp"}
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
