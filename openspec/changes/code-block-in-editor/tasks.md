# code-block-in-editor — bloque de código en el editor de contenido

## 1. Editor

- [ ] 1.1 Asegurar `codeBlock` + inline `code` activos en `RichTextEditor.jsx`.
- [ ] 1.2 Botones en la toolbar: "Bloque de código" (`toggleCodeBlock`) y "Código en línea" (`toggleCode`),
      con estado activo (`isActive`).
- [ ] 1.3 (Recomendado) resaltado con `@tiptap/extension-code-block-lowlight` + `lowlight`
      (python/js/bash); `StarterKit.configure({ codeBlock: false })` para no duplicar el nodo.

## 2. Render + sanitización

- [ ] 2.1 Confirmar que `sanitizeHtml.js` permite `<pre>`/`<code>` + `class="language-*"` sin abrir XSS.
- [ ] 2.2 `ContentViewer.jsx`: verificar que el código se renderiza como código en la vista del alumno.

## 3. Estilos

- [ ] 3.1 `index.css` (`.rich-content`): estilos de `<pre>` (fondo, mono, scroll) y `<code>` inline.

## 4. Verificación

- [ ] 4.1 `npm run build` verde.
- [ ] 4.2 Editor y visor muestran el código como código (no cursiva); un `<script>` inyectado sigue bloqueado.
