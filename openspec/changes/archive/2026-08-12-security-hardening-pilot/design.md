## Context

`RateLimiter._client_ip` (ratelimit.py:33-38) hace `x-forwarded-for.split(",")[0]`. En
una cadena `cliente, proxy1` el primer valor es el que el cliente puede falsificar; el
proxy de Railway añade el valor de confianza al final. El cleanup de líneas 60-62
(`if not window: pop` justo tras `append`) nunca ejecuta.

El WS `/api/simulator/ws` autentica leyendo el token del query string. La app decodifica
JWT con `verify_token`; `generate_token` arma el payload en login/register.

`User` no tiene `token_version`. `require_admin` hoy sólo lee el rol del JWT (sin DB), así
que un JWT con `role=admin` pasa aunque el usuario ya haya sido degradado.

## Goals / Non-Goals

**Goals:**
- El límite de intentos no se puede evadir falsificando `X-Forwarded-For`.
- El token del WS no viaja en la URL.
- Cambiar el rol de un usuario invalida sus tokens vivos.

**Non-Goals:**
- No mover el rate limiter a Redis (sigue in-memory por instancia; ya documentado).
- No rediseñar auth a refresh tokens; `token_version` es la mitigación mínima.
- No rotar credenciales (descartado por Mario).

## Decisions

1. **XFF: último valor + fallback al peer.** Con un solo proxy (Railway), el último
   segmento es la IP que ve el proxy, no falsificable por el cliente: `split(",")[-1]`.
   Si no hay header, `request.client.host`.

2. **WS: token como primer mensaje.** Tras `accept()`, esperar (timeout 5s) un mensaje
   con el token, validarlo con `verify_token`; si falta o es inválido → `close(1008)`.
   Alternativa descartada: subprotocol header (menos portable con el cliente actual).

3. **token_version en require_admin (no en todo request).** El riesgo es un admin
   degradado; basta verificar en `require_admin`: carga el usuario, compara
   `jwt.token_version == user.token_version`; si difiere → 401. Añade 1 query por request
   admin (bajo volumen). Alternativa más simple y más débil (acortar la vida del token) se
   descarta: deja ventana de hasta 1h.

4. **Incremento al cambiar rol.** `/admin/promote` (y el endpoint de F2) hacen
   `user.token_version += 1` al cambiar el rol. Invalida todos los tokens de ese usuario
   (lo obliga a re-loguear), que es el comportamiento deseado.
