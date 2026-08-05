> **Estado: DIFERIDO (2026-08-05).** Al revisar los datos reales, el contenido se
> autoría como **un solo documento `rich_text`** por unidad (texto/imágenes/videos
> embebidos inline en el TipTap), no como bloques sueltos. El doc ya está ordenado por
> dentro, y los defaults actuales (quiz al final, simulador tras el texto) son correctos;
> además hoy no existe UI para reordenar el simulador. Por eso renderizar por `order_index`
> (opción A) arregla un problema que casi no se manifiesta. Si en el futuro se quieren
> simuladores/quizzes a mitad de lección, el camino correcto es **embeds inline como nodos
> del TipTap** (opción B), no parchar `order_index`. Se conserva este análisis para retomarlo.

## Why

El backend ya devuelve el contenido de una unidad ordenado por `order_index`
(content-model-v2, paso 3), pero el visor del alumno **no respeta ese orden**:

1. **Hoisting del `rich_text`.** `ContentViewer` separa el bloque `rich_text` y lo
   pinta siempre arriba, luego los bloques "legacy" debajo y el simulador al final.
   Si el admin armó `imagen → texto → video`, el alumno ve otra secuencia.
2. **El simulador siempre queda al fondo**, sin importar dónde lo puso el admin.
3. La consecuencia práctica: lo que la directora arma en el panel **no es lo que se
   ve**, que es justo la queja de #29 ("mostrar contenido").

Se corrige el **render**, no el modelo: los datos y su orden ya existen; solo el
frontend deja de reordenarlos.

## What Changes

- `ContentViewer` renderiza **todos** los bloques de contenido de la unidad en una
  sola pasada ordenada por `order_index` (rich_text, text, video, image, file,
  resource, simulator), en vez de hoistear `rich_text` y agrupar el resto.
- El `rich_text` se sigue tratando como documento unificado (ToC, sanitización,
  anclas de encabezados) pero **en su posición autoral**, no forzado arriba.
- El simulador se renderiza como un bloque más, en su posición.
- **La evaluación (quiz) se mantiene al final como compuerta de la unidad** (se
  desbloquea al completar el contenido). Intercalar quizzes a mitad de unidad queda
  fuera de alcance (cambio de UX mayor; anotado como futuro).
- `PrintCoursePage` ya ordena por `order_index`; se verifica que ambos caminos usen
  el mismo orden.

Sin cambios de backend, sin migraciones, sin nuevos endpoints.

## Capabilities

### Modified Capabilities
- `content`: el visor del alumno respeta el orden autoral de los bloques.

## Impact

**Frontend:**
- `features/courses/components/ContentViewer.jsx` (render ordenado en una pasada;
  se elimina el hoisting de `rich_text` y el bloque de simulador separado).
- Verificación cruzada con `features/courses/pages/PrintCoursePage.jsx` (mismo orden).

**Riesgo: bajo.** Solo cambia el orden de render en el visor del alumno; no toca datos
ni el panel admin. El caso común (una unidad con un solo `rich_text` + quiz) se ve
idéntico.
