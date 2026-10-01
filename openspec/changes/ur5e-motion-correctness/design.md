# Design — El brazo se mueve como un UR5e

## Context

La cadena real de un `move_joints`, leída en el código desplegado:

```
robot_api.move_joints ─► /tmp/robot_cmd.json ─► bullet_node (cada 80 vueltas)
                                                    │ interpola lineal, mientras dura
                                                    │ después: manda el controlador de ROS (pose 0)
                                                    ▼
                                    PyBullet (motores en POSITION_CONTROL,
                                              velocidad ≤ 180°/s, fuerza 150/28 Nm,
                                              colisión propia activada, suelo)
                                                    │
                     bullet_node (cada 80 vueltas) ─┤
                     joint_writer (ROS, 10 Hz)  ────┴─► /tmp/joint_states.json
```

`command_executor.py` también lee las órdenes y las publica al controlador de ROS,
pero ese controlador no las recibe: la medición muestra que sigue sosteniendo la
pose cero.

## Goals

- Que el brazo llegue a la pose pedida y se quede ahí.
- Que el movimiento respete los límites de un UR5e real y lo explique cuando no.
- Que un choque se vea como lo que es, una parada, no como un temblor.
- Que lo que muestra la animación sea lo que pasó en la física.

## Non-Goals

- **No** se arregla el controlador de ROS ni la comunicación DDS. El nodo de física
  ya sustituía al controlador en el movimiento; ahora lo sustituye también en reposo.
- **No** se planifican caminos que esquiven obstáculos. El movimiento sigue siendo
  lineal en cada articulación, como un `movej` del UR. Si choca, se para.
- **No** se cambia la pose inicial de cada ejecución. El brazo queda donde lo dejó el
  último programa. Que empiece cada vez en reposo es una decisión de producto
  pendiente.
- **No** se actualizan las masas a la versión más reciente de Universal Robots. El
  brazo se mueve por posición y casi no le afectan.

## Decisions

### 1. El nodo de física sostiene la última pose ordenada, siempre

Hoy el orden de cada vuelta es: aplicar los mandos de ROS, y después, *si hay
trayectoria activa*, aplicar la interpolación. Sin trayectoria, ganan los mandos de
ROS, que valen cero.

Pasa a haber una **pose sostenida**: al arrancar, la pose actual; durante un
movimiento, la interpolada; al terminar, el objetivo. Se aplica en **todas** las
vueltas, después de los mandos de ROS, así que siempre gana. Igual para la pinza.

No se quita la llamada a los mandos de ROS. El resto del puente la usa para
actualizar su estado, y quitarla es un cambio más grande que no hace falta.

### 2. Por tiempo, no por vueltas

La orden se revisa cada **20 ms** y la posición se escribe cada **100 ms**, medidos
con reloj. El ciclo de la máquina real va a ~240 vueltas por segundo, no a 800, y
depende de la carga de la CPU. Lo que depende del tiempo no puede depender de eso.

100 ms son los 10 Hz que ya suponen el muestreador del backend (que lee al doble,
cada 50 ms) y el visor. No se cambia el ritmo: se cumple el que ya se suponía.

### 3. Un solo escritor, y atómico

`joint_writer.py` deja de lanzarse. Escribía la misma información, pero desde ROS,
que es justo la parte que no funciona. `command_executor.py` también deja de
lanzarse: publicaba al controlador que no recibe nada, y escribía el mismo archivo
de estado que ahora usa la parada de protección.

El nodo de física escribe en un archivo temporal y lo renombra (`os.replace`). En
Linux el renombrado es atómico: quien lee ve el archivo anterior o el nuevo, nunca
uno a medias.

### 4. La parada de protección la decide la física; el aviso, `robot_api`

Durante un movimiento, cada 20 ms el nodo de física consulta los contactos del brazo
consigo mismo y con el suelo. Si hay uno:

- Se sostiene la pose **actual**, no el objetivo: el brazo se para donde está.
- Se escribe en `/tmp/robot_cmd_status.json` el id de la orden, `"collision"` y las
  piezas que chocaron.

`robot_api` lee ese estado mientras espera y lanza `RobotCollisionError` con un
mensaje en español. El programa del alumno se detiene, como con un UR5e real.

