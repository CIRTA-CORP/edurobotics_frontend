## Why

Issue #26: la directora quiere **profesores que puedan ver el estado de distintos
estudiantes**. Hoy solo hay dos roles (`admin`/`student`); un profe de colegio no tiene
forma de seguir el avance de sus alumnos sin ser admin (lo que le daría además poder de
editar cursos, borrar, cambiar roles — demasiado).

La buena noticia: **los datos ya existen** (progreso, `active_seconds`, `QuizAttempt`,
`enrollments`, `LoginEvent`). Falta el **rol** y una **vista de solo lectura** que los muestre.

## What Changes

Vertical acotado al piloto: un rol `teacher` con **acceso de solo lectura al progreso de los
alumnos**, sin poderes de admin.

### Backend
- Aceptar `teacher` como rol válido (la columna `role` ya es String → **sin migración**). El
  endpoint de cambio de rol admin pasa a permitir `{admin, teacher, student}`.
- Dependencia `require_teacher_or_admin` (como `require_admin` pero deja pasar a `teacher`).
  Los endpoints de **escritura/admin siguen SOLO admin** (`require_admin` intacto).
- Endpoints de lectura para profesores (o reutilizar los de métricas con el guard nuevo):
  lista de alumnos con su avance (cursos iniciados/completados, % de quizzes aprobados,
  última actividad) y drill-down por alumno o por curso. **Sin** datos sensibles (sin gestión
  de roles, sin hashes).

### Frontend
- Rol `teacher` en el ruteo: `DashboardPage` manda `teacher → /teacher`; nueva ruta
  `/teacher` con `ProtectedRoute requiredRole="teacher"` (admin sigue siendo superconjunto).
- **Vista de profesor** (solo lectura): tabla de alumnos con avance + detalle por alumno,
  reutilizando los componentes de métricas que ya existen, pero sin acciones de admin
  (nada de promover/editar/borrar).
- El admin puede **asignar el rol profesor** a un usuario desde la pestaña Usuarios (ya
  existe la gestión de roles; se añade la opción `teacher`).

### Alcance v1 (piloto) — explícito
- Un profesor ve el progreso de **todos** los alumnos (lectura). La directora pidió "ver el
  estado de distintos estudiantes", no "solo los míos" → grupos/clases (teacher↔alumnos) se
  **difieren** a una v2.
- Sin edición de contenido, sin mensajería, sin crear cursos por parte del profesor.
- La vista incluye un indicador simple de **"sin actividad reciente"** (última actividad
  > 14 días con curso sin completar), usando la MISMA definición que adoptará
  `learning-analytics` (#25) — una sola fuente de verdad, no dos umbrales distintos.

## Cómo lo resuelven las plataformas de referencia

Patrones verificables en la documentación pública de cada plataforma (no son citas
textuales, son los modelos de datos/roles documentados):

- **Google Classroom**: la unidad es la *clase*; el profesor solo ve alumnos de sus clases
  (se unen por código). Modelo pensado para multi-colegio/multi-profesor.
- **Khan Academy**: relación explícita *coach↔student* (el alumno acepta al coach o entra
  por código de clase); el coach ve un dashboard de progreso solo de sus vinculados.
- **Moodle**: roles por contexto; existe el rol **"non-editing teacher"** — profesor de
  solo lectura sin capacidad de editar el curso. Es el precedente directo de nuestro
  `teacher` v1.
- **Canvas**: rol **Observer** (típicamente apoderados) de solo lectura sobre alumnos
  vinculados; profesores acotados por *sections*.
- **Duolingo for Schools**: aulas con código de invitación; el profesor ve solo su aula.

**Lectura honesta para nuestro caso:** toda la maquinaria clase/código-de-invitación existe
porque esas plataformas son multi-tenant con millones de usuarios. En un piloto de UN
colegio con un puñado de profesores, esa maquinaria es sobreingeniería; el equivalente
funcional es el "non-editing teacher" de Moodle a nivel sitio: **rol de solo lectura que ve
a todos**. Cuando el piloto crezca a varios cursos/colegios, la v2 correcta es el patrón
Classroom/Duolingo (tabla `classes` + membresía + código de invitación), y este diseño no
lo bloquea: se añade un filtro de membresía sobre los mismos endpoints.

## Capabilities

### New Capabilities
- `teacher-accounts`: rol profesor con acceso de solo lectura al progreso de los alumnos.

## Impact

**Backend:** validación de rol (`auth`), `core/security.py` (+`require_teacher_or_admin`),
endpoints de lectura para profesor (nuevos o guard compartido con métricas admin). Sin
migración (rol es String).

**Frontend:** `App.jsx` (ruta `/teacher`), `DashboardPage` (ruteo por rol), nueva vista de
profesor (reusa métricas), `UsersTab` (opción de rol `teacher`).

## Riesgo

Bajo-medio. El punto crítico es **no filtrar poder de admin**: los guards de escritura siguen
`require_admin`; el profesor solo obtiene lectura vía `require_teacher_or_admin`. Se cubre con
tests (profesor NO puede editar/borrar/cambiar roles; profesor SÍ puede leer progreso;
alumno NO puede leer la vista de profesor).
