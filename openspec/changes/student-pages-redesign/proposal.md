## Why

Con el modo estudio ya rediseñado y los fundamentos unificados
(`design-system-foundations`), quedan las tres pantallas por las que el alumno pasa **antes y
después** de estudiar: el preview del curso, el dashboard y el perfil. Hoy siguen con el
lenguaje viejo (degradados de relleno, tres primarios, números en texto corrido), así que entrar
a una lección se siente como cambiar de aplicación.

El canvas `c82ae7d9-48bd-4fc8-a55f-18531fdc0f8c` incorporó los tres artboards
(`Preview`, `Dashboard`, `Perfil`) con el mismo lenguaje que el modo estudio.

## What Changes

### Preview del curso (`Preview.dc.html`)
- La banda oscura del `HeroBand` pasa a ser **el hero de verdad**: badges de nivel y versión,
  título grande en la sans de la app, las cifras (módulos · unidades · contenidos ·
  evaluaciones) en mono, tu
  progreso, y **una sola acción** en blanco sobre la banda.
- El programa usa **la misma línea de módulos del modo estudio**, con el tipo de material y los
  minutos de cada unidad: lo que ves antes de entrar es exactamente lo que verás dentro
  (reutiliza `ModuleSidebar`/`unitCompletion` de `study-mode-redesign` — no se escribe un
  segundo componente de índice). Los módulos se abren y cierran.
- Abajo, **la posición en la malla** con el curso actual marcado («Estás aquí»), los
  prerrequisitos y lo que desbloquea, con enlace a la malla completa.

### Dashboard del alumno (`Dashboard.dc.html`)
- Banda de bienvenida con el resumen real («Llevas 3 de 18 unidades en 2 cursos activos»).
- **Tarjeta «Continúa donde quedaste»**: curso, módulo y unidad exacta, con su botón.
- Tarjetas de curso: **conservan la foto con su degradado de legibilidad** y pierden los
  degradados de relleno; el botón aparece al pasar el cursor.
- El filtro «solo disponibles» se mantiene tal cual.

### Perfil del alumno (`Perfil.dc.html`)
- Mismas pestañas de shadcn (Resumen · Configuración) con el lenguaje nuevo: avatar sólido,
  nombre en grande (sans de la app), cifras en mono.
- Resumen: inscritos / completados / en progreso y **las mismas tarjetas de curso del
  dashboard**, agrupadas por estado.
- Configuración: los dos formularios reales (datos personales y cambio de contraseña) con sus
  estados de error dibujados.

## Desviaciones deliberadas del canvas

1. **Especializaciones con foto (decisión de Mario, 2026-08-29).** El artboard las dibuja como
   tarjeta de punto de color + contador + barra. **Se descarta:** se conserva la tarjeta actual
   con **imagen de portada** (`SpecializationsSection` ya soporta `image_url` con un respaldo
   oscuro punteado cuando no hay foto). Motivo: la foto es lo que hace reconocible una
   especialización de un vistazo, y ya está implementada y en uso. Lo que **sí** se adopta del
   canvas es el resto del lenguaje (radio, borde, contadores en mono, barra de avance).

2. **«Continúa donde quedaste» necesita un dato que hoy no viaja.** El propio autor del canvas
   lo marcó como añadido a confirmar. Es **feasible y barato**, pero no gratis: el endpoint
   `GET /api/progress/{user_id}/last-accessed` **ya existe** y el frontend **ya tiene su función
   de servicio**, sólo que devuelve `content_id`, `last_accessed` y `completed` — **sin** el
   curso, el módulo ni la unidad, que es justo lo que la tarjeta muestra. Hay que **enriquecer
   ese endpoint** (cambio aditivo, de solo lectura) con el contexto. Alternativa sin backend:
   derivar la siguiente unidad pendiente desde el roadmap que el dashboard ya pide — pero eso es
   «lo que sigue», no «donde quedaste». Se elige enriquecer el endpoint por ser lo que la
   tarjeta promete.

## Alcance v1 vs diferido

**v1**: las tres pantallas y el enriquecimiento del endpoint de última visita.

**Diferido con nota**: modo claro/oscuro (va en su propio change, después de
`design-system-foundations`); certificados; y cualquier gráfico nuevo de analítica en el perfil.

## Capabilities

### New Capabilities
- `student-pages`: preview del curso, dashboard y perfil del alumno con el lenguaje visual
  común.

### Modified Capabilities
- `progress`: la última visita expone además el contexto (curso, módulo, unidad) para poder
  ofrecer al alumno retomar donde quedó.

## Impact

**Backend:** enriquecer `get_last_accessed_content` y su ruta con el contexto de curso/módulo/
unidad. Aditivo, de solo lectura, **sin migración**.

**Frontend:** `CoursePreviewPage.jsx` (652 líneas — el archivo más grande de la app),
`StudentDashboardPage.jsx`, `CourseGrid.jsx`, `SpecializationsSection.jsx` (solo lenguaje, la
foto se queda), `UserProfilePage.jsx` y los formularios de configuración. Reutiliza
`ModuleSidebar` y `unitCompletion`.

**Depende de `design-system-foundations`:** si se hace antes, se pintan tres pantallas con
tokens que van a cambiar de todas formas.

## Riesgo

Medio. `CoursePreviewPage` es grande y concentra la lógica de prerrequisitos y matrícula: el
rediseño **no debe tocar esa lógica**, solo su presentación. Reutilizar el índice del modo
estudio en el preview obliga a que `ModuleSidebar` acepte un modo "solo lectura" (sin unidad
activa ni navegación) sin romper su uso actual. Verificación manual y por capturas: no hay tests
de UI en el proyecto.
