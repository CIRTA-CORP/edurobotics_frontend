## 1. Rate limiter

- [x] 1.1 `_client_ip`: usar el ÚLTIMO valor de `X-Forwarded-For` (`split(",")[-1]`),
      fallback al peer directo.
- [x] 1.2 Quitar el cleanup muerto; `_sweep` compacta IPs sin hits cada N llamadas.
- [x] 1.3 Test: requests con `X-Forwarded-For` forjado distinto NO evaden el límite
      (`test_rate_limit_ignores_forged_xff_prefix`).

## 2. WebSocket auth

- [x] 2.1 `/api/simulator/ws`: tras `accept()`, token en el primer mensaje (timeout 5s),
      `verify_token`, `close(1008)` si falta o es inválido. Ya no se lee del query string.
- [x] 2.2 Cliente del simulador (`LeftPanel.jsx`) envía el token como primer mensaje;
      URL sin `?token=`. (`GazeboSocket.jsx` es dead code, no se toca.)
- [x] 2.3 Tests: token inválido → cierre 1008; token válido → procede
      (`test_ws_rejects_invalid_token`, `test_ws_accepts_valid_token`).

## 3. token_version

- [x] 3.1 Columna `token_version` en `User` + migración Alembic aditiva `b2c3d4e5f6a7`.
- [x] 3.2 `token_version` en el payload de `generate_token` (login y profile lo pasan).
- [x] 3.3 `require_admin`: carga el usuario y rechaza 401 si el `token_version` del JWT
      no coincide.
- [x] 3.4 `set_user_role` incrementa `token_version` al cambiar el rol (cablea `/admin/promote`).
- [x] 3.5 Test: admin degradado recibe 401 en el siguiente request admin
      (`test_demoted_admin_is_rejected`).

## 4. Verificación

- [x] 4.1 `pytest tests/` verde: **33 passed** (4 tests nuevos de F1).
- [x] 4.2 Migración encadena bien (`alembic history`) y sus ops son portables
      (add_column con default / batch drop_column). Up/down completo contra Postgres
      = chequeo de deploy. (El full-chain en SQLite está bloqueado por una migración
      anterior de índices, no por ésta.)