**Qué contactos no cuentan.** Los de piezas adyacentes (PyBullet ya los excluye),
los internos de la pinza (su mecanismo de dedos está hecho de piezas que se tocan),
y los de la base con el suelo, porque está apoyada en él. Lo que queda es un choque
de verdad.

**Riesgo: falsos positivos.** Si alguna pose normal deja dos piezas en contacto, el
alumno recibiría una parada injusta. Por eso, antes de desplegar, se mide con
PyBullet en local y la URDF real en poses normales y en poses de choque conocido. Si
no se puede medir en local, la parada se despliega en **modo observación**: registra
el contacto sin detener el brazo, hasta comprobarlo en la máquina.

### 5. `robot_api` valida con los límites del UR5e

Los límites salen de `joint_limits.yaml`, que se verificó idéntico al oficial:

| Articulación | Rango | Velocidad máx. |
|---|---|---|
| base, hombro, muñecas 1–3 | ±2π rad (±360°) | π rad/s (180°/s) |
| codo | ±π rad (±180°) | π rad/s |

- **Fuera de rango:** `ValueError` con el límite. No se recorta en silencio: un
  ángulo recortado hace que el robot no vaya adonde el alumno cree.
- **Demasiado rápido:** se alarga la duración a la mínima posible y se imprime un
  aviso, por ejemplo «el UR5e no gira a más de 180°/s: este movimiento tardará
  0,95 s en vez de 0,5 s». Es lo que haría el robot real, y el alumno aprende el
  límite.

### 6. `robot_api` espera a que llegue y deja de inventar fotogramas

En vez de `sleep(duration + 0.4)`, espera hasta que todas las articulaciones estén a
menos de 0,01 rad del objetivo, o hasta que pase la duración más 2 s. Si se agota el
tiempo sin llegar, lo avisa en vez de seguir como si nada.

Los 8 fotogramas inyectados se eliminan. Existían para tapar la vuelta a cero; con
la pose sostenida no hay nada que tapar, y lo que muestra la animación pasa a ser lo
que hizo la física.

### 7. El backend traduce las líneas de los errores

El frontend restaba un número fijo (`WRAPPER_OFFSET = 37`) para marcar en el editor
la línea de un error. El backend es el único que sabe cuánto mide el wrapper, así que
reescribe `line N` → `line N − offset` en los tracebacks antes de enviarlos, y lo
indica con `"lines": "user"` en el mensaje. El frontend no resta nada cuando ve esa
marca, y resta 37 cuando no la ve, para seguir funcionando con un backend anterior.

### 8. El orden del despliegue importa

1. **Contenedor.** Con la imagen nueva desaparecen los fotogramas inventados.
2. **Backend y frontend**, incluido el arreglo de la animación.

El backend descarta los fotogramas sin marca de tiempo cuando conviven con los que sí
la tienen. Así, aunque el orden se invierta, no vuelve el tiempo que retrocede.

## Verification

En la máquina real, tras desplegar, repitiendo las mediciones de la propuesta:

| Qué | Hoy | Esperado |
|---|---|---|
| Retraso de la orden | 0,9 s | < 0,05 s |
| Hasta dónde llega | 84–95 % | error < 0,01 rad |
| 3 s después de terminar | de vuelta en 0 | sigue en el objetivo |
| Base 3 rad en 0,5 s | no llega | aviso y llega en ~0,95 s |
| Actualizaciones por segundo | ~3 | ~10 |
| Lecturas a medias | 3 en 6 s | 0 |
| Codo a 4 rad | — | `ValueError` antes de moverse |
| Choque provocado | vibra | parada y `RobotCollisionError` |

## Hallazgos durante la implementación

Cuatro cosas que no estaban en el diagnóstico inicial, encontradas al probar el ciclo
nuevo en la máquina real con una simulación aparte de la de producción.

### 9. La física iba en cámara lenta

Cada paso de PyBullet cuesta **2,6 ms** en la máquina (medido): techo de ~295 vueltas
por segundo con la CPU libre. Cada vuelta avanza la física 1/240 s, así que por debajo de
240 vueltas va más lenta que el reloj. Con otro proceso compitiendo bajó a ~68 vueltas:
**física al 28 %**. Como el movimiento se interpola con el reloj, el brazo quedaba muy
atrás de lo pedido.

