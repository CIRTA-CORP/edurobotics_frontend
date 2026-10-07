/**
 * Agrupa la serie diaria de ingresos en semanas de 7 días que terminan hoy.
 *
 * No son semanas de calendario: así ninguna barra queda a medias (la de esta semana, con
 * dos días, parecería una caída). Las fechas `AAAA-MM-DD` se leen como fechas LOCALES:
 * `new Date("2026-10-05")` sería medianoche UTC, que en Chile es el día anterior.
 */

export const parseLocalDate = (ymd) => {
  const [y, m, d] = String(ymd).split('-').map(Number)
  return new Date(y, m - 1, d)
}

const fmtDay = (date) => date.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' }).replace('.', '')

/**
 * series: [{date: 'AAAA-MM-DD', count}] ordenada y sin huecos (el backend rellena con ceros),
 * terminando hoy. Devuelve [{key, start, end, label, range, count}] de la más antigua a la
 * más reciente; si la serie no alcanza para una semana entera al principio, esa semana se
 * descarta en vez de mostrarse incompleta.
 */
export function weeklyBuckets(series) {
  const weeks = []
  for (let end = series.length; end - 7 >= 0; end -= 7) {
    const days = series.slice(end - 7, end)
    const start = parseLocalDate(days[0].date)
    const last = parseLocalDate(days[6].date)
    weeks.unshift({
      key: days[0].date,
      start,
      end: last,
      label: fmtDay(start),
      range: `${fmtDay(start)} – ${fmtDay(last)}`,
      count: days.reduce((acc, d) => acc + (d.count || 0), 0),
    })
  }
  return weeks
}
