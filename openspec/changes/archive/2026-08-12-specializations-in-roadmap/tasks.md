## 1. Avance por especialización ✅

- [x] 1.1 `RoadmapPage` calcula por especialización completados / total → %.
- [x] 1.2 Cada chip muestra el % (cuando hay sesión).
- [x] 1.3 Al seleccionar una especialización, encabezado "X de Y cursos · Z% completado".

## 2. Miniaturas de curso ✅

- [x] 2.1 `CourseNode`: fallback con gradiente de marca + icono cuando no hay imagen; scrim
      sobre la imagen real para que se vean parejas.

## 3. Multi-especialización ✅

- [x] 3.1 `buildCourseSpecMap` devuelve el conteo de especializaciones por curso.
- [x] 3.2 El nodo muestra "+N" cuando el curso está en más de una especialización.

## 4. Hover de prerrequisitos ✅

- [x] 4.1 `RoadmapGraph` mantiene `hoveredId`; `CourseNode` lo setea; `ArrowLayer` resalta
      (color + grosor) las flechas conectadas al nodo en hover.

## 5. Verificación

- [x] 5.1 Lint limpio + `npm run build` OK.
- [ ] 5.2 Revisión con capturas de Mario (avance por especialización, tarjetas parejas,
      "+N", hover).
