# teacher-accounts (#26) — rol profesor con lectura del progreso

## 1. Backend: rol y autorización

- [x] 1.1 `update_user_role` acepta `{admin, teacher, student}` (+ fix: la salvaguarda de
      "último admin" ahora cubre CUALQUIER democión de admin, no solo admin→student).
- [x] 1.2 `require_teacher_or_admin` en `core/security.py` (incluye chequeo de `token_version`).
- [x] 1.3 Sin migración (rol es String) — confirmado.

## 2. Backend: endpoints de lectura para profesor

- [x] 2.1 `GET /api/teacher/students` — por alumno: nombre, iniciados/completados,
      % quizzes aprobados, última actividad, flag `inactive` (reusa `course_completion`).
- [x] 2.2 `GET /api/teacher/students/{id}` — drill-down de progreso por curso (reusa roadmap).
- [x] 2.3 Recorte de campos (sin hash/email, sin rol editable). Guard `require_teacher_or_admin`
      a nivel de router. Constante compartida `INACTIVITY_DAYS` en `progress/activity.py`.

## 3. Frontend: ruteo y vista

- [x] 3.1 `DashboardPage`: `teacher → /teacher` (evita el loop de `/student`).
- [x] 3.2 Ruta `/teacher` con `ProtectedRoute requiredRole="teacher"` (lazy).
- [x] 3.3 `TeacherDashboardPage` (solo lectura): tabla de alumnos + drill-down en Drawer.
      SIN acciones de admin.
- [x] 3.4 `UsersTab` (admin): selector de rol con opción `teacher` + badge de profesor.

## 4. Verificación

- [x] 4.1 Tests: guard permite teacher/admin y rechaza student (403); lista de alumnos con
      progreso y sin datos sensibles; drill-down; #25 registra respuestas por pregunta.
- [x] 4.2 `pytest` verde (28 passed local; resto = issue TestClient); `npm run build` verde.

## Diferido a v2 (anotado)
- Grupos/clases (teacher↔alumnos "solo los míos").
- Profesor crea contenido/evaluaciones; mensajería.
