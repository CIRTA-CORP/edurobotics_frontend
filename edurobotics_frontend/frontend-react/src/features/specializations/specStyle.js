/**
 * Deterministic colour styling for specializations, shared by the course cards
 * and the roadmap graph so a specialization looks the same everywhere.
 *
 * Colours are assigned by the specialization's position in the (order_index
 * sorted) list, so they stay stable across renders. Class strings are written
 * out in full so Tailwind's purge keeps them.
 */

const PALETTE = [
  { name: 'indigo', badge: 'bg-indigo-100 text-indigo-700', dot: 'bg-indigo-500', bar: 'bg-indigo-500', text: 'text-indigo-600' },
  { name: 'emerald', badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500', bar: 'bg-emerald-500', text: 'text-emerald-600' },
  { name: 'amber', badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500', bar: 'bg-amber-500', text: 'text-amber-600' },
  { name: 'rose', badge: 'bg-rose-100 text-rose-700', dot: 'bg-rose-500', bar: 'bg-rose-500', text: 'text-rose-600' },
  { name: 'sky', badge: 'bg-sky-100 text-sky-700', dot: 'bg-sky-500', bar: 'bg-sky-500', text: 'text-sky-600' },
  { name: 'violet', badge: 'bg-violet-100 text-violet-700', dot: 'bg-violet-500', bar: 'bg-violet-500', text: 'text-violet-600' },
  { name: 'teal', badge: 'bg-teal-100 text-teal-700', dot: 'bg-teal-500', bar: 'bg-teal-500', text: 'text-teal-600' },
  { name: 'orange', badge: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500', bar: 'bg-orange-500', text: 'text-orange-600' },
]

/** Colour set for the specialization at the given list position. */
export function specColor(index) {
  return PALETTE[index % PALETTE.length]
}

/**
 * Build a map courseId → { id, title, color } from the specialization list.
 * When a course belongs to several specializations, the first one (by list
 * order) wins for its badge / colour.
 */
export function buildCourseSpecMap(specializations = []) {
  const map = {}
  specializations.forEach((spec, i) => {
    const color = specColor(i)
    ;(spec.courses || []).forEach((c) => {
      if (map[c.id]) return
      map[c.id] = { id: spec.id, title: spec.title, color }
    })
  })
  return map
}
