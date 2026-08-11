# learning-analytics (#25) — métricas de seguimiento

## 1. Instrumentación (PRIMERO — desplegable por sí sola) ✅ ADELANTADA

- [x] 1.1 Migración aditiva `quiz_attempt_answers` (attempt_id, question_id, answer_id,
      is_correct, created_at) — `a7b8c9d0e1f3`, reversible. Aplicada a las dev DBs.
- [x] 1.2 El submit de quiz escribe intento + respuestas en UNA transacción (flush → add rows → commit).
- [x] 1.3 Test: submit registra la respuesta por pregunta con su `is_correct` (test_teacher.py).

## 2. Servicio de analítica (backend)

- [x] 2.1 Constante `INACTIVITY_DAYS = 14` + helper "sin actividad reciente" en
      `progress/activity.py` (adelantado con #26, que ya lo consume — una sola fuente).
- [ ] 2.2 Progreso: tiempo activo total/promedio/mín/máx por curso/módulo/unidad; tasa de
      finalización (completados/inscritos); funnel por contenido ordenado + punto de mayor
      caída.
- [ ] 2.3 Interacción: días activos/semana, tiempo entre sesiones, avance por login
      (desde `LoginEvent` + `completed_at`; limitaciones documentadas en docstring).
- [ ] 2.4 Rendimiento: promedio/distribución por quiz, intentos hasta aprobar, % de error
      por pregunta (solo desde la fecha de instrumentación; exponer esa fecha).
- [ ] 2.5 Contenido: ranking por `active_seconds` y por abiertos-vs-completados.
- [ ] 2.6 Endpoints `/api/analytics/*` con `require_teacher_or_admin`; flag
      `insufficient_data` cuando n < 3.

## 3. Frontend

- [ ] 3.1 Sección "Seguimiento" en el panel admin: progreso + funnel (visual simple de
      barras por contenido), interacción, rendimiento por quiz, ranking de contenidos.
- [ ] 3.2 Estados "datos insuficientes" y nota de fecha de inicio de recolección donde
      aplique. Tooltip explicando el umbral de 14 días.
- [ ] 3.3 Recorte de la misma sección en la vista profesor (#26) — mismo componente,
      mismos endpoints.

## 4. Verificación

- [ ] 4.1 Test de funnel con abandono plantado en datos sintéticos.
- [ ] 4.2 Test de "sin actividad reciente" (tres señales, umbral, curso completado no
      cuenta como riesgo).
- [ ] 4.3 Revisar en logs de producción que ninguna query de analítica supere ~300 ms;
      si alguna lo hace, índice puntual.
- [ ] 4.4 `pytest` verde; `npm run build && npm run lint` verdes.

## Diferido (anotado)
- Tracking real de reproducción de video (YouTube IFrame API).
- Sesionización por gaps de heartbeat; export CSV; cohortes/clases; predicción de riesgo.
