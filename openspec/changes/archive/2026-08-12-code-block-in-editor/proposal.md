## Why

Luz (directora) está armando cursos y, al escribir **código** en el editor de contenido de una
unidad, TipTap lo deja como texto normal / cursiva — no hay bloque de código. El editor usa
`@tiptap/starter-kit` (`RichTextEditor.jsx`), que **ya incluye** `codeBlock` e inline `code`, pero
faltan el **botón en la toolbar** y el **estilo de render**, así que en la práctica no se puede
poner código con formato.

## What Changes

- **Editor** (`RichTextEditor.jsx`): asegurar `codeBlock` + inline `code` activos y agregar botones
  a la toolbar (bloque de código y código en línea). Recomendado: resaltado de sintaxis con
  `@tiptap/extension-code-block-lowlight` + `lowlight` (si se agrega dependencia, dejarlo mínimo).
- **Render del alumno** (`ContentViewer.jsx`): verificar que el HTML `<pre><code>` se renderice bien;
  confirmar que `sanitizeHtml.js` permite `<pre>`/`<code>` (sin abrir XSS — no permitir scripts).
- **Estilos** (`index.css`, bloque `.rich-content`): `<pre>` con fondo, monoespaciada, scroll
  horizontal; `<code>` inline con fondo sutil — consistente con el resto del contenido.

## Capabilities

### Modified Capabilities
- `content`: el editor de contenido soporta bloques de código y código en línea, y el visor los
  renderiza como código (no como cursiva).

## Impact

**Frontend solo:** `features/admin/features/content/RichTextEditor.jsx`,
`features/courses/components/ContentViewer.jsx`, `src/index.css` y (si se agrega resaltado)
`package.json`. Sin backend.

## Riesgo

Bajo. El único cuidado es **no abrir XSS** al permitir `<pre>/<code>` en la sanitización: permitir
solo esas etiquetas y sus atributos de clase de lenguaje, nunca `<script>`/handlers.

> **Coordinación de paralelo:** este change NO toca `security.py`, `courses/`, `teacher/`,
> `features/analytics/`, `UsersTab.jsx`, `App.jsx` ni `main.py`.
