/**
 * Colores y opciones comunes de los gráficos del panel (change `admin-analytics-v2`).
 *
 * Los colores son los del panel: tinta #16151b, acento #4b46d6, bordes #e9e9ee. La letra no
 * se fija: `font-family: inherit` toma la de la interfaz (Plot trae `system-ui` por defecto).
 */

export const INK = '#16151b'
export const INK_SOFT = '#55545f'
export const MUTED = '#8b8a95'
export const GRID = '#f2f1f6'
export const ACCENT = '#4b46d6'
export const BAR = '#7d79e3'
export const BAR_SOFT = '#c9c7f2'

// Rampa secuencial de un solo tono (claro → oscuro = puntaje bajo → alto). Pasos vecinos
// distinguibles también con daltonismo (ΔE OKLab ≥ 13,8); los dos claros
// tienen poco contraste con el blanco, así que la tabla de números siempre acompaña.
export const SCORE_RAMP = ['#c9c7f2', '#9894e8', '#625cdc', '#332ea6']

/** Opciones base de `Plot.plot` para un ancho dado. */
export function baseOptions(width) {
  return {
    width,
    style: {
      fontFamily: 'inherit',
      fontSize: '11px',
      color: MUTED,
      background: 'transparent',
      overflow: 'visible',
    },
  }
}

/** Corta un texto largo con «…» para las etiquetas del eje. */
export function truncate(text, max) {
  const s = String(text ?? '')
  return s.length > max ? `${s.slice(0, Math.max(1, max - 1)).trimEnd()}…` : s
}

/** Cuántos caracteres caben en la etiqueta del eje según el ancho del gráfico. */
export function labelChars(width) {
  if (width < 420) return 16
  if (width < 640) return 24
  return 34
}

/** Margen izquierdo para etiquetas de hasta `chars` caracteres (≈6,2 px cada uno a 11 px). */
export function labelMargin(width, chars) {
  return Math.min(Math.round(chars * 6.2) + 12, Math.round(width * 0.45))
}

export const fmtPct = (v) => (v == null ? '—' : `${Math.round(v)}%`)

// Umbrales de los gráficos. Los de alumnos (menos de 3 = «datos insuficientes») los decide
// el backend por sección; estos son de forma: con menos puntos no hay figura que mirar.
export const MIN_FUNNEL_STEPS = 3 // dos barras no son un embudo
export const MIN_STUDENTS = 3 // por evaluación: alumnos que la rindieron
