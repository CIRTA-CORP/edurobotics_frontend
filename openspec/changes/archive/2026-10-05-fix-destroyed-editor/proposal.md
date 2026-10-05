# El editor de contenido deja de romperse al entrar a un curso

## Why

En producción, al entrar al taller y abrir un curso, la página se cae con
`Cannot read properties of null (reading 'cached')`. Al pulsar «Intentar de
nuevo» todo funciona.

No es el backend dormido. Mide ~1 s por petición, estable, sin picos de arranque
en frío. Es el editor:

1. Al montarse, React desmonta y vuelve a montar la instancia del editor.
   `useEditor` de Tiptap destruye la vieja con un `setTimeout` de 1 ms.
2. Al destruirse, el editor pone `schema = null`.
3. Durante esa ventana, el efecto que sincroniza el contenido recibe la instancia
   muerta. Solo comprueba que exista (`if (editor && …)`), no que siga viva, y
   llama a `editor.getHTML()`, que serializa con el esquema nulo.

**Reproducido de forma exacta:** un editor de Tiptap destruido lanza, carácter
por carácter, `Cannot read properties of null (reading 'cached')` al pedirle
`getHTML()`.

Al reintentar, los datos ya están en caché, la carrera no ocurre y por eso
parece un problema de carga. La lentitud del primer ingreso es lo que abre la
ventana. Por eso **un keep-alive no lo arregla**: solo la estrecharía, y un
Wi-Fi lento en el colegio la volvería a abrir.

Se descartó la causa que tuvo el mismo síntoma antes en este proyecto: las 33
piezas de Tiptap desplegadas están alineadas en 3.31.3 y no hay copias
duplicadas de ProseMirror.

## What Changes

Los dos caminos que llaman a `getHTML()` comprueban que el editor siga vivo
(`editor.isDestroyed`):

- **El efecto que sincroniza el contenido.** Es el que revienta hoy.
- **El guardado.** Si la instancia está muerta, se guarda el último HTML
  conocido (`liveHtml`, que ya se actualiza en cada edición) en vez de no hacer
  nada. Que no reviente no basta: tampoco puede perder el trabajo del profesor
  en silencio.

**La barra de herramientas no se toca, y se comprobó.** En cada render llama a
`editor.can()` y `editor.isActive()`, y parecía el mismo riesgo. No lo es: con
una instancia destruida, las seis llamadas que hace devuelven `false` en vez de
lanzar. Una protección ahí no arreglaría nada, y su comentario afirmaría algo
falso. Lo que revienta es serializar el documento, y eso solo ocurre en
`getHTML()`.

## Capabilities

**Modified**
- `content` — el editor tolera que lo vuelvan a montar.

## Impact

- `src/features/admin/features/content/RichTextEditor.jsx`

Solo frontend. Sale en su propia rama desde `main`, para no esperar a ningún
otro cambio.
