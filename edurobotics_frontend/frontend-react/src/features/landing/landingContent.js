/**
 * Contenido por defecto de la landing.
 *
 * La directora puede sobrescribir estos textos, visibilidad de secciones e
 * imágenes desde el admin (pestaña "Landing"). Si nunca se editó algo, se usa
 * el valor de aquí, así la landing siempre se ve completa.
 */
export const LANDING_DEFAULTS = {
  hero: {
    visible: true,
    badge: 'Simulador de robótica en tu navegador',
    title: 'Aprende robótica programando robots de verdad',
    subtitle:
      'Cursos interactivos de robótica con un simulador 3D integrado. Programa con bloques o código y ve al robot ejecutar tus instrucciones al instante — sin instalar nada y sin costo.',
    imageUrl: '', // vacío = usar el mockup ilustrativo integrado
  },
  stats: {
    visible: true,
  },
  simulator: {
    visible: true,
    title: 'Un simulador de robótica, directo en el navegador',
    subtitle:
      'Practica con un robot industrial UR5 sin hardware ni instalaciones. Programa, ejecuta y aprende viendo el robot moverse.',
  },
  courses: {
    visible: true,
    title: 'Cursos para empezar hoy',
    subtitle: 'Desde fundamentos de robótica hasta manipulación con brazos robóticos.',
  },
  howItWorks: {
    visible: true,
    title: 'Aprender robótica en 3 pasos',
  },
  forWho: {
    visible: true,
  },
  finalCta: {
    visible: true,
    title: 'Empieza a programar robots hoy',
    subtitle: 'Crea tu cuenta gratis y entra al simulador en menos de un minuto.',
  },
}

/**
 * Combina los defaults con el contenido guardado (merge por sección).
 * El contenido guardado puede ser parcial; los campos faltantes caen al default.
 */
export function mergeLandingContent(stored = {}) {
  const merged = {}
  for (const key of Object.keys(LANDING_DEFAULTS)) {
    merged[key] = { ...LANDING_DEFAULTS[key], ...(stored?.[key] || {}) }
  }
  return merged
}
