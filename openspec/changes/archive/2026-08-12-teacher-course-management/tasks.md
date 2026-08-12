# teacher-course-management (#26 v2) — profesor dueño de sus cursos

## 1. Backend: membresía y autorización

- [x] 1.1 Modelo `CourseTeacher` (`course_id`, `user_id`, único) + migración aditiva/reversible
      (`b8c9d0e1f2a3`).
- [x] 1.2 `course_id_of` + `require_course_editor_from` en `core/security.py`: admin siempre;
      teacher si está asignado al curso (resuelve `course_id` subiendo desde
      answer→question→quiz→unit/module→course). Base: `is_course_editor`/`ensure_course_editor`.
- [x] 1.3 Aplicado a las rutas de ESCRITURA de modules/units/contents/quizzes (antes
      `require_admin`): crear módulo, CRUD unidades/contenidos, CRUD quizzes/preguntas/
      respuestas, y `GET /api/admin/quizzes/{id}` (el profesor ve las respuestas correctas
      de SUS quizzes). Global (publicar/borrar/roles/especializaciones/landing/import/export)
      sigue admin.

## 2. Backend: endpoints de asignación y "mis cursos"

- [x] 2.1 Admin: asignar / quitar / listar docentes de un curso (`POST/DELETE/GET
      /api/admin/courses/{id}/teachers`) + `GET /api/admin/users/{id}/courses` (back de la UI).
- [x] 2.2 `GET /api/teacher/courses` (cursos del profesor); vista de progreso v1 filtrada a
      los alumnos de sus cursos (progreso/quiz intento/matrícula en sus cursos; contadores
      scoped; admin sin filtro). `GET /api/courses/{id}` muestra no-publicados al profesor
      asignado (antes 404).

## 3. Frontend: gestión acotada

- [x] 3.1 Vista teacher: reusa el panel admin (`/admin` ahora admite `teacher`; `/teacher`
      redirige al panel en la pestaña `progreso`). La lista de cursos del panel sale de
      `GET /api/teacher/courses` cuando el rol es teacher. La vista de progreso v1 se
      rediseñó como pestaña `StudentsTab` con el design system del panel (tarjetas de
      resumen + tabla + drawer), reemplazando la página plana anterior.
- [x] 3.2 Ocultar acciones globales para `teacher`: crear/importar/editar/borrar/publicar
      curso, PDF/backup, métricas/feedback del curso, pestañas Dashboard/Usuarios/Analítica/
      Especializaciones/Landing, badge y toggle de vista del header. Deep-link a un tab
      admin-only cae a 'cursos'.
- [x] 3.3 UI admin para asignar cursos a un profesor: botón "Cursos" en la fila de cada
      profesor (UsersTab) con drawer de checkboxes por curso.

## 4. Verificación

- [x] 4.1 Tests (`tests/test_teacher_courses.py`, 9 tests): profesor edita SU curso ✓; edita
      curso ajeno → 403; crear módulo propio ✓/ajeno → 403; publicar/borrar/rol → 403;
      alumno → 403; acceso a quiz scoped; alumnos del profesor scoped (lista + detalle 404);
      asignar/quitar admin (400 si no es profesor); curso no publicado visible solo para su
      profesor.
- [x] 4.2 `pytest` verde (73 passed); `npm run build` verde (sin issues de lint nuevos).

## Diferido a v3 (anotado)
- Profesor crea cursos desde cero; calificación manual; mensajería; secciones/paralelos.
