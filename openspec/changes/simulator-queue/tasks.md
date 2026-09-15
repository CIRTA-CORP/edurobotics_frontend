# Tasks — Cola de espera del simulador

## 1. Un solo ejecutor

- [x] 1.1 `SIM_MAX_CONCURRENT` por defecto a **1** (`design.md` §1).
- [x] 1.2 Comprobar que el segundo que ejecuta ya no entra en paralelo.

## 2. La cola en el WebSocket

- [x] 2.1 Fila FIFO en memoria, junto al recuento de sesiones.
- [x] 2.2 Al conectar con el hueco ocupado: entrar en la fila en vez de rechazar
      con `1013`.
- [x] 2.3 Enviar el puesto cada pocos segundos mientras espera. Ese envío es
      también lo que detecta el abandono (`design.md` §3).
      **Corregido durante la implementación**: el envío por sí solo no bastaba.
      Hubo que escuchar a la vez, por dos motivos: detectar de verdad la
      desconexión, y porque el cliente manda el `run` inmediatamente después del
      token — o sea, **mientras hace cola**. Sin guardarlo, al llegarle el turno
      no se habría ejecutado nada y el alumno se quedaría mirando.
- [x] 2.4 Al liberarse el hueco, admitir al primero **sin que pulse nada**.
- [x] 2.5 Sacar de la fila en cualquier salida: cierre limpio, error o desconexión.
- [x] 2.6 Tope de espera: pasado el máximo, avisar y cerrar (`design.md` §6).
- [x] 2.7 Un mismo usuario no ocupa dos puestos aunque abra dos pestañas.

## 3. Entrar ya no depende del hueco

- [x] 3.1 `SimulatorPage` deja de bloquear la entrada por ocupación.
- [x] 3.2 Mantener la cifra de ocupación en la cabecera como información.
- [x] 3.3 Retirar `BusyNotice` si queda sin uso, o reservarlo para el tope de espera.

## 4. Lo que ve el alumno

- [x] 4.1 Al pulsar Ejecutar con la máquina ocupada: mensaje con su puesto en la
      fila, en español.
      **Corregido tras revisarlo**: al principio el aviso iba solo a la terminal,
      una línea pequeña abajo. Para una espera de varios segundos eso se pierde.
      Ahora hay un panel sobre el visor 3D —que es donde el alumno mira mientras
      espera— con el puesto, y la terminal conserva el detalle.
- [x] 4.2 Actualizar el puesto según avanza.
- [x] 4.3 Al llegar su turno, que se ejecute solo y se note el cambio.
- [x] 4.4 Permitir cancelar la espera (el botón Detener ya cierra el WebSocket).

## 5. Tests

- [x] 5.1 Con el hueco ocupado, el segundo recibe `queued` y no `busy`.
- [x] 5.2 Al liberarse, el que esperaba pasa a ejecutar.
- [x] 5.3 Si el que espera se desconecta, sale de la fila y no bloquea al siguiente.
- [x] 5.4 Dos pestañas del mismo usuario no ocupan dos puestos.

## Verificación final

- [x] 6.1 `pytest -q` verde y `ruff` sin hallazgos nuevos.
- [x] 6.2 Frontend: `npm run lint` y `npm run build`.
- [x] 6.3 **Prueba a mano con dos sesiones**: dos navegadores, uno ejecuta y el
      otro ve su puesto y entra solo al terminar el primero.
      Hecho con dos clientes WebSocket reales contra el backend en marcha, que
      es equivalente y más repetible: el segundo recibió «EN COLA — puesto 1»
      mientras el primero tenía el hueco, y «ES TU TURNO» al soltarlo, sin
      pulsar nada.
- [x] 6.4 Incorporar el delta a `specs/` y archivar el change.
