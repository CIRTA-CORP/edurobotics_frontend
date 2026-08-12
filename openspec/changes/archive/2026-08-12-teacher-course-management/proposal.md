## Why

Issue #26, v2 (replantea la v1). La v1 (`teacher-accounts`) dio un profesor **solo lectura** del
progreso — pero Luz lo encontró insuficiente: un profesor real, como en U-Cursos / Canvas / Moodle,
**dicta sus propios cursos**: organiza módulos y unidades, sube clases/contenido y sigue a los
alumnos de *sus* cursos. La v1 sirve de base (rol `teacher` + guard + vista de progreso); esta v2
le da **gestión de contenido acotada a los cursos que tiene asignados**.

## Cómo lo resuelven las plataformas de referencia

- **Canvas / Moodle (editing teacher):** el profesor está *inscrito como docente* en cursos
  específicos y puede editar SOLO el contenido de esos cursos; nunca el catálogo ajeno.
- **U-Cursos:** el profesor administra sus secciones/cursos (sube material, organiza), no toca los
  de otros.
- **Patrón común:** una **membresía curso↔profesor** y permisos **acotados por curso**. Ese es el
  corazón de esta v2 — no un profesor global, sino un profesor **dueño de lo suyo**.

## What Changes

### Backend
- Tabla **`course_teachers`** (`course_id`, `user_id`, único por par) — asignación curso↔profesor.
  **Migración aditiva y reversible.** (M2M: un curso puede tener varios docentes; un docente,
  varios cursos.)
- Guard por-recurso **`require_course_editor(course_id)`** = admin **o** profesor asignado a ese
  curso. Se aplica a los endpoints de **edición de contenido** (módulos, unidades, contenidos,
  quizzes) resolviendo el `course_id` del recurso. `require_admin` sigue para lo global (roles,
  publicar, borrar cursos, especializaciones, landing).
- El admin **asigna/quita** cursos a un profesor (`POST/DELETE /api/admin/courses/{id}/teachers`).
- El profesor lista **sus** cursos (`GET /api/teacher/courses`) y ve el progreso de los alumnos de
  esos cursos (reusa la v1, acotada a sus cursos).

### Frontend
- El profesor entra al **panel de gestión de cursos** (reusa el admin), pero **acotado a sus
  cursos asignados**: ve/edita solo los suyos; sin acceso a roles, publicar, ni cursos ajenos.
- El admin gana una UI para **asignar cursos a un profesor** (en la vista de usuarios o del curso).
- La vista de progreso de la v1 se integra aquí, filtrada a los alumnos de sus cursos.

### Alcance v1 (de esta v2) vs diferido
- **v1:** admin asigna cursos; el profesor **gestiona el contenido** (módulos/unidades/contenido/
  quizzes) de sus cursos y ve el progreso de sus alumnos.
- **Diferido:** que el profesor **cree cursos desde cero** (por ahora los crea el admin y asigna),
  calificación manual, mensajería, y "secciones/paralelos" dentro de un curso.

## Capabilities

### New Capabilities
- `teacher-course-management`: asignación curso↔profesor y edición de contenido acotada por curso.

### Modified Capabilities
- `teacher-accounts`: la vista de progreso pasa a filtrarse por los cursos del profesor.

## Impact

**Backend:** `course_teachers` (modelo + migración); `require_course_editor` en `core/security.py`;
endpoints de edición (`contents`, `modules`, `units`, `quizzes` routes) cambian su guard de
`require_admin` a `require_course_editor`; endpoints de asignación (admin) y `GET /api/teacher/courses`.

**Frontend:** el panel admin de cursos se abre a `teacher` acotado a sus cursos (filtro en la lista
+ ocultar acciones globales); UI de asignación para el admin.

## Riesgo

**Medio-alto — es el punto delicado del reparto.** El riesgo es de **autorización**: que un profesor
edite un curso que NO es suyo, o alcance acciones de admin. Mitigación: el guard por-curso resuelve
el `course_id` desde el recurso (unidad/contenido → su curso) y verifica la membresía; los endpoints
globales siguen `require_admin`; tests explícitos (profesor edita su curso ✓; profesor edita curso
ajeno → 403; profesor no publica/borra/cambia roles → 403; alumno nada). Migración aditiva/reversible.

> **Coordinación de paralelo:** este change es el ÚNICO que toca `core/security.py` y los guards de
> los routers de contenido. Los tracks B (bloque de código) y C (analítica, admin-only) NO tocan
> esos archivos.
