# teacher-course-management (#26 v2) — profesor dueño de sus cursos

## 1. Backend: membresía y autorización

- [ ] 1.1 Modelo `CourseTeacher` (`course_id`, `user_id`, único) + migración aditiva/reversible.
- [ ] 1.2 `require_course_editor` en `core/security.py`: admin siempre; teacher si está asignado al
      curso (resuelve `course_id` desde unit/content/module/quiz).
- [ ] 1.3 Aplicar `require_course_editor` a las rutas de ESCRITURA de modules/units/contents/quizzes
      (hoy `require_admin`). Global (publicar/borrar/roles/especializaciones/landing) sigue admin.

## 2. Backend: endpoints de asignación y "mis cursos"

- [ ] 2.1 Admin: asignar / quitar / listar docentes de un curso.
- [ ] 2.2 `GET /api/teacher/courses` (cursos del profesor); filtrar la vista de progreso v1 a sus alumnos.

## 3. Frontend: gestión acotada

- [ ] 3.1 Vista teacher: reusa el panel de cursos del admin pero listando solo `GET /api/teacher/courses`.
- [ ] 3.2 Ocultar acciones globales para `teacher` (crear/publicar/borrar curso, Usuarios,
      Especializaciones, Landing).
- [ ] 3.3 UI admin para asignar cursos a un profesor.

## 4. Verificación

- [ ] 4.1 Tests: profesor edita SU curso ✓; edita curso ajeno → 403; publicar/borrar/rol → 403;
      alumno sin acceso.
- [ ] 4.2 `pytest` verde; `npm run build` verde.

## Diferido a v3 (anotado)
- Profesor crea cursos desde cero; calificación manual; mensajería; secciones/paralelos.
