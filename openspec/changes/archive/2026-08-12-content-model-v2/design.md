## Context

Modelos actuales (verificados):
- `UnitContent(unit_id, content_type, content_value, order_index, created_at)` — tiene
  `order_index` pero **no** `title` ni `duration_minutes`.
- `Quiz(unit_id?, module_id?, title, passing_type, passing_score, created_at)` — **no**
  tiene `order_index`; se renderiza aparte de los contenidos (siempre al final).
- **No** hay tabla de inscripciones; "iniciado" se infiere de `user_progress`.
- La completitud está duplicada y **diverge**:
  - `progress/service.py::get_progress_roadmap` cuenta **contenidos + quizzes**
    (unit total = nº contenidos + nº quizzes; completado = contenidos completos +
    quizzes aprobados).
  - `admin/routes.py` (`/courses/metrics` de #35, `/users` de #36) cuenta **solo
    contenidos** (completado ⇔ contenidos completados == total de contenidos).

## Goals / Non-Goals

**Goals:**
- Una sola definición de "completado", consumida por roadmap, métricas y perfil.
- Quizzes intercalables en el flujo de la unidad.
- Concepto de inscripción (inscrito / activo / completado).
- Metadatos de contenido + validación por tipo.
- Cada migración aditiva, reversible y con backfill probado; cada paso desplegable solo.

**Non-Goals:**
- No aplanar ni pasar a documento-por-unidad (opción A ya decidida).
- No reescribir la lógica de intentos/aprobación de quizzes.
- No agregar nuevos `content_type`.
- No duplicar la sanitización de HTML en el backend (sigue en el frontend).
- No obligar a la UI de metadatos ahora (título/duración) — puede ir en #29 / F5.

## Decisions

1. **Definición única de "completado" = todos los contenidos completos Y todos los
   quizzes aprobados**, en el scope. Vive SOLO en `progress/completion.py`. Las métricas
   admin la adoptan → **corrección intencional**: un alumno que hizo los contenidos pero
   no el quiz deja de contar como "completado" (hoy contaba). Puede bajar levemente el
   número de "completados" en el dashboard; es el número correcto, el mismo que ve el
   alumno. Se documenta en el propio panel.

2. **Quiz gana `order_index` (NO `content_type="quiz"`).** Convertir quizzes en filas de
   `UnitContent` fracturaría intentos/aprobación/preguntas y exigiría migrar datos de
   quiz. Agregar `order_index` mantiene el quiz como entidad de primera clase y habilita
   una lista `blocks` unificada (contenidos + quizzes) ordenada. Backfill al final de la
   unidad preserva el orden actual.

3. **`blocks` en la API.** `get_course_detail` devuelve, por unidad,
   `blocks: [{ kind: "content" | "quiz", order_index, ... }]` fusionados y ordenados por
   `order_index`. Se mantienen `contents` y `quizzes` en la respuesta durante la
   transición (backward compat) y el frontend migra a `blocks`; en un paso posterior se
   pueden retirar.

4. **Inscripción perezosa e idempotente.** `POST /api/courses/{id}/enroll` (auth) hace
   upsert de `enrollments` por (user, course); lo llama `CoursePage` al montar. Backfill:
   por cada (user, course) presente en `user_progress`, insertar inscripción con
   `enrolled_at` = min(`started_at`, `last_accessed`) de ese par. Estados derivados:
   **inscrito** = tiene fila en `enrollments`; **activo** = tiene progreso; **completado**
   = servicio de completitud.

5. **Metadatos aditivos y nullable + validación por tipo.** `title` (String, null),
   `duration_minutes` (Integer, null). En el schema Pydantic de crear/editar contenido:
   `video` → URL válida; `text`/`rich_text` → no vacío tras strip; `simulator` → según su
   payload. La sanitización de HTML queda en el frontend.

6. **Secuenciación y seguridad de migraciones.** Se implementa en 4 pasos ordenados; cada
   uno con su propia migración **aditiva y reversible**, desplegable por separado
   (recomiendo un PR por paso, en orden):
   1. Servicio de completitud (sin migración) — de-riska todo lo demás.
   2. Metadatos de contenido (add columns).
   3. `order_index` de quiz (add column + backfill al final de unidad) + `blocks`.
   4. `enrollments` (create table + backfill) + endpoint + métricas.
   Los backfills son **idempotentes** y se prueban contra la forma del dump de producción
   `backup_prod_2026-07-03.dump`. **Regresión:** con un dataset sembrado, los tres
   consumidores de completitud devuelven números idénticos bajo la definición unificada
   (snapshot antes/después).

## Alternativas descartadas

- **Quiz como `UnitContent(content_type="quiz", quiz_id)`**: más invasivo, migra datos de
  quiz y complica la relación con intentos/preguntas. Descartado (ver decisión 2).
- **Inscripción automática en cada request de progreso**: agrega un join por llamada;
  el endpoint explícito al abrir el curso es más barato y claro. 
- **Recalcular métricas con la definición vieja (solo contenidos)**: mantendría la
  divergencia con el roadmap. Descartado (decisión 1).
