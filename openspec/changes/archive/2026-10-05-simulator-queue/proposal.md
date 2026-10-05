# Cola de espera del simulador

## Why

Hay una sola máquina y un solo robot, pero el límite está en **3 sesiones
simultáneas**. Los tres alumnos que caben comparten el mismo
`/tmp/joint_states.json` y el mismo brazo: si dos ejecutan a la vez, **el robot
que uno ve moverse puede ser el del otro**. No hay error ni aviso, los programas
simplemente se pisan.

Y cuando el límite se alcanza, el alumno ve «El simulador está lleno — no hay
lista de espera, vuelve a intentarlo en unos minutos», con un botón de reintentar
que hay que pulsar a mano. Si se queda mirando la pantalla, no entra solo cuando
se libera un hueco.

La directora pregunta por la espera. Mario decide: **límite a 1 y cola de verdad**.

Una máquina por sesión queda descartada por coste: se pagarían dos máquinas
cuando puede que solo una se esté usando.

## What Changes

**El límite baja a 1.** Con una máquina y un robot, es el único valor que evita
que dos programas se pisen. Sigue siendo configurable por entorno.

**La espera pasa al momento de ejecutar, no al de entrar.** Hoy el alumno ni
siquiera puede abrir el editor si hay alguien ejecutando, aunque esa ejecución
dure tres segundos. Con el cambio: cualquiera entra y escribe código, y solo se
hace cola al pulsar **Ejecutar**, que es cuando de verdad hace falta la máquina.

**La cola avisa y admite sola.** En vez de rechazar con «ocupado», el servidor
mantiene al alumno en una fila, le dice qué puesto ocupa y lo actualiza mientras
avanza. Cuando le toca, su programa se ejecuta sin que tenga que pulsar nada.

## Capabilities

**Modified**
- `simulator` — un solo ejecutor a la vez, con turno en vez de rechazo.

## Impact

**Backend**
- `backend/app/features/robotics/routes.py` — límite por defecto, cola FIFO en el
  WebSocket, mensajes de turno.
- `tests/` — casos de cola: turno, avance, abandono.

**Frontend**
- `src/features/simulator/pages/SimulatorPage.jsx` — dejar de bloquear la entrada.
- `src/features/simulator/components/LeftPanel.jsx` — mostrar el puesto en la fila
  mientras se espera.

**Limitación conocida**: la cola vive en memoria del proceso, igual que el
recuento de sesiones. Con un solo worker en Railway funciona; el día que haya
más de uno, cada worker tendría su propia cola. Está anotado en `design.md`.
