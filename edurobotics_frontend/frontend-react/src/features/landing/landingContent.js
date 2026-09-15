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
      'Cursos interactivos de robótica con un simulador 3D integrado. Programa en Python y ve al robot ejecutar tus instrucciones al instante — sin instalar nada y sin costo.',
    imageUrl: '', // vacío = usar el mockup ilustrativo integrado
  },
  stats: {
    visible: true,
  },
  simulator: {
    visible: true,
    title: 'Un simulador de robótica, directo en el navegador',
    subtitle:
      'Practica con un robot industrial UR5e sin hardware ni instalaciones. Programa, ejecuta y aprende viendo el robot moverse.',
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
      { question: '¿Necesito saber programar?', answer: 'No. Los cursos empiezan desde cero y tu primer programa son tres líneas de Python. Escribes con la misma librería que se usa para mover el robot real.' },
      { question: '¿Qué robot voy a usar?', answer: 'Programas un brazo robótico industrial UR5e en un simulador 3D, sin necesitar hardware físico.' },
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
Estos términos se rigen por las leyes de Chile, y cualquier disputa se someterá a los tribunales ordinarios de justicia de Chile.

## 8. Contacto
Para consultas sobre estos términos, escríbenos a cirta.contacto@gmail.com.`,
    },
    privacidad: {
      title: 'Política de Privacidad',
      body: `En EduRobotics (operada por CIRTA CORP) respetamos tu privacidad. Esta política explica qué datos tratamos, para qué, y cómo puedes ejercer tus derechos conforme a la Ley 21.719 de Protección de Datos Personales.

Última actualización: 30 de agosto de 2026.

## 1. Responsable del tratamiento
CIRTA CORP (razón social por completar), RUT por completar, con domicilio en Chile (dirección por completar). Representante legal: por completar. Contacto: cirta.contacto@gmail.com.

## 2. Datos que tratamos
Datos de registro (nombre, apellido, nombre de usuario, correo). Datos de uso (matrículas, progreso en los cursos, tiempo activo, intentos y respuestas de evaluaciones, comentarios sobre los cursos). Datos de acceso (fecha y hora de tus inicios de sesión). Tu contraseña se guarda solo como un hash cifrado: nadie, ni siquiera nosotros, puede leerla.

## 3. Para qué los usamos y con qué base legal
Tratamos tus datos para crear y gestionar tu cuenta, mostrar tu progreso, permitir que tus docentes acompañen tu avance, mejorar la plataforma y enviarte correos relacionados con tu cuenta (como la recuperación de contraseña). La base de licitud es el consentimiento que otorgas al registrarte, que queda registrado con su fecha y la versión de los documentos aceptados.

## 4. Tus derechos (ARCO-P) y cómo ejercerlos
La ley te reconoce los derechos de acceso, rectificación, cancelación (supresión), oposición y portabilidad. En EduRobotics puedes ejercer varios por ti mismo, sin pedirnos permiso ni esperar respuesta:

Acceso y portabilidad: entra a tu perfil, sección «Privacidad y datos», y usa «Descargar mis datos». Obtendrás un archivo JSON con todo lo que guardamos de ti, en un formato estructurado y reutilizable.

Rectificación: puedes corregir tu nombre y apellido desde tu perfil, en «Datos personales».

Cancelación (supresión): en «Privacidad y datos» encontrarás «Eliminar mi cuenta». Borra tu cuenta y todos tus datos asociados de forma permanente e irreversible.

Oposición y cualquier otra solicitud: escríbenos a cirta.contacto@gmail.com. Responderemos dentro de los plazos que fija la ley.

## 5. Conservación
Conservamos tus datos mientras tu cuenta esté activa. Si eliminas tu cuenta, borramos tu perfil, matrículas, progreso, intentos de evaluación, comentarios y registros de acceso. Podemos conservar datos por más tiempo solo cuando una obligación legal lo exija, y únicamente para ese fin.

## 6. Datos de niños, niñas y adolescentes
EduRobotics se usa en contextos escolares, por lo que parte de nuestros usuarios son menores de edad. Cuando el estudiante es menor, el consentimiento debe otorgarlo su madre, padre o tutor legal, normalmente a través del establecimiento educacional que contrata la plataforma. Los datos de menores se tratan solo con fines educativos: nunca los usamos con fines comerciales ni publicitarios, ni construimos perfiles con ellos. Si detectas que se creó una cuenta de un menor sin la autorización correspondiente, escríbenos a cirta.contacto@gmail.com y la eliminaremos.

## 7. Con quién los compartimos y transferencias internacionales
No vendemos tus datos ni los cedemos a terceros con fines comerciales. Para operar la plataforma usamos proveedores de infraestructura que tratan los datos únicamente siguiendo nuestras instrucciones: alojamiento de la base de datos (Supabase, con servidores en Brasil), alojamiento de la aplicación (Railway y Vercel, con servidores en Estados Unidos), el simulador (Fly.io) y el envío de correos (Resend, en Estados Unidos).

Esto implica que tus datos se almacenan y procesan fuera de Chile. Elegimos proveedores que ofrecen garantías contractuales y medidas de seguridad adecuadas para estas transferencias. Los datos de tus docentes y del establecimiento se comparten dentro de la plataforma solo en lo necesario para el seguimiento pedagógico.

## 8. Seguridad
Aplicamos medidas razonables para proteger tus datos: contraseñas cifradas con hash, comunicación por HTTPS, accesos restringidos por rol y revisión periódica de vulnerabilidades en nuestras dependencias. Ningún sistema es infalible; si ocurriera una vulneración que afecte tus datos, te informaremos y notificaremos a la autoridad conforme a la ley.

## 9. Cambios en esta política
Si modificamos esta política, publicaremos la nueva versión en esta página con su fecha de actualización. Cuando los cambios sean sustanciales, te pediremos aceptar la nueva versión.`,
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
Si tienes dudas, escríbenos a cirta.contacto@gmail.com.`,
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
