# simulator-session-limit (#43) — límite de sesiones concurrentes

## 1. Backend

- [ ] 1.1 `SIM_MAX_CONCURRENT` (env, default 3). Registro de sesiones activas por `user_id`
      (set en memoria del proceso).
- [ ] 1.2 En el WS `/api/simulator/ws`, tras autenticar: si usuarios activos distintos ≥ cap y el
      usuario no tenía sesión → enviar `{type:"busy"}` + cerrar (1013). Si entra, registrar; liberar
      en desconexión (`finally`) con expiración de respaldo.
- [ ] 1.3 `GET /api/simulator/capacity` → `{ active, max, available }`.

## 2. Frontend

- [ ] 2.1 Al abrir el simulador, consultar `capacity`; sin cupo → mensaje "ocupado, intenta más tarde".
- [ ] 2.2 Si el WS cierra con `busy`, mostrar el mismo mensaje.

## 3. Verificación

- [ ] 3.1 Test: con cap=1, segundo usuario → busy; liberar al desconectar; misma persona en 2 pestañas = 1 cupo.
- [ ] 3.2 `pytest` verde; `npm run build` verde.

## Diferido
- Lista de espera; store compartido (Redis) para multi-worker; cap por-máquina cuando haya varios robots.
