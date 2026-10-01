/**
 * Bloques «Código para el simulador» en la clase del alumno.
 *
 * El profesor marca un bloque de código en el editor (ver `simulatorCodeBlock.js` en el
 * admin) y queda guardado como `<pre data-simulator="true">`. Aquí se le añade el botón
 * «Probar en el simulador» y se lee su código cuando el alumno lo pulsa.
 *
 * La clase se pinta con `dangerouslySetInnerHTML`, así que el botón no puede ser un
 * componente de React: se inyecta en el HTML y el clic se recoge en el contenedor.
 */

// El atributo que identifica un botón inyectado por nosotros.
export const SIM_RUN_ATTR = 'data-sim-run'

const MARKED_BLOCK = 'pre[data-simulator="true"]'

/**
 * Añade el botón debajo de cada bloque marcado. Recibe HTML YA SANITIZADO.
 *
 * El orden importa: si el botón se inyectara antes de sanitizar, el sanitizador lo
 * procesaría. Y como DOMPurify deja pasar `<button>` y los atributos `data-*`, un
 * contenido podría traer su propio botón con `data-sim-run`. Por eso, antes de inyectar,
 * se borra ese atributo de todo el documento: los únicos botones que funcionan son los
 * que se ponen aquí.
 */
export function injectSimulatorButtons(html) {
  if (!html || !html.includes('data-simulator')) return html

  const doc = new DOMParser().parseFromString(html, 'text/html')
  doc.querySelectorAll(`[${SIM_RUN_ATTR}]`).forEach((el) => el.removeAttribute(SIM_RUN_ATTR))

  doc.querySelectorAll(MARKED_BLOCK).forEach((pre, index) => {
    const actions = doc.createElement('div')
    actions.className = 'sim-code-actions'
    const button = doc.createElement('button')
    button.type = 'button'
    button.className = 'sim-code-run'
    button.setAttribute(SIM_RUN_ATTR, String(index))
    button.textContent = 'Probar en el simulador'
    actions.appendChild(button)
    pre.after(actions)
  })

  return doc.body.innerHTML
}

/**
 * Lee el bloque que corresponde a un botón pulsado dentro de `container`.
 *
 * El código sale del bloque marcado que ocupa esa posición en el contenedor, no de nada
 * que lleve el propio botón. Devuelve `null` si el clic no fue en uno de nuestros botones.
 */
export function readSimulatorBlock(container, target) {
  const button = target?.closest?.(`[${SIM_RUN_ATTR}]`)
  if (!button || !container?.contains(button)) return null

  const index = Number(button.getAttribute(SIM_RUN_ATTR))
  const pre = container.querySelectorAll(MARKED_BLOCK)[index]
  if (!Number.isInteger(index) || !pre) return null

  // textContent, no innerHTML: el código llega como texto plano. El coloreado de la clase
  // va en elementos <span> que aquí no deben colarse.
  const code = (pre.querySelector('code') ?? pre).textContent
  return { code, index }
}
