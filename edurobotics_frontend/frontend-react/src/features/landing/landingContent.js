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
    title: 'Aprende *robótica* programando robots de verdad',
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
  faq: {
    visible: true,
    title: 'Preguntas antes de unirte',
    subtitle: 'Lo esencial para decidir con tranquilidad si la plataforma encaja contigo.',
    items: [
      { question: '¿Necesito instalar algo?', answer: 'No. Todo corre en el navegador: los cursos y el simulador 3D. Solo necesitas conexión a internet.' },
      { question: '¿Tiene algún costo?', answer: 'No. EduRobotics es 100% gratis. Te registras y empiezas a aprender al instante.' },
      { question: '¿Necesito saber programar?', answer: 'No. Puedes empezar con bloques tipo Scratch y pasar a código real cuando te sientas listo.' },
      { question: '¿Qué robot voy a usar?', answer: 'Programas un brazo robótico industrial UR5 en un simulador 3D, sin necesitar hardware físico.' },
      { question: '¿Para quién es la plataforma?', answer: 'Para estudiantes, docentes y universidades que quieran aprender o enseñar robótica de forma práctica.' },
    ],
  },
  finalCta: {
    visible: true,
    title: 'Empieza a programar robots hoy',
    subtitle: 'Crea tu cuenta gratis y entra al simulador en menos de un minuto.',
  },
  // Páginas legales editables. En el cuerpo, una línea que empieza con "## "
  // se muestra como título de sección; los párrafos se separan con líneas en blanco.
  legal: {
    terminos: {
      title: 'Términos y Condiciones',
      body: `Estos Términos y Condiciones regulan el uso de la plataforma EduRobotics, operada por CIRTA CORP. Al crear una cuenta o usar la plataforma, aceptas estos términos.

## 1. Sobre la plataforma
EduRobotics es una plataforma educativa de robótica con cursos interactivos y un simulador 3D en el navegador. El acceso es gratuito.

## 2. Cuenta de usuario
Para acceder a ciertas funciones debes registrarte con datos verídicos. Eres responsable de mantener la confidencialidad de tu contraseña y de la actividad de tu cuenta.

## 3. Uso aceptable
Te comprometes a usar la plataforma de forma lícita, sin vulnerar derechos de terceros, sin intentar acceder a áreas restringidas y sin afectar el funcionamiento del servicio ni del simulador.

## 4. Propiedad intelectual
Los contenidos, cursos, marcas y software son propiedad de CIRTA CORP o de sus licenciantes. No puedes reproducirlos ni distribuirlos sin autorización.

## 5. Disponibilidad
Procuramos mantener el servicio disponible, pero puede haber interrupciones por mantenimiento o causas ajenas. El servicio se ofrece "tal cual".

## 6. Limitación de responsabilidad
En la medida que la ley lo permita, CIRTA CORP no será responsable por daños indirectos derivados del uso de la plataforma.

## 7. Ley aplicable
Estos términos se rigen por las leyes de [PAÍS / JURISDICCIÓN], y cualquier disputa se someterá a los tribunales de [CIUDAD].

## 8. Contacto
Para consultas sobre estos términos, escríbenos a [CORREO DE CONTACTO].`,
    },
    privacidad: {
      title: 'Política de Privacidad',
      body: `En EduRobotics (operada por CIRTA CORP) respetamos tu privacidad. Esta política explica qué datos recopilamos y cómo los usamos.

## 1. Responsable del tratamiento
CIRTA CORP, [RAZÓN SOCIAL], RUT [RUT], domicilio en [DIRECCIÓN], [CIUDAD], [PAÍS]. Contacto: [CORREO DE CONTACTO].

## 2. Datos que recopilamos
Datos de registro (nombre, usuario, correo), datos de uso (progreso, evaluaciones, inicios de sesión) y datos técnicos básicos necesarios para el funcionamiento.

## 3. Para qué los usamos
Para crear y gestionar tu cuenta, mostrar tu progreso, mejorar la plataforma y enviar correos relacionados con tu cuenta (como recuperación de contraseña).

## 4. Con quién los compartimos
No vendemos tus datos. Usamos proveedores que nos ayudan a operar (alojamiento, envío de correos), que solo los tratan según nuestras instrucciones.

## 5. Conservación
Conservamos tus datos mientras tu cuenta esté activa o según lo requiera la ley. Puedes solicitar la eliminación de tu cuenta.

## 6. Tus derechos
Puedes acceder, rectificar o eliminar tus datos escribiendo a [CORREO DE CONTACTO].

## 7. Seguridad
Aplicamos medidas razonables para proteger tus datos (contraseñas cifradas, accesos restringidos). Ningún sistema es 100% infalible.`,
    },
    cookies: {
      title: 'Política de Cookies',
      body: `Esta política explica cómo EduRobotics usa cookies y tecnologías similares.

## 1. Qué son las cookies
Son pequeños archivos que se guardan en tu dispositivo para que el sitio funcione y recuerde tus preferencias.

## 2. Cookies que usamos
Usamos almacenamiento técnico esencial para mantener tu sesión iniciada (tu token de acceso) y preferencias de la interfaz. Sin estos, la plataforma no funciona correctamente.

## 3. Cookies de terceros
Actualmente no usamos cookies de publicidad ni de seguimiento de terceros. Si esto cambia, lo informaremos aquí.

## 4. Cómo gestionarlas
Puedes borrar o bloquear el almacenamiento desde tu navegador. Deshabilitar el almacenamiento esencial puede impedir iniciar sesión.

## 5. Contacto
Si tienes dudas, escríbenos a [CORREO DE CONTACTO].`,
    },
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
