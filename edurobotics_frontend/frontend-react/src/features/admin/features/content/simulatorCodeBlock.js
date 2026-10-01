import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'

// Bloque de código con una marca más: `simulator`. Un bloque marcado es el código que el
// alumno abre en el simulador con «Probar en el simulador» (ver ContentViewer).
//
// Es un atributo del mismo bloque, no un nodo nuevo, a propósito. Marcar y desmarcar es
// cambiar un atributo, sin reescribir el contenido. Todo lo que ya sabe pintar un bloque de
// código —la impresión, la vista previa, el coloreado— sigue funcionando igual. Y un
// contenido marcado, leído por una versión anterior de la app, se ve como un bloque normal.
//
// Se guarda como `data-simulator="true"` en el <pre>, que DOMPurify deja pasar (se
// comprobó con la configuración de `sanitizeHtml`).
export const CodeBlockWithSimulator = CodeBlockLowlight.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      simulator: {
        default: false,
        parseHTML: (element) => element.getAttribute('data-simulator') === 'true',
        renderHTML: (attributes) => (attributes.simulator ? { 'data-simulator': 'true' } : {}),
      },
    }
  },
})

// Tres casos: ya es de simulador → vuelve a bloque normal, con el mismo contenido; es un
// bloque normal → se marca; no es un bloque → se crea marcado. Siempre como Python, que es
// lo único que ejecuta el simulador, para que el coloreado sea el correcto.
export function toggleSimulatorBlock(editor) {
  const chain = editor.chain().focus()
  if (editor.isActive('codeBlock', { simulator: true })) {
    chain.updateAttributes('codeBlock', { simulator: false }).run()
  } else if (editor.isActive('codeBlock')) {
    chain.updateAttributes('codeBlock', { simulator: true, language: 'python' }).run()
  } else {
    chain.setCodeBlock({ language: 'python', simulator: true }).run()
  }
}
