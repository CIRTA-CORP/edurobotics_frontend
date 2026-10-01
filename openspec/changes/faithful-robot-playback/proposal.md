# Reproducción fiel del movimiento del robot

## Why

Al ejecutar un programa corto el brazo se mueve a tirones, hace recorridos
extraños y parece no completar lo que el código pide. No es el robot: es cómo se
captura y se reproduce su movimiento.

**El desajuste de ritmos.** El contenedor escribe `/tmp/joint_states.json` a
**10 Hz** (`WRITE_INTERVAL = 0.1`), y el muestreador que inyecta el backend lo lee
a **20 Hz** (`JOINT_SAMPLE_SEC = 0.05`). Se lee el doble de rápido de lo que se
escribe, así que la mitad de los fotogramas son copias exactas del anterior. Y
como los dos relojes van por libre y el muestreador usa `sleep` fijo sin
compensar lo que tarda en leer, el patrón de repetidos es irregular.

**Las cuentas de un `move_joints(duration=2.0)`:**

| | |
|---|---|
| `robot_api` espera | 2,4 s (`duration + 0.4`) |
| Posiciones reales escritas (10 Hz) | **24** |
| Fotogramas capturados (20 Hz) | ~47 |
| De ellos, información nueva | **24** · el resto, repetidos |
| Reproducción | 47 × 0,05 s = 2,35 s |

La duración total sale casi bien por casualidad, pero **la resolución real es de
10 Hz** y la mitad de los envíos no aportan nada. El brazo se queda quieto y da
un salto, se queda quieto y da un salto.

**Y el visor llega tarde.** Suaviza hacia el objetivo con una constante de
0,12 s, lo que tarda **~0,36 s en alcanzar cada posición** (3·τ). Como llega un
objetivo nuevo cada 0,1 s, el brazo **nunca alcanza ninguno**: va siempre
persiguiendo, se queda corto en todo el recorrido, y al acabar sigue derivando
un tercio de segundo. Eso es exactamente «no ejecuta todo como corresponde».

**Y no hay marcas de tiempo.** Cada muestra se envía sin saber cuándo se tomó, y
si la lectura del fichero falla —por ejemplo si se lee a medias de una
escritura— la excepción se traga y esa muestra desaparece sin dejar rastro. El
backend reproduce a intervalo fijo porque no tiene otra información.

## What Changes

**Marcar cada muestra con su instante.** Sin eso, reproducir fielmente es
imposible: se está adivinando.

**Descartar repetidos al capturar.** Si los ángulos no cambiaron, no se envía. Con
la marca de tiempo no se pierde nada: el hueco queda registrado.

**Muestrear con horario, no con `sleep` fijo**, para que el retraso de cada
lectura no se acumule.

**Reproducir según las marcas de tiempo**, esperando lo que de verdad pasó entre
muestra y muestra, y descontando lo que tarda el envío.

**Interpolar en el visor** entre las dos últimas posiciones recibidas, en vez de
perseguir el objetivo con un filtro que va más lento que los datos.

Además: retirar el diagnóstico `robot · N juntas · N mallas` de la esquina del
visor, que hoy aparece automáticamente en desarrollo.

## Capabilities

**Modified**
- `simulator` — el visor reproduce el movimiento real, a su velocidad real.

## Impact

**Backend**
- `backend/app/features/robotics/routes.py` — muestreador inyectado y bucle de
  reproducción.

**Frontend**
- `src/features/simulator/viewer/UrdfViewer.jsx` — interpolación y diagnóstico.

**Fuera de alcance**: subir el ritmo de escritura del contenedor por encima de
10 Hz. Requeriría reconstruir y redesplegar la imagen en Fly.io, y con
interpolación 10 Hz se ve fluido. Anotado en `design.md`.
