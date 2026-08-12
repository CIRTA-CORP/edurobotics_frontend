# learning-analytics (#25) — métricas de seguimiento

## 1. Instrumentación (PRIMERO — desplegable por sí sola) ✅ ADELANTADA

- [x] 1.1 Migración aditiva `quiz_attempt_answers` (attempt_id, question_id, answer_id,
      is_correct, created_at) — `a7b8c9d0e1f3`, reversible. Aplicada a las dev DBs.
- [x] 1.2 El submit de quiz escribe intento + respuestas en UNA transacción (flush → add rows → commit).
- [x] 1.3 Test: submit registra la respuesta por pregunta con su `is_correct` (test_teacher.py).

## 2. Servicio de analítica (backend)

- [x] 2.1 Constante `INACTIVITY_DAYS = 14` + helper "sin actividad reciente" en
      `progress/activity.py` (adelantado con #26, que ya lo consume — una sola fuente).
- [x] 2.2 Progreso: tiempo activo total/promedio/mín/máx por curso/módulo/unidad; tasa de
      finalización (completados/inscritos); funnel por contenido ordenado + punto de mayor
      caída. (`app/features/analytics/service.py::get_progress_analytics`, reusa
      `progress/metrics.py`, `completion.py` y `enrollments`.)
- [x] 2.3 Interacción: días activos/semana, tiempo entre sesiones, avance por login
      (desde `LoginEvent` + `completed_at`; limitaciones documentadas en docstring).
- [x] 2.4 Rendimiento: promedio/distribución por quiz, intentos hasta aprobar, % de error
      por pregunta (solo desde la fecha de instrumentación; exponer esa fecha como
      `per_question_data_start` = min(created_at) de la tabla, no una fecha hardcodeada).
- [x] 2.5 Contenido: ranking por `active_seconds` y por abiertos-vs-completados.
- [x] 2.6 Endpoints `/api/analytics/*`: los de curso (`progress`/`performance`/`content`)
      usan `require_course_editor_from("course_id")` — **admin cualquier curso; profesor
      solo SUS cursos asignados** (habilitado tras aterrizar #26 v2, como estaba planeado).
      `interaction` (toda la plataforma) sigue `require_admin`. Flag `insufficient_data`
      cuando n < 3. **El router NO está registrado en `main.py` todavía — queda pendiente
      el hook de Claude (una línea `app.include_router(analytics_router)`).**

## 3. Frontend

- [x] 3.1 Sección "Seguimiento" en el panel admin (`AnalyticsTab`): progreso + funnel (barras
      por contenido con el punto de caída marcado), interacción, rendimiento por quiz,
      ranking de contenidos. Sin librería de charts (divs).
- [x] 3.2 Estados "datos insuficientes" y nota de fecha de inicio de recolección donde
      aplique. Tooltip explicando el umbral de 14 días.
- [x] 3.3 Recorte para el profesor (mismo componente, mismos endpoints): la pestaña
      "Analítica" se muestra en el panel compartido del profesor con su selector de cursos
      (solo los suyos, vía `require_course_editor_from`); la sección "Interacción" (datos
      de toda la plataforma) queda admin-only y se oculta al profesor.

## 4. Verificación

- [x] 4.1 Test de funnel con abandono plantado en datos sintéticos.
- [x] 4.2 Test de "sin actividad reciente" (tres señales, umbral, curso completado no
      cuenta como riesgo).
- [ ] 4.3 Revisar en logs de producción que ninguna query de analítica supere ~300 ms;
      si alguna lo hace, índice puntual. (Solo verificable con datos reales post-deploy.)
- [x] 4.4 `pytest` verde (64 passed, incluye los 7 tests de `tests/test_analytics.py`);
      `npm run build && npm run lint` verdes (sin issues nuevos).

## Diferido (anotado)
- Tracking real de reproducción de video (YouTube IFrame API).
- Sesionización por gaps de heartbeat; export CSV; cohortes/clases; predicción de riesgo.
