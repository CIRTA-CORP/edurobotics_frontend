/**
 * La letra del código: Cascadia Code, la misma de codi.link, en el editor y en la terminal.
 *
 * Es una excepción pedida por Mario a la regla de no cambiar la tipografía, y se limita al
 * código: el resto de la página conserva la suya.
 *
 * Va empaquetada con la aplicación (@fontsource, licencia OFL-1.1), no se pide a un CDN:
 * la CSP solo permite fuentes propias (`font-src 'self'`). Solo se cargan los pesos que se
 * usan; cada hoja trae varios alfabetos con `unicode-range`, así que el navegador baja solo
 * el latino.
 */
import '@fontsource/cascadia-code/400.css'
import '@fontsource/cascadia-code/400-italic.css'
import '@fontsource/cascadia-code/600.css'

export const CODE_FONT_FAMILY = "'Cascadia Code', Menlo, Monaco, Consolas, 'Courier New', monospace"

/**
 * Monaco mide el ancho de los caracteres al crearse. Si la fuente todavía no había llegado,
 * mide la de reserva y luego el cursor y las selecciones quedan desalineados con el texto.
 * Esto espera a que la fuente esté y le pide que vuelva a medir.
 */
export function remeasureWhenFontLoads(monaco) {
  if (typeof document === 'undefined' || !document.fonts?.load) return
  Promise.all([
    document.fonts.load("400 14px 'Cascadia Code'"),
    document.fonts.load("italic 400 14px 'Cascadia Code'"),
  ])
    .then(() => monaco.editor.remeasureFonts())
    .catch(() => { /* sin la fuente se queda la de reserva, que ya está medida */ })
}
