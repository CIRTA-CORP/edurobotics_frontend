## Modelo: membresía curso↔profesor

```python
class CourseTeacher(Base):
    __tablename__ = "course_teachers"
    id = Column(Integer, primary_key=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    user_id   = Column(Integer, ForeignKey("users.id",   ondelete="CASCADE"), nullable=False)
    UniqueConstraint(course_id, user_id, name="uq_course_teacher")
```
M2M explícito (no `Course.owner_id`) para permitir co-docencia y asignar/quitar sin tocar el curso.
Migración aditiva; sin backfill (nace vacía; el admin asigna).

## Autorización por-recurso

`require_admin` protege lo GLOBAL (crear/publicar/borrar curso, roles, especializaciones, landing).
Para EDITAR contenido se introduce:

```python
def require_course_editor(course_id_getter):
    # admin pasa siempre; teacher pasa si está en course_teachers(course_id); resto 403.
```
Como los endpoints de contenido reciben `unit_id`/`content_id`/`module_id` (no `course_id`), el
guard resuelve el curso subiendo por la jerarquía (contenido→unidad→módulo→curso) y consulta la
membresía. Se aplica en las rutas de **modules / units / contents / quizzes** que hoy son
`require_admin` de ESCRITURA. Las de LECTURA pública no cambian.

## Endpoints

- Admin: `POST /api/admin/courses/{id}/teachers` (asignar), `DELETE /api/admin/courses/{id}/teachers/{user_id}` (quitar), `GET` (listar docentes del curso).
- Profesor: `GET /api/teacher/courses` (mis cursos), y la vista de progreso v1 filtrada a alumnos de mis cursos.

## Frontend: reusar el panel admin, acotado

El profesor NO tiene un panel nuevo desde cero: **reusa el panel de gestión de cursos del admin**,
pero:
- La lista de cursos muestra SOLO `GET /api/teacher/courses` (los suyos).
- Se ocultan las acciones globales (publicar, borrar curso, crear curso, pestaña Usuarios,
  Especializaciones, Landing) para rol `teacher`.
- Puede: crear/editar módulos, unidades, contenido y evaluaciones **de sus cursos**; y ver el
  progreso de sus alumnos.
- Ruteo: `teacher → /teacher` (ya existe de la v1); la vista teacher decide entre "mis cursos"
  (gestión) y "progreso" (lectura).

## Qué se conserva de la v1

Rol `teacher`, `require_teacher_or_admin` (para lectura), la vista de progreso y el selector de rol
en Usuarios. Esta v2 **suma** la asignación de cursos y la edición acotada; no rehace lo anterior.

## Riesgos y verificación

- **Fuga de edición cruzada** → el guard resuelve el curso desde el recurso y verifica membresía;
  test: profesor edita unidad de curso ajeno → 403.
- **Escalada a admin** → los endpoints globales siguen `require_admin`; test: profesor intenta
  publicar/borrar curso/cambiar rol → 403.
- **Alumno** → sin acceso a nada de esto.
- `pytest` verde (incl. los nuevos), `npm run build` verde.
