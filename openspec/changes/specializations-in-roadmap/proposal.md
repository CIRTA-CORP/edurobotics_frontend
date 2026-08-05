## Why

La directora pidió ver las especializaciones EN la malla, incluido el **avance de cada
especialización**. Hoy la malla ya colorea los cursos por especialización y filtra por
chips (bien), pero: (a) no muestra el % de avance de la especialización, (b) las
miniaturas de los cursos se ven recortadas/pobres, y (c) un curso que está en varias
especializaciones solo muestra una. (F4 del ROADMAP.)

## What Changes

1. **Avance por especialización:** cada chip muestra el % completado; al seleccionar una,
   un encabezado con "X de Y cursos · Z%". Se calcula en el cliente con el progreso que ya
   se carga (sin backend).
2. **Miniaturas:** fallback de marca (gradiente + icono) cuando no hay imagen y un scrim
   suave sobre la imagen, para que las tarjetas se vean parejas.
3. **"+N"** cuando un curso pertenece a más de una especialización.
4. **Resaltar prerrequisitos al hover:** al pasar el mouse por un curso, se destacan las
   flechas de su cadena de prerrequisitos.

## Capabilities

### Modified Capabilities
- `roadmap`: la malla muestra el avance por especialización y pule las tarjetas.

## Impact

- Frontend: `RoadmapPage.jsx`, `RoadmapGraph.jsx`, `specStyle.js`. **Sin backend** — los
  datos (especializaciones con sus cursos + estado de progreso) ya están en el cliente.
- Sin migraciones. Trabajo visual: se itera con capturas de Mario.