Dar varios pasos para ponerse al día empeora el problema, porque el paso es justo lo caro.
En su lugar, **cada paso avanza el tiempo real transcurrido** (`RealTimeStep`), suavizado
y con tope de 1/60 s para no desestabilizar los contactos.

### 10. El motor iba por detrás aunque la física fuera en tiempo real

Con el paso corregido, el error al terminar un movimiento de 2 s bajó de 0,37 a 0,215 rad:
mejor, pero lejos de llegar. El motor solo recibía la posición objetivo y la perseguía.
Ahora recibe también **la velocidad prevista** (`ArmDrive`), en el mismo modo de control
estable de antes.

Y el perfil pasa de lineal a **mínimo tirón**: sale y llega con velocidad y aceleración
cero, como un brazo real, en vez de arrancar y frenar en seco. Pasa por el mismo punto
medio que el lineal, así que la forma del movimiento no cambia. Su pico de velocidad es
1,875 veces la media, y `robot_api` lo cuenta al decidir si un movimiento es posible.

| | primera versión | + tiempo real | + perfil y velocidad |
|---|---|---|---|
| Error al terminar 2 s | 0,370 rad | 0,215 rad | **0,0028 rad** |
| 3 rad al máximo, al terminar | 1,99 rad | 2,10 rad | **0,024 rad** |
| 3,5 s después | — | — | **0,0000 rad** |

### 11. Los programas largos no llegaban, y nadie se enteraba

La API exec de Fly rechaza cuerpos de más de ~16 KB (16 302 bytes pasan, 16 498 no), y lo
hace **con estado 200**. Con el base64 y el wrapper, un programa de unos 8 KB ya no
cabía, y el alumno no veía ningún mensaje. El backend comprime el programa (48 KB →
9 KB, ejecutado entero) y da un error claro si aun así no cabe.

### 12. El resaltado de la línea del error nunca funcionó

El frontend buscaba `File "<string>", line N`, pero el programa corre desde la entrada
estándar y Python escribe `File "<stdin>"`. Además restaba un 37 fijo, y el wrapper nuevo
mide 69. Ahora el backend mide el desfase del propio wrapper, reescribe el traceback con
la línea del editor del alumno y la envía en un mensaje `error_line`.

### Nota: la física usa la calibración de un UR5e concreto

`robot.xacro` usa por defecto `kinematics_uni.yaml`, la calibración de fábrica de un
robot real, y el visor usa la nominal. Difieren en hasta 1 mm y 0,2°: los dos son un
UR5e, y la diferencia no se ve. No se cambia.

## Hallazgos durante el despliegue

Medidos en la máquina real tras aplicar la primera imagen, y corregidos antes de dar el
cambio por terminado.

### 13. Los choques se reconocen por la fuerza, no por la penetración

Con la primera imagen, la parada de protección funcionaba unas veces sí y otras no. El
solver de PyBullet es muy rígido: mantiene las piezas a 0,01 mm aunque se empujen con
cientos de newtons, así que el umbral de 1 mm solo se superaba en golpes bruscos.
Medido con los mismos filtros:

| Situación | Fuerza | Penetración |
|---|---|---|
| Poses normales, rozar el suelo | ninguna | — |
| Empujar contra el suelo | 200–300 N | hasta 3 mm |
| Plegar el codo sobre sí mismo | **684 N** | **0,01 mm** |

Pasa a contar como choque una fuerza de **50 N o más por encima** de la que ya había al
empezar el movimiento. Restar lo que había al empezar es además lo que permite alejarse
tras una parada: con la primera imagen, el intento de alejarse volvía a detenerse.

Verificado: 10 de 10 casos (movimientos normales sin paradas falsas, paradas al empujar
y al plegarse, recuperación tras las dos, rozar sin parada). Tras una parada el brazo
frena en ~200 ms, con un pequeño rebote, y queda fijo.

### 14. Fly corta las ejecuciones a los ~60 s y se traga la salida

