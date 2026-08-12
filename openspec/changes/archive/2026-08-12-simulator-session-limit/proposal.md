## Why

Issue #43: el simulador corre en una máquina de Fly.io con capacidad finita. Si demasiados
alumnos ejecutan código al mismo tiempo, la máquina se satura (lag, timeouts) y el costo se
dispara. Luz pide un **límite de N usuarios simultáneos**, definido según las máquinas
disponibles/pagadas: al llegar al máximo, **no permitir nuevas sesiones** y mostrar un mensaje de
"simulador ocupado, intenta más tarde". **Sin lista de espera** (mejora futura).

## What Changes

### Backend
- **Cap configurable** `SIM_MAX_CONCURRENT` (env, default acorde a las máquinas; ej. 3).
- El WebSocket `/api/simulator/ws` lleva un **registro de sesiones activas** (por `user_id`, para
  que un alumno con dos pestañas ocupe **un** cupo, no dos). Al conectar, tras autenticar:
  - si el nº de usuarios activos distintos **< cap** (o el usuario ya tiene sesión) → entra y se
    registra; al desconectar, se libera.
  - si está lleno → envía `{ "type": "busy", "msg": "..." }` y cierra con código 1013 (*Try Again
    Later*).
- Nuevo `GET /api/simulator/capacity` → `{ active, max, available }`, para que el frontend avise
  **antes** de abrir el simulador (mejor UX que fallar al conectar).

### Frontend
- Al abrir el simulador, consultar `capacity`; si no hay cupo, mostrar el mensaje de "ocupado,
  intenta más tarde" en vez de la pantalla de inicio. Y si el WS cierra con `busy`, mostrar el
  mismo mensaje.

## Capabilities

### New Capabilities
- `simulator`: límite de sesiones concurrentes con mensaje de ocupado.

## Impact

**Backend:** `robotics/routes.py` (registro de sesiones en el WS + `capacity` endpoint); env
`SIM_MAX_CONCURRENT`. **Frontend:** `SimulatorPanel`/`SimulatorPage` (chequeo de capacidad +
mensaje ocupado). Sin migración.

## Riesgo y límites (honestidad)

- **Estado en memoria del proceso:** el registro de sesiones vive en el proceso FastAPI. Hoy
  Railway corre **un** worker → funciona. Si algún día se escala a varios workers/instancias, el
  conteo se fragmenta y hay que mover el registro a un store compartido (Redis). **Se documenta
  como límite conocido**; no se sobre-ingeniera con Redis para el piloto.
- **Cap por máquina:** hoy hay una máquina (UR5) → un cap global. Cuando haya varios robots/máquinas
  (ver #42), el cap pasa a ser **por máquina**; este diseño lo permite (contar por robot).
- **Fuga de cupos:** una desconexión abrupta debe liberar el cupo → liberar en `finally`/on-disconnect,
  con expiración de respaldo por si un WS queda colgado.

## Verificación
- Con `SIM_MAX_CONCURRENT=1`: un segundo usuario recibe `busy` y no entra; al desconectar el
  primero, el segundo ya puede. Un mismo usuario en dos pestañas ocupa un solo cupo.
- `GET /capacity` refleja `active/max`. `pytest` verde; `npm run build` verde.
