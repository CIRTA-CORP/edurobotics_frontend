## Contexto

El simulador vive en UNA máquina de Fly.io (`FLY_MACHINE_ID`, hoy el UR5). Todos los alumnos
ejecutan código sobre la misma máquina: sin tope, N usuarios simultáneos la saturan (lag,
timeouts) y disparan el costo. El límite es de **sesiones de usuarios**, no de requests: una
sesión = un WebSocket `/api/simulator/ws` autenticado.

## Goals

- Tope configurable `SIM_MAX_CONCURRENT` (env, default 3) con el que se rechace **antes** de
  degradar la máquina compartida.
- Mensaje claro al usuario: "simulador ocupado, intenta más tarde" (issue #43).
- Un mismo usuario con dos pestañas ocupa **un** cupo.
- El cupo se libera al desconectarse, incluso en desconexiones abruptas.
- El frontend consulta capacidad antes de abrir el simulador (UX: no llegar a conectar para
  enterarse de que no hay cupo).

## Non-Goals

- **Lista de espera** — explícitamente fuera de alcance (#43 lo dice); queda diferido.
- **Store compartido (Redis)** para multi-worker/instancia: hoy Railway corre un worker; el
  registro vive en memoria del proceso y se documenta como límite conocido. Si se escala, se
  mueve a un store compartido (ya anotado en el proposal).
- **Cap por máquina/robot**: hoy hay una máquina → cap global. El diseño cuenta por robot para
  que #42 (nuevos robots) solo cambie la clave del registro, no la lógica.
- **Cuotas por rol/curso, prioridades o métricas de ocupación**: no pedidas.

## Decisions

### 1. Registro en memoria con refcount por usuario

`active_sessions: dict[user_id, int]` (contador de conexiones) + timestamps de última actividad.

- WS autenticado y con cupo → `active_sessions[user_id] += 1`.
- Desconexión (WebSocketDisconnect / error / cierre del handler) → `-= 1`; al llegar a 0 se
  elimina la entrada. **Refcount, no set**: si un alumno tiene dos pestañas y cierra una, el
  cupo NO se libera mientras la otra siga viva (el set simple lo liberaría mal).
- Un usuario ya activo **no** consume cupo nuevo (entra aunque `active == cap`).
- **Expiración de respaldo**: cada entrada guarda su último `touch`; al autenticar una conexión
  nueva se purgan entradas sin actividad en > 10 min (WS colgado que no llegó a liberar). El
  token se valida antes de tocar el registro (sin fugas de información de ocupación).

### 2. Rechazo en el propio WS (código 1013) + endpoint de capacidad

- Al conectar y autenticar: si `distinct_users >= cap` y el usuario NO tiene sesión →
  `{"type": "busy", "msg": "El simulador está ocupado, intenta más tarde."}` y cierre con
  código 1013 (*Try Again Later*, semántica WebSocket correcta para "reintentar luego").
- `GET /api/simulator/capacity` → `{ active, max, available }` (autenticado, lectura pura) para
  que el frontend avise antes de abrir el simulador. `available` = si el usuario ya tiene
  sesión o hay cupo.

### 3. El conteo es por sesión WS, no por request `/start`

`/start` y `/stop` siguen libres (encienden/apagan la máquina); la ocupación la define el WS
(quien está conectado ejecutando). No se cobra cupo por mirar el panel.

### 4. Concurrencia (un solo worker)

FastAPI corre sync+async en un event loop; el dict se toca solo en el handler del WS y en el
endpoint `capacity` (ambos async, sin awaits intermedios al mutar) → sin locks. Si hubiera
varios workers, esto se rompe y el store compartido deja de ser diferible.

## Verificación

- Con `SIM_MAX_CONCURRENT=1` (env en el test): segundo usuario → `busy` + 1013; al desconectar
  el primero, el segundo entra. Mismo usuario en dos pestañas = 1 cupo; cierra una pestaña y el
  cupo sigue ocupado; cierra ambas y se libera.
- `GET /capacity` refleja `active/max/available`.
- `pytest` verde; `npm run build` verde.