Un programa de 35 s vuelve; uno de 55 s da 408 sin nada de lo impreso. El límite de 120 s
configurado nunca se cumplió. El límite del programa (40 s) se aplica ahora dentro de la
máquina con `timeout`, que lo detiene conservando su salida y su movimiento.

### 15. Cada ejecución esperaba ~17 s antes de empezar

15 de esos 17 s eran cargar tres `setup.bash` de ROS (4 + 4 + 6 s), que el código del
alumno ni necesita. El contenedor guarda el entorno al arrancar, en `/tmp/ros_env.sh`, y
el backend lo lee de ahí.

### 16. La pinza nunca abría del todo

`bullet_interface` traducía la apertura con `1.0 - width`, suponiendo un rango de 1 rad.
El de la Robotiq 85 va de 0 a 0,804 rad, así que «abierta» quedaba en 0,196 rad, al
~75 %: exactamente lo medido. Se refleja dentro del rango real. Y `robot_api` espera a que
los dedos dejen de moverse en vez de a que lleguen: al cerrar sobre un objeto, la pinza
nunca llega, y eso es lo correcto.

### 17. Ajuste del cierre de la pinza

Al corregir la apertura de la pinza (16), el cierre empeoró: el límite de cierre
(`EPSILON_CLOSING`, 0,268) estaba calibrado para la fórmula equivocada, donde caía justo
en 0,785 rad, el punto en que las yemas se tocan. Con la fórmula corregida dejaba 22,5 mm
de hueco. Medido con `getClosestPoints`: 83,0 mm abierta, 22,5 mm a 0,589 rad, 0,2 mm a
0,785 rad. Se recalculó a 0,0243 para que el cierre siga en 0,785 rad.

### 18. El ruido de los motores anulaba la deduplicación

Con el brazo sostenido por sus motores, cada lectura en reposo difiere de la anterior
entre 2·10⁻⁸ y 10⁻⁶ rad, así que «emitir solo si cambió» dejó de filtrar: un programa de
40 s sin mover el robot daba ~400 fotogramas, y la animación reproducía 40 s de un brazo
quieto. El muestreador usa ahora una tolerancia de 10⁻⁴ rad respecto del último
fotograma enviado. Medido: un programa quieto de 5 s da 1 fotograma.

## Verificación en producción

Imagen `registry.fly.io/edurobotics-sim:ur5e-motion-20261001d`, aplicada con
`flyctl machine update` a la máquina `148ee95dc34489` (que conserva su ID).
Imagen anterior, para volver atrás:
`registry.fly.io/edurobotics-sim@sha256:df42b3062afbf92d7b38a37d21b2bbeb049b9f7d9b9d3d3dea1dfaf2c10ca48b`.

**Física y `robot_api`, 13 de 13:**

| | Antes | Medido |
|---|---|---|
| Retraso de la orden | 900 ms | 7 ms |
| Llegada tras 2 s | 84–95 % | error 0,0002 rad |
| 3 s después | de vuelta en 0 | error 0,0000 rad |
| 3 rad pedidos en 0,5 s | no llegaba | aviso, 1,82 s, error 0,0007 |
| Codo a 4 rad | aceptado | `ValueError` antes de moverse |
| Choque contra el suelo | rebotaba | parada; quieto 1,5 s (−0,408 → −0,408) |
| Alejarse tras la parada | — | error 0,0000 |
| Pinza | abría al 75 % | cerrada 0,784, abierta 0,000 |
| Escrituras por segundo / a medias | ~3 / 3 en 6 s | 10,3 / 0 |
| Procesos sobrantes | 2 | 0 |

**De punta a punta, por el código del backend, 10 de 10:** animación de 5,44 s para
2 s + 1 s + 2 s con el brazo quieto en la pausa; error de la línea 3 marcado como línea 3;
programa de 48 KB ejecutado; aviso de velocidad; programa trivial en 0,9 s (antes ~17 s);
programa de 60 s detenido a los 40 s conservando 39 líneas.

**Compatibilidad:** el backend de producción actual (`main`) funciona con la imagen
nueva. Ya recibe el movimiento corregido; el resto de mejoras llega al mergear
`feature/7-backend-restructure` y `feature/3-urdf-viewer`.
