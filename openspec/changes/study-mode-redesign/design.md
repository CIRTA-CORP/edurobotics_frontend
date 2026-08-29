# study-mode-redesign — decisiones de diseño

Fuente: canvas «Modo estudio EduRobotics» (artifact `c82ae7d9-48bd-4fc8-a55f-18531fdc0f8c`),
artboards `Main` (1440×900), `Movil` (390×844) y `Bloques`. Las tres opciones descartadas
quedaron documentadas ahí con sus pros y contras; no se reabren en este change.

## Decisión 1 — El avance se registra por intención, no por navegación

**El problema real.** Hoy el pie tiene tres controles y el «Siguiente» de la derecha
(`handleNextUnit`) solo navega: no escribe `completed_at`. Ese clic es la **única** señal que
alimenta la tasa de finalización, el funnel de abandono (#25), las métricas de tiempo y el
«sin actividad reciente» del profesor. Un alumno que lee todo y avanza por la derecha queda
registrado en 0% y, además, se topa con cursos bloqueados por prerrequisitos que **sí**
cumplió. Le penalizamos por usar un control que nosotros pusimos.

**Corrección honesta:** el canvas **no** resuelve esto por sí solo — conserva los enlaces
secundarios `goPrev`/`goNext`, y `goNext` navega sin marcar (`pick(next.id)` solo hace
`patch({unit: id})`). La decisión hay que tomarla aquí.

**Decisión:**
- Se conserva **«Anterior»** (retroceder nunca necesita registrar nada).
- Se **elimina el «Siguiente» secundario**. El avance hacia adelante pasa siempre por el botón
  primario, que registra. Saltar a cualquier unidad sigue disponible **desde el índice**, que
  está siempre a un clic (y en móvil, en la hoja inferior).
- No se fusionan «marcar» y «avanzar» en un solo clic: si «Siguiente unidad» marcara
  implícitamente, «completado» pasaría a significar «pasó por aquí» en vez de «leí y confirmé»,
  y se degrada el significado de la métrica principal justo antes del piloto. El doble paso
  además da la recompensa de ver la unidad ponerse en verde.
- **No** se autocompleta por scroll ni por tiempo de permanencia: infla la finalización y es
  poco fiable con video y simulador.

**Excepción — interacción demostrada.** Aprobar el quiz de la unidad o ejecutar el simulador
marca la unidad automáticamente. Ahí la intención ya quedó demostrada con algo más caro que un
clic, y pedir confirmación después se siente burocrático.

## Decisión 2 — Estados del botón primario

Una sola pieza, cuatro estados, evaluados en este orden:

| Condición | Etiqueta |
|---|---|
| Unidad no completada y es la única pendiente del módulo | `Completar módulo N` |
| Unidad no completada | `Marcar como leído` |
| Completada y la siguiente unidad es de otro módulo | `Empezar módulo N+1` |
| Completada y hay siguiente unidad | `Siguiente unidad` |
| Completada y es la última del curso | `Finalizar curso` |

`Finalizar curso` mantiene el comportamiento actual: abre el modal de feedback del curso.

## Decisión 3 — El índice es una línea de módulos, no una lista

Estado por módulo: **actual** (abierto, con sus unidades y barra de progreso), **terminado**
(cerrado, nodo verde con check) y **por venir** (atenuado). La línea vertical conecta los nodos.
Cada unidad muestra su duración estimada. Esto es lo que se tomó de la Opción D descartada: la
navegación por módulos, sin partir el contenido de la unidad en pasos.

El botón de **modo foco** oculta el índice; el estado es local a la sesión de lectura (no se
persiste en backend en v1).

## Decisión 4 — Riel de secciones desde el HTML de la lección

El contenido de la lección es HTML de Tiptap guardado en `content_value` y renderizado con
`sanitizeHtml` + `dangerouslySetInnerHTML`. El riel se construye **después del render**,
recorriendo los `h2` del nodo montado y asignándoles `id` para el scroll.

Reglas: si la unidad tiene **menos de dos** `h2`, el riel no se muestra (una lección corta no
necesita índice interno). El riel resalta la sección activa según el scroll. No se toca el
pipeline de sanitización: se leen nodos ya renderizados, no se reescribe el HTML de origen.

## Decisión 5 — Bloques de material con la misma gramática

Todos los bloques (video, PDF, descarga, enlace externo, simulador, evaluación) comparten borde
`#e9e9ee`, radio 12–14 px y la misma densidad interna, con el icono en un cuadro tintado del
color de su tipo. El objetivo declarado en el canvas: *que una unidad larga no parezca una
colección de cajas distintas*.

El simulador es el único bloque con fondo oscuro — es el que más pesa visualmente y se quiere
que resalte; deja de estar escondido al final de la unidad.

## Decisión 6 — Móvil es el mismo diseño, no una versión recortada

390 px: misma jerarquía tipográfica y mismos bloques; el índice vive en una hoja inferior que se
abre desde la barra. El botón primario ocupa el ancho disponible en la barra inferior.

## Accesibilidad (no negociable, ya es capability del proyecto)

El proyecto ya tiene la capability `accessibility` de la F6: el rediseño **no** puede regresarla.
El botón primario y los ítems del índice son botones reales con foco visible; el índice se
recorre con teclado; los cambios de estado del botón se anuncian (`aria-live` discreto al marcar
completado); el contraste de los módulos atenuados se mantiene en AA (el mismo criterio que se
aplicó a las tarjetas atenuadas del roadmap).

## Verificación

No hay tests de UI en el proyecto, así que la verificación es manual y explícita:
- `npm run build` y `npm run lint` verdes (lint no debe **empeorar** respecto de la línea base).
- Capturas antes/después de: unidad de solo texto, unidad con video + PDF + simulador, y unidad
  con evaluación (estados disponible y bloqueada), en escritorio y en 390 px.
- Recorrido de teclado completo en la vista de estudio.
- Prueba de regresión de datos: completar una unidad desde la UI y confirmar que
  `completed_at`/`active_seconds` se registran igual que antes (los heartbeats no se tocan).
