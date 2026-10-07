# Proposal — Registro de acciones del equipo

## Why

La directora quiere ver no solo a los alumnos sino también qué hacen profesores y
administradores. Hoy la plataforma registra **cuándo entra** cada cuenta (`login_events`),
pero no **qué hace**: si alguien borra una unidad, cambia el rol de un usuario o reescribe la
página pública, no queda rastro de quién fue ni cuándo. Con varias personas editando los
mismos cursos, eso hace imposible responder «¿quién cambió esto?».

Revisado en el código el 2026-10-05: hay unas 40 rutas que crean, modifican o borran algo y
que solo usa el equipo (cursos, módulos, unidades, contenidos, evaluaciones y sus preguntas,
especializaciones, la página pública, imágenes, roles, profesores asignados, respaldos). No
existe ninguna tabla de auditoría.

## What Changes

- **Cada acción del equipo queda registrada**: quién, con qué rol, qué hizo (crear, editar,
  borrar), sobre qué (con su nombre, también si después se borró), en qué curso y cuándo.
- Se registra en **un solo lugar** (un middleware), no en cada una de las 40 rutas: una ruta
  nueva queda cubierta con agregarla a una lista, y un test avisa si una ruta del equipo no
  está en ella.
- **Sección «Actividad del equipo»** en el panel de administración (solo administradores):
  la lista de acciones, filtrable por persona, rol, curso y fechas.
- Solo cubre **desde que se activa**: lo que pasó antes no se puede reconstruir.

## Capabilities

**New**
- `staff-activity` — registro y consulta de las acciones del equipo.

## Impact

- **Backend**: tabla nueva `staff_actions` (**migración**: al fusionar se aplica sola en
  producción; respaldo antes de fusionar), un middleware, una ruta de consulta.
- **Frontend**: pestaña nueva en el panel de administración.
- **Datos personales**: el registro identifica a miembros del equipo. Se conserva 12 meses y
  solo lo ven los administradores; entra en los respaldos como el resto de la base.
- **Rendimiento**: una o dos consultas más por cada acción del equipo (escrituras poco
  frecuentes); nada en las acciones de los alumnos.
