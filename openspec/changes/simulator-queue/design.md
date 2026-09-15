# Design — Cola de espera del simulador

## Context

El recurso escaso no es «tener el simulador abierto», es **ejecutar**. El hueco
se ocupa cuando el WebSocket se abre —al pulsar Ejecutar— y se libera al
terminar. Escribir código no consume nada.

Hoy eso está mal aprovechado: la pantalla de «lleno» se decide al **entrar** a
la página, consultando cuántos están ejecutando en ese instante. Alguien que
abre el simulador mientras otro corre un programa de tres segundos se encuentra
la puerta cerrada, y tiene que pulsar «Reintentar» para descubrir que ya podía
pasar.

## Goals

- Que dos programas no puedan pisarse en el robot compartido.
- Que esperar sea esperar: el alumno ve su puesto y entra solo cuando le toca.
- Que la máquina se ocupe el tiempo mínimo — el de la ejecución, no el de la
  sesión.

## Non-Goals

- **No** se aborda el aislamiento real (sandbox, código como root). Bajar el
  límite a 1 evita que los alumnos se pisen entre ellos, pero no protege la
  máquina de lo que ejecuta un alumno. Sigue pendiente y es otro change.
- **No** se reparte el tiempo ni se corta a quien ejecuta un programa largo. El
  que está dentro termina; no hay expulsión por turno.
- **No** se persiste la cola. Si el backend se reinicia, la fila se vacía y los
  que esperaban reciben un error claro.
- **No** se implementa cola entre varios procesos. Ver Decisión 5.

## Decisions

### 1. El límite baja a 1, en el código y no solo en el entorno

`SIM_MAX_CONCURRENT` pasa a valer 1 por defecto. Se podría dejar en 3 y poner la
variable en Railway, pero entonces el valor seguro dependería de que alguien
recuerde configurarlo, y el valor por defecto —el que usa cualquiera que levante
el proyecto— seguiría permitiendo que dos alumnos se pisen.

Sigue siendo configurable: quien un día tenga varias máquinas lo sube.

### 2. La cola espera en el WebSocket que ya existe

El alumno ya abre un WebSocket para ejecutar. En vez de rechazarlo con `1013`
cuando está ocupado, se le mantiene en una fila sobre esa misma conexión.

Ventaja sobre una cola por sondeo (que el cliente pregunte cada pocos segundos):
la conexión abierta **es** la prueba de que sigue esperando. Si cierra la pestaña,
el socket muere y sale de la fila solo. Con sondeo haría falta un TTL y alguien
que limpie a los que abandonaron.

### 3. El puesto se envía periódicamente, y eso detecta el abandono

Mientras espera, el servidor le manda su puesto cada pocos segundos. Ese envío
cumple dos funciones: informar, y **descubrir que se fue** — si el cliente ya no
está, el envío falla y el `finally` lo saca de la fila.

Es más simple que un sistema de eventos y avisos, y se comporta igual de bien
con una fila corta, que es la que habrá: los turnos duran lo que dura una
ejecución.

### 4. Se entra a escribir siempre; se hace cola al ejecutar

La pantalla de «lleno» deja de bloquear la entrada. El alumno abre el simulador,
escribe su programa y solo espera cuando pulsa Ejecutar.

Esto es lo que hace usable una sola máquina: si el hueco se reservara al entrar,
un alumno con la pestaña abierta y sin ejecutar nada tendría bloqueada a toda la
clase. Reservándolo solo durante la ejecución, la fila avanza en segundos.

La cifra de ocupación se mantiene en la cabecera como información, pero deja de
ser una puerta.

### 5. La cola vive en memoria, y hay que saberlo

Igual que `_active_sessions`, la fila es una estructura del proceso. Con el único
worker que corre hoy en Railway funciona.

Con más de un worker cada uno tendría su propia fila y su propio recuento, y el
límite de 1 dejaría de serlo: dos alumnos atendidos por workers distintos
entrarían a la vez y volverían a pisarse. **Si algún día se escala a más de un
worker, esto hay que mover a un almacén compartido antes**, no después.

Queda escrito aquí porque es el tipo de cosa que no falla en pruebas y falla en
producción el día que alguien sube el número de workers pensando que mejora el
rendimiento.

### 6. Hay un tope de espera

Nadie se queda en la fila indefinidamente. Pasado un máximo, se le dice que no
ha podido entrar y se cierra, en vez de dejarlo colgado sin saber qué pasa.
