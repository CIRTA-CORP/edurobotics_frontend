## Rol sin migración

`User.role` ya es `String`. Añadir `teacher` es solo ampliar la **validación**:
- `set_user_role` (admin) pasa a aceptar `{"admin", "teacher", "student"}` (hoy `{admin,
  student}`).
- La salvaguarda "no dejar el sistema sin admins" se mantiene (contar solo `role=='admin'`).

## Autorización: superconjunto por capas

```
require_admin              → solo admin (escritura, gestión) — INTACTO
require_teacher_or_admin   → teacher o admin (lectura de progreso) — NUEVO
```

`require_teacher_or_admin` replica `require_admin` (incluye el chequeo de `token_version`
para invalidar tokens de un rol revocado) pero acepta `role in {"teacher","admin"}`. Los
endpoints de escritura NO cambian de guard → un profesor jamás edita/borra/cambia roles.

## Qué ve el profesor (reutilizar, no reinventar)

Los datos ya se calculan para el admin:
- `course_completion` (progress/completion.py) → iniciados/completados.
- métricas de tiempo (F5), `QuizAttempt` (aprobación), `LoginEvent` (última actividad).

Se exponen con el guard de profesor, en un shape de **solo lectura** y sin PII de más:
- `GET /api/teacher/students` → por alumno: nombre, cursos iniciados/completados, % quizzes
  aprobados, última actividad. (Sin email/hash si no hace falta; sin rol editable.)
- `GET /api/teacher/students/{id}` → drill-down: progreso por curso/módulo/unidad.

Si conviene, estos endpoints comparten servicio con los de admin (`admin/routes.py`) y solo
cambian el guard + el recorte de campos.

## Ruteo frontend (evitar el loop)

Hoy `DashboardPage` hace `role==='admin' ? '/admin' : '/student'`. Un `teacher` caería en
`/student` → `ProtectedRoute requiredRole="student"` → rebote → loop. Fix:
- `DashboardPage`: `admin→/admin`, `teacher→/teacher`, `student→/student`.
- Nueva ruta `/teacher` (`ProtectedRoute requiredRole="teacher"`; admin superconjunto ya
  entra por el cambio de F-rutas anterior).
- La vista de profesor es de solo lectura: NADA de botones de promover/editar/borrar.

## Vista de profesor (v1)

Reusa `CoursesMetricsOverview` / tabla de usuarios con avance, pero:
- Sin columna/acción de cambiar rol.
- Enfocada en "¿quién va bien / quién está estancado?": última actividad + % de avance.
- Indicador **"sin actividad reciente"** usando la constante compartida `INACTIVITY_DAYS`
  que define `learning-analytics` (#25) — si #26 se implementa antes que #25, la constante
  nace aquí y #25 la consume (una sola definición, viva en `progress/`).
- Filtro por curso (opcional v1).

## Qué NO se hace en v1 (difere a v2)
- Grupos/clases (teacher↔alumnos): el profe ve a todos, no "solo los suyos".
- Que el profesor cree contenido o evaluaciones.
- Mensajería/notificaciones profesor↔alumno.

## Verificación
- Tests: profesor **puede** leer progreso; profesor **no puede** editar/borrar/cambiar roles
  (403 en endpoints admin); alumno **no puede** entrar a la vista/endpoints de profesor.
- `pytest` verde, `npm run build` verde.
