## Editor (RichTextEditor.jsx)

StarterKit ya trae `codeBlock` e inline `code`. Dos caminos:
- **Mínimo (sin dependencia):** dejar el `codeBlock` de StarterKit y agregar dos botones a la
  toolbar: "Bloque de código" (`editor.chain().focus().toggleCodeBlock().run()`) y "Código en línea"
  (`toggleCode()`). Estado activo con `editor.isActive('codeBlock')` / `isActive('code')`.
- **Con resaltado (recomendado):** reemplazar el `codeBlock` de StarterKit por
  `@tiptap/extension-code-block-lowlight` + `lowlight` (registrar unos pocos lenguajes: python, js,
  bash). Configurar `StarterKit.configure({ codeBlock: false })` y añadir la extensión lowlight para
  no duplicar el nodo.

Un botón para elegir lenguaje del bloque es opcional (v1 puede quedar en "texto plano" resaltado
genérico).

## Render del alumno (ContentViewer.jsx + sanitizeHtml.js)

El contenido rich se pinta con `dangerouslySetInnerHTML={sanitizeHtml(html)}`. Verificar que
`sanitizeHtml.js` (DOMPurify) permita `pre`, `code` y el atributo `class` (lowlight marca el
lenguaje con `class="language-xxx"`). DOMPurify por defecto ya permite `pre`/`code`; confirmar y, si
hiciera falta, añadirlos a la allowlist SIN permitir scripts ni handlers.

## Estilos (index.css → .rich-content)

```css
.rich-content pre { background:#0f172a; color:#e2e8f0; border-radius:8px; padding:12px 14px;
  overflow-x:auto; font-family:"SF Mono",Menlo,Consolas,monospace; font-size:13px; line-height:1.5; }
.rich-content pre code { background:none; padding:0; color:inherit; }
.rich-content :not(pre) > code { background:#f1f5f9; color:#0f172a; padding:1px 5px;
  border-radius:4px; font-family:"SF Mono",Menlo,Consolas,monospace; font-size:.9em; }
```
(Ajustar colores a la identidad si se prefiere claro; lo importante es que se lea como código.)

## Verificación

- `npm run build` verde.
- En el editor: escribir un bloque de código se ve monoespaciado con fondo (no cursiva); el
  código en línea también.
- En el visor del alumno: el mismo contenido se ve igual (código, no cursiva), sin romper la
  sanitización (probar que un `<script>` inyectado sigue bloqueado).
