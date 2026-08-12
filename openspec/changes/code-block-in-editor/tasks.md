# code-block-in-editor — bloque de código en el editor de contenido

## 1. Editor

- [x] 1.1 Asegurar `codeBlock` + inline `code` activos en `RichTextEditor.jsx`.
- [x] 1.2 Botones en la toolbar: "Bloque de código" (`toggleCodeBlock`) y "Código en línea" (`toggleCode`),
      con estado activo (`isActive`).
- [x] 1.3 (Recomendado) resaltado con `@tiptap/extension-code-block-lowlight` + `lowlight`
      (python/js/bash); `StarterKit.configure({ codeBlock: false })` para no duplicar el nodo.

## 2. Render + sanitización

- [x] 2.1 Confirmar que `sanitizeHtml.js` permite `<pre>`/`<code>` + `class="language-*"` sin abrir XSS.
      Verificado ejecutando la configuración real de `sanitizeHtml` contra
      `<pre><code class="language-python">…` + `<script>` + `onclick` en node: pre/code/class se
      conservan, script y handlers se eliminan. Sin cambios en `sanitizeHtml.js` (DOMPurify ya lo permite).
- [x] 2.2 `ContentViewer.jsx`: verificar que el código se renderiza como código en la vista del alumno.
      El visor ya pasa el HTML por `sanitizeHtml` y lo pinta en `.rich-content`; los estilos nuevos
      de `pre`/`code` aplican. Sin cambios de lógica necesarios.

## 3. Estilos

- [x] 3.1 `index.css` (`.rich-content` y `.tiptap`): estilos de `<pre>` (fondo, mono, scroll) y `<code>` inline.

## 4. Verificación

- [x] 4.1 `npm run build` verde.
- [ ] 4.2 Editor y visor muestran el código como código (no cursiva); un `<script>` inyectado sigue bloqueado.
      La mitad de sanitización quedó probada por test (ver 2.1); falta la pasada visual de Mario
      (editor con un bloque python y la vista del alumno).
