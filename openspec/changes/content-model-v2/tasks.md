# Cada paso es un PR independiente, en orden. No pasar al siguiente sin cerrar el anterior.

## Paso 1 — Servicio único de completitud (sin migración) ✅

- [x] 1.1 `app/features/progress/completion.py` con la regla única (`is_complete` /
      `state` / `percentage`, count-based) + `course_completion(db)` (agregado por todos
      los usuarios). Regla: completo ⇔ **todos los contenidos completos Y todos los
      quizzes aprobados**.
- [x] 1.2 Consumidores enrutados: `admin/routes.py` (`/courses/metrics` #35 y `/users`
      #36 ahora incluyen quizzes vía `course_completion`), y `progress/service.py`
      (roadmap usa `completion.state/percentage`, mismos números).
- [x] 1.3 Regresión (`test_completion.py`): con curso = 2 contenidos + 1 quiz, un alumno
      que salta el quiz NO cuenta como completado, y roadmap + métricas + users coinciden.
      **41 passed.**
- [x] 1.4 Notas del panel actualizadas (CoursesMetricsOverview, UsersTab): "completado =
      todo el contenido y los quizzes aprobados".

## Paso 2 — Metadatos y validación de contenido (migración aditiva) ✅

- [x] 2.1 `UnitContent`: `title` (String, null) + `duration_minutes` (Integer, null) +
      migración aditiva reversible `c3d4e5f6a7b8`.
- [x] 2.2 Schema Pydantic: `model_validator` valida `content_value` por `content_type`
      (URL http/https para video; no vacío para text/rich_text). Sin sanitizar en back.
- [x] 2.3 `title`/`duration_minutes` expuestos en `get_course_detail` y en el listado de
      contenidos; create/update los persisten. (UI → #29/F5.)
- [x] 2.4 Tests (`test_content_metadata.py`): metadatos persisten; video con URL inválida
      y texto vacío → 422; contenidos existentes con NULL no rompen el detalle. **45 passed.**

## Paso 3 — Quiz como bloque ordenable (migración aditiva + backfill)

- [ ] 3.1 `Quiz`: `order_index` (Integer, default 0) + migración aditiva.
- [ ] 3.2 Backfill en la migración: cada quiz toma `order_index = max(order de contenidos
      de su unidad) + 1` (preserva "al final"). Idempotente.
- [ ] 3.3 `get_course_detail`: por unidad, devolver `blocks: [{kind, order_index, ...}]`
      fusionando contenidos + quizzes y ordenando por `order_index`. Mantener `contents`
      y `quizzes` por compatibilidad.
- [ ] 3.4 Frontend (`ContentViewer`/`CoursePage`): renderizar `blocks` en orden (quiz
      intercalado). Permitir en el admin fijar la posición del quiz.
- [ ] 3.5 Tests: el orden intercalado se respeta; backfill contra la forma del dump prod
      no rompe; regresión de completitud sigue verde.

## Paso 4 — Inscripciones (migración aditiva + backfill)

- [ ] 4.1 Modelo `Enrollment(user_id, course_id, enrolled_at, unique(user_id, course_id))`
      + migración: crear tabla.
- [ ] 4.2 Backfill: por cada (user, course) en `user_progress`, insertar inscripción con
      `enrolled_at = min(started_at, last_accessed)`. Idempotente.
- [ ] 4.3 `POST /api/courses/{id}/enroll` (auth, idempotente); `CoursePage` lo llama al montar.
- [ ] 4.4 Métricas (#35/#36) distinguen inscrito / activo / completado.
- [ ] 4.5 Tests: enroll es idempotente; backfill correcto contra la forma del dump; métricas separan los tres estados.

## Verificación global

- [ ] V.1 `pytest tests/` verde tras cada paso.
- [ ] V.2 Cada migración: `upgrade` y `downgrade` corren limpios contra una copia del
      dump de producción (`backup_prod_2026-07-03.dump`).
- [ ] V.3 Lint + build del frontend.
