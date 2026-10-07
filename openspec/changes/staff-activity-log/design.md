# Design — Registro de acciones del equipo

## Context

- Las rutas que modifican algo están repartidas en 12 módulos (`admin`, `courses`,
  `modules`, `units`, `contents`, `quizzes`, `specializations`, `landing`, `uploads`,
  `backups`, `robotics`, `auth`). Las de los alumnos (inscribirse, avanzar, rendir,
  opinar, su perfil) conviven con las del equipo en los mismos módulos.
- `core/security.py` ya sabe resolver a qué curso pertenece cualquier recurso
  (`course_id_of`), y quién es quien llama (el JWT trae `user_id` y `role`).
- En Railway las migraciones se aplican al arrancar: fusionar este change crea la tabla en
  producción.

## Goals

- Responder «¿quién hizo esto y cuándo?» para cualquier cambio del equipo.
- Que una ruta nueva del equipo no pueda quedar sin registrar sin que un test lo diga.
- No tocar el camino de los alumnos.

## Non-Goals

- **Registrar lo de los alumnos.** Su actividad ya se mide (avance, intentos, ingresos).
- **Guardar el antes y el después de cada cambio** (versiones). Se registra qué se tocó, no
  su contenido: cuesta mucho más y no es lo que se pidió.
- **Registrar lecturas**, salvo la descarga de un respaldo, que expone datos de todos.
- **Reconstruir el pasado.** No hay de dónde.
- **Alertas o notificaciones.** Solo la consulta.

## Decisions

### 1. Un middleware y una lista de rutas del equipo

`app/core/staff_activity.py` define la lista de rutas a registrar, cada una con su verbo
(«creó», «editó», «borró», «reordenó», «asignó», «cambió el rol de», «descargó») y el tipo
de recurso. El middleware, para las peticiones de esas rutas hechas con un JWT de
`admin` o `teacher`:

1. **Antes** de la ruta, resuelve el recurso: su nombre y su curso. Así, al borrar algo, el
   registro conserva cómo se llamaba.
2. Ejecuta la ruta.
3. **Si respondió 2xx**, guarda la acción. Un intento rechazado (403, 422) no es una acción.

Un test recorre todas las rutas de la aplicación y falla si una que exige rol de equipo y
modifica algo no está en la lista ni en la de excluidas a propósito.

### 2. Qué se guarda

Tabla `staff_actions`: `user_id` (si la cuenta se borra queda en blanco, no se pierde la
acción), nombre y rol **al momento** de la acción, verbo, tipo de recurso, id y nombre del
recurso, `course_id` y nombre del curso, método y ruta, código de respuesta, fecha (UTC).
Sin el cuerpo de la petición: podría traer contraseñas o contenido largo.

### 3. Qué no se registra

Ingresos (ya están en `login_events`), latidos y avance (`/api/progress/*`), rendir una
evaluación, inscribirse, opinar, el propio perfil y la contraseña. Aunque los haga alguien del
equipo al revisar un curso como alumno, son actividad de alumno.

### 4. Quién lo ve

Solo administradores, en «Actividad del equipo». Lista paginada, más reciente primero, con
filtros por persona, rol, curso y rango de fechas. Cada fila en lenguaje natural:
«María Pérez (profesora) editó la unidad «Sensores» del curso «Robótica 1» · hace 2 h».

### 5. Conservación: 12 meses

Las acciones de más de 12 meses se borran solas (al consultar, en el mismo endpoint, como
mucho una vez al día). Identifican a personas del equipo: se guardan mientras sirven para
lo que se pidieron.
