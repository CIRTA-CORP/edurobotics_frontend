# active-time-metrics (F5) — tiempo activo real + rediseño de la tarjeta

## 1. Backend: modelo y migración

- [x] 1.1 `user_progress.active_seconds` (Integer, default 0, server_default "0").
- [x] 1.2 Migración Alembic aditiva y reversible (compatible SQLite + Postgres).
- [x] 1.3 ALTER TABLE en las dev DBs locales (`edurobotics.db`, `backend/edurobotics.db`).

## 2. Backend: endpoint heartbeat

- [x] 2.1 `POST /api/progress/heartbeat { content_id }` (auth de usuario).
- [x] 2.2 Servicio: `active_seconds += min(paso, 20)`; descartar heartbeats < ~10 s desde el
      último para el mismo contenido (`last_heartbeat`).
- [x] 2.3 Rate-limit amistoso; validar que el contenido existe.

## 3. Backend: métricas por tiempo activo

- [x] 3.1 Reemplazar `_scope_span_seconds` por `_scope_active_seconds` (suma) en `metrics.py`.
- [x] 3.2 Mantener learners/completed/mediana/rango; misma forma de respuesta.
- [x] 3.3 Docstring del módulo actualizado (ya no es span de calendario).

## 4. Frontend: heartbeat

- [x] 4.1 `sendHeartbeat(contentId)` en `progress/services/progress.js`.
- [x] 4.2 Hook en `ContentViewer`: interval 15 s gated por `visibilityState`; limpia en
      unmount/cambio de unidad. Credita un contenido por tick (evita multiplicar por bloque).

## 5. Frontend: rediseño de la tarjeta

- [x] 5.1 Cifra principal = tiempo activo típico; rango si `sample ≥ 2`.
- [x] 5.2 Tabla por módulo/unidad con columnas `Parte | Completaron | Tiempo típico`.
- [x] 5.3 Estado "datos insuficientes" (gris) cuando la suma activa es 0; nunca "1 s".
- [x] 5.4 Copy actualizado (quitar "incluye pausas" y el pie de "~0").

## 6. Verificación

- [x] 6.1 Test backend: heartbeat suma acotado y descarta spam.
- [x] 6.2 Test backend: `metrics` por unidad refleja tiempo activo, no span.
- [x] 6.3 `npm run build` verde; tests nuevos verdes (los client-fixture fallan por
      versión de starlette local, pre-existente — CI los cubre).
