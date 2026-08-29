## Why

La vista de estudio (`CoursePage` + `ContentViewer` + `CourseSidebar`/`ModuleSidebar`) es donde
el alumno pasa **todo** su tiempo en la plataforma, y hoy es la parte con menos diseño: el índice
es una lista plana de módulos sin sentido de recorrido, la lección se lee como una pila de cajas
con bordes y radios distintos, y el pie tiene **tres controles compitiendo** (Anterior · botón
primario · Siguiente).

Existe un canvas de diseño ya trabajado y decidido —«Modo estudio EduRobotics» (artifact
`c82ae7d9-48bd-4fc8-a55f-18531fdc0f8c`)— con escritorio (1440), móvil (390), los bloques de
material, y **tres alternativas descartadas documentadas con sus pros y contras** (Lectura
inmersiva, Taller, Guía por pasos). Este change implementa la opción elegida: la A con la
navegación por módulos de la D.

Además hay un problema de datos que el rediseño obliga a decidir (ver `design.md`): el enlace
secundario «Siguiente» avanza **sin registrar avance** (`handleNextUnit`,
`ContentViewer.jsx:403`, solo llama `onUnitChange`). Un alumno puede recorrer el curso entero
por ahí y quedar en 0%, lo que ensucia la tasa de finalización, el funnel de #25 y el
«sin actividad reciente» del profesor.

## What Changes

### Estructura (escritorio 1440)
- **Barra superior** (56 px): volver · título del curso + badge de nivel + versión ·
  anillo de progreso con `hechas/total unidades` · avatar.
- **Barra de progreso de lectura** de 2 px bajo la barra superior, ligada al scroll.
- **Índice** (aside 320 px, fondo `#fafafa`) con botón de **modo foco** que lo oculta.
- **Columna de lectura** centrada, `max-width: 704px`.
- **Riel de secciones** a la derecha, construido desde los `h2` de la unidad.

### El índice pasa a ser una línea de módulos
El módulo actual se abre y muestra todas sus unidades con su barra de progreso; los módulos
terminados se cierran con el nodo en verde y check; los que vienen quedan atenuados. Cada
unidad muestra su duración estimada.

### Tipografía editorial
Serif (`Iowan Old Style`/`Palatino`/`Georgia`) para h1 (42 px) y h2 (25 px); cuerpo 17 px /
1.75; monoespaciada para migas, contadores y metadatos. Cita destacada con barra de acento.

### Bloques de material unificados
Video, PDF (con previsualización), archivo descargable, enlace externo, simulador y evaluación
comparten **borde, radio y densidad** — para que una unidad larga no parezca una colección de
cajas distintas. La evaluación tiene estados «Disponible» y «Bloqueada».

### Un solo botón primario que cambia de estado
`Marcar como leído` → `Siguiente unidad`; si es la última unidad pendiente del módulo,
`Completar módulo N` → `Empezar módulo N+1`; en la última unidad del curso, `Finalizar curso`.
Cuando la unidad está completada se muestra el indicador «Completado» junto a las migas.

### Automarcado donde ya hubo interacción demostrada
Aprobar el quiz de la unidad o ejecutar el simulador marca la unidad como leída sin pedir un
clic extra (hoy el alumno tiene que confirmar después de aprobar, lo que se siente burocrático).

### Móvil (390)
El mismo diseño; la línea de módulos vive en una hoja inferior que se abre desde la barra.

## Alcance v1 vs diferido — explícito

**v1**: todo lo anterior, escritorio y móvil.

**Diferido con nota** (decisiones ya tomadas en el canvas, no reabrir sin motivo):
- Partir el contenido de la unidad en pasos numerados (Opción D): obliga al profesor a
  estructurar el texto en pasos y castiga a las unidades de texto largo continuo.
- Pantalla partida con panel de material en pestañas (Opción C): baja la columna de lectura a
  560 px y deja media pantalla vacía en unidades de solo texto.
- Lectura inmersiva sin índice (Opción B): se pierde la noción de dónde estás en el curso.
- Modo oscuro y personalización de tipografía.

## Capabilities

### New Capabilities
- `study-mode`: la experiencia de estudio de una unidad — estructura, índice por módulos,
  bloques de material y la acción primaria que registra el avance.

### Modified Capabilities
- `progress`: se fija que el avance se registra por acción explícita del alumno o por
  interacción demostrada (quiz aprobado / simulador ejecutado), y que navegar **nunca**
  registra avance por sí solo.

## Impact

**Frontend** (no hay cambios de backend ni migraciones): `CoursePage.jsx` (shell y layout),
`ContentViewer.jsx` (lección, bloques, pie), `ModuleSidebar.jsx` y `CourseSidebar.jsx` (índice
por módulos), y estilos de la lección renderizada. Sin dependencias nuevas.

**Conflicto con trabajo local sin commitear:** hay cambios sin commitear del 13 de agosto en
`CourseSidebar.jsx`, `ModuleSidebar.jsx` y `CoursePage.jsx` — exactamente estos archivos.
**Tarea 0 del change: decidir si se conservan o se descartan antes de tocar nada.**

## Riesgo

Medio. Es un rediseño grande de la pantalla más usada, sin red de tests de UI (no hay tests de
frontend en el proyecto). Mitigaciones: (1) el diseño ya está resuelto y decidido, no se diseña
sobre la marcha; (2) se verifica con la app corriendo y capturas antes/después de los tres
estados clave; (3) no se toca backend, así que cualquier regresión es visual y reversible;
(4) el riel de secciones depende de parsear los `h2` del HTML de la lección — si el contenido
real no usa `h2`, el riel queda vacío: se resuelve ocultándolo cuando hay menos de dos
secciones (ver `design.md`).
