## Why

Crear contenido en el panel admin son hoy **cuatro pestañas encadenadas** (Módulos →
Unidades → Contenido → Evaluaciones): eliges el módulo con un botón «Gestionar» en el centro
de la pantalla y eso te habilita una pestaña en el lateral. Son **dos sitios distintos para
una sola cosa**, y obliga a recordar en qué nivel estás porque la pantalla no lo dice.

El canvas `c82ae7d9-48bd-4fc8-a55f-18531fdc0f8c` incorporó seis artboards de panel admin y,
sobre todo, un **mapa de cobertura**: las 72 funciones del panel actual, una por una, con dónde
están hoy y dónde quedan. **24 cambian de lugar; ninguna desaparece.** Este change implementa
ese rediseño usando el mapa como contrato.

## What Changes

### 1. Taller del curso (`Admin.dc.html`) — el cambio de fondo
Las cuatro pestañas encadenadas se reemplazan por un **árbol de módulos y unidades** con los
mismos nodos numerados que ve el alumno. **Seleccionar ES navegar**: al hacer clic en una
unidad, el panel derecho muestra sus pestañas **Contenido · Evaluación · Ajustes**. Desaparece
el botón «Gestionar»; la barra de migas se reduce a una línea de contexto porque el árbol ya
dice dónde estás.

### 2. Detalle del curso (`AdminCurso.dc.html`)
Lo que hoy vive en un panel deslizante queda **a la vista**: título, descripción, portada,
nivel, publicado, y los prerequisitos con sus casillas en columna derecha. «Crear curso» e
«Importar respaldo» **suben al árbol**, que es donde está la lista. «Eliminar curso» baja a una
tarjeta **«Zona sensible»** que recuerda descargar el respaldo antes.

### 3. Usuarios y progreso (`AdminDatos.dc.html`)
La tabla gana **buscador y filtro por rol** — con la lista plana ya no se navega. Cambiar rol
sigue en la fila, el panel de cursos asignados al profesor se sigue abriendo por la derecha, y
la regla «no puedes cambiar tu propio rol ni dejar cero admins» se **dice bajo la tabla** en vez
de solo fallar al intentarlo. Progreso de alumnos queda debajo, en el mismo rail.

### 4. Analítica (`AdminAnalitica.dc.html`)
Hoy los números están **repartidos entre Dashboard, la pestaña Cursos y Analítica**. Se juntan y
se ordenan por pregunta: cuánta gente entra, cuánto tiempo dedican, qué contenidos se abandonan,
qué preguntas se fallan y quién lleva semanas sin aparecer. **Un solo tono para magnitud**;
verde y ámbar solo como estado y siempre con etiqueta.

### 5. Sitio (`AdminSitio.dc.html`)
La landing pasa a ser una **lista de bloques en el orden en que salen en la página**, cada uno
con su interruptor y su contenido al desplegarlo. Especializaciones va debajo, en el mismo rail.

### 6. Armazón — **ya hecho** (commit `c13b969`)
Barra del panel con segmentado admin/estudiante y accesos como iconos silenciosos; rail de 236 px
a altura completa con filete, etiquetas en mono y activo en negro de marca.

## Alcance v1 vs diferido

**v1**: las 72 funciones del mapa de cobertura, todas. El rediseño **no quita ninguna**: lo que
cambia es dónde se acciona.

**Diferido con nota**: modo claro/oscuro (change aparte); vista móvil del panel admin (el canvas
solo cubre escritorio, y el panel se usa en computador); y cualquier métrica nueva que no exista
ya en el backend — esto es rediseño, no funcionalidad nueva.

## Capabilities

### New Capabilities
- `admin-panel`: la estructura del panel de administración — árbol de contenido, editor por
  pestañas, y las pantallas de datos, analítica y sitio.

## Impact

**Frontend únicamente.** Sin backend, sin migraciones, sin dependencias nuevas: todos los
endpoints y toda la lógica CRUD ya existen y se reutilizan tal cual.

**Superficie:** `features/admin/` son 30 archivos y ~5.800 líneas. Se reescribe la composición
(`AdminDashboardPage`, `AdminSidebarNav`, las pestañas) pero **no** los formularios ni el editor
TipTap, que se mueven de sitio sin cambiar por dentro.

**Depende de `design-system-foundations`** (ya aplicado): tokens, botón y tarjeta.

## Riesgo

**Alto — es la superficie más densa de la app y la que usa la directora a diario.** Mitigaciones:

1. **El mapa de cobertura es el contrato.** Antes de codear, Mario lo revisa y confirma que no
   falta nada que use. Cada tarea de abajo apunta a funciones del mapa.
2. **Se implementa por rebanadas desplegables**, no todo de una vez. Cada rebanada deja el panel
   funcionando.
3. **No hay tests de UI en el proyecto**: la verificación es manual, con la app a la vista y
   capturas antes/después de cada rebanada.
4. El riesgo concreto de la rebanada 1 es perder una acción al mover cuatro pestañas a un árbol
   (p. ej. «abrir el quiz de la unidad», hoy un icono en la fila). Por eso la tarea 1 termina con
   un repaso función por función contra el mapa.
