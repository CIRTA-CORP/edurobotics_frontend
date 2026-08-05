# interleaved-content — render del visor respeta el orden autoral

## 1. Render ordenado en ContentViewer

- [ ] 1.1 Construir una única lista `blocks` = `unit.contents` ordenada por `order_index`.
- [ ] 1.2 Extraer un dispatcher `UnitBlock({ block })` que despache por `content_type`
      (rich_text, text, video, image, file, resource, simulator).
- [ ] 1.3 Mover la tarjeta de simulador a un caso de `UnitBlock` (posición autoral).
- [ ] 1.4 Eliminar el hoisting de `rich_text` y la separación `legacy` / `simulator`.

## 2. Tabla de contenidos multi-bloque

- [ ] 2.1 Agregar los encabezados de todos los bloques `rich_text` en orden.
- [ ] 2.2 Ids de encabezado namespaced por bloque (`heading-<blockId>-<i>`) para evitar colisiones.
- [ ] 2.3 Conservar la regla de no mostrar ToC con < 2 encabezados.

## 3. Verificación

- [ ] 3.1 `PrintCoursePage` usa el mismo orden (`order_index`); cruzar y dejar consistente.
- [ ] 3.2 Caso común (un rich_text + quiz) se ve idéntico al actual.
- [ ] 3.3 `npm run build` verde.
