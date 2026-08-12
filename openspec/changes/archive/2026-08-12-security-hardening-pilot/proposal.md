## Why

Tres fallas de seguridad concretas antes del piloto (F1 del ROADMAP), de la revisión
de código:
- El rate limiter de login/register/forgot es **bypasseable**: toma el primer valor de
  `X-Forwarded-For`, que controla el cliente → un atacante rota el header y nunca toca
  el límite (anula la protección anti-fuerza-bruta).
- El WebSocket del simulador recibe el **JWT en el query string**
  (`/api/simulator/ws?token=...`), que queda en logs de proxies y del servidor.
- El **rol vive en el JWT de 24h sin revocación**: un admin degradado sigue siendo admin
  hasta 24h. Choca con el cambio de rol que llega en F2.

## What Changes

1. **Rate limiter:** `_client_ip` toma el ÚLTIMO valor de `X-Forwarded-For` (el que añade
   el proxy de Railway), con fallback al peer directo. Se elimina el cleanup muerto y se
   compacta el dict de IPs.
2. **WS auth:** el token se envía como **primer mensaje** tras `accept()`, con timeout de
   5s y cierre `1008` si falta o es inválido. Se actualiza el cliente del simulador.
3. **token_version:** columna nueva en `users` (migración aditiva, default 0), incluida en
   el JWT y verificada en `require_admin`. Al cambiar un rol se incrementa → los tokens
   viejos de ese usuario quedan inválidos de inmediato. Se cablea en el `/admin/promote`
   existente (y lo consumirá el endpoint nuevo de F2).

## Capabilities

### New Capabilities
- `security`: defensa de rate limiting, autenticación del WebSocket e invalidación de
  sesiones al cambiar rol.

### Modified Capabilities
- _(none)_

## Impact

- Backend: `app/core/ratelimit.py`, `app/features/robotics/routes.py` (WS),
  `app/core/security.py` (`generate_token` + `require_admin`), `app/features/auth/models.py`
  (columna), `app/features/auth/routes.py` (`/admin/promote`), nueva migración Alembic aditiva.
- Frontend: cliente WS del simulador en `src/features/simulator/`.
- **Migración aditiva** (columna con default) — reversible, sin backfill de datos.
- Rotación de credenciales: **descartada por Mario** (fuera de alcance).
