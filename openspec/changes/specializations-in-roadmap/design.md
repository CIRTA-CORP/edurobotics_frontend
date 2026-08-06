## Context

`RoadmapPage` ya carga `specializations` (cada una con sus `courses`) y `roadmapData`
(estado por curso: completed / in_progress / not_started) del usuario. `RoadmapGraph`
dibuja los nodos por profundidad y colorea por especialización vía `specStyle`
(`buildCourseSpecMap`). El coloreo y los chips funcionan; falta el avance por
especialización y pulir las tarjetas.

## Goals / Non-Goals

**Goals:**
- Mostrar el % de avance de cada especialización en la malla (chip + encabezado al filtrar).
- Tarjetas más parejas (fallback de marca + scrim).
- Indicar cuando un curso está en varias especializaciones ("+N").
- Resaltar la cadena de prerrequisitos al pasar el mouse.

**Non-Goals:**
- No cambiar el layout de filas por profundidad ni pasar a React Flow (Mario lo prefiere así).
- No tocar backend (todo se computa con datos ya cargados).
- No rediseñar la leyenda ni el resaltado por filtro (ya están bien).

## Decisions

1. **Avance por especialización en el cliente.** Por cada spec: `completados` = cursos con
   `roadmapData[courseId].state === 'completed'`, sobre el total de cursos de la spec →
   `%`. Un visitante sin sesión ve 0%. Se muestra en el chip (barra/porcentaje) y, al
   seleccionar, en un encabezado.
2. **Fallback de miniatura alineado con las cards del dashboard.** Cuando no hay
   `image_url`, gradiente `from-slate-700 to-slate-900` + icono (igual que `CourseGrid`),
   en vez del box gris actual; y un scrim sutil sobre la imagen real.
3. **"+N" desde el conteo de especializaciones.** `buildCourseSpecMap` pasa a devolver
   también cuántas especializaciones tiene cada curso; el nodo muestra "+N" si > 1.
4. **Hover de prerrequisitos.** `RoadmapGraph` mantiene `hoveredId`; `CourseNode` lo setea
   en enter/leave; `ArrowLayer` resalta las flechas cuyo destino u origen es el nodo en
   hover (o su cadena directa).
