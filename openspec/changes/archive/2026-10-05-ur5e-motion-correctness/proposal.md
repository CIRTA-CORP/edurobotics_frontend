# El brazo se mueve como un UR5e: llega, se queda y avisa

## Why

Cuando un alumno ejecuta código, el brazo hace movimientos raros: tirones, saltos,
piezas que parecen chocar entre sí.

**La geometría no es el problema.** Se verificó contra los parámetros oficiales de
Universal Robots: las 36 medidas de la cinemática coinciden, los límites de giro,
velocidad y fuerza coinciden en las 6 articulaciones, y en 203 poses al azar la punta
del brazo del visor queda donde dicen las fórmulas DH oficiales con un error máximo de
0,000000 mm.

**El problema es cómo se mueve.** Medido en la máquina de Fly, con los archivos
desplegados idénticos byte a byte a los del repositorio:

| Qué | Medido |
|---|---|
| Retraso desde la orden hasta que el brazo se mueve | **0,9 s** |
| Hasta dónde llega un movimiento de 2 s | **84–95 %** del objetivo, nunca el 100 % |
| Qué hace al terminar | **Vuelve a la pose cero** en 0,5–1,5 s |
| Movimiento rápido (base 3 rad en 0,5 s) | **No llega nunca** |
| Actualizaciones de la posición | **~3 por segundo** (el código supone 10) |
| Lecturas del archivo de posiciones a medio escribir | 3 en 6 s |

Las causas, leídas en el código y confirmadas por la medición:

1. **Dos controladores mandan sobre las mismas articulaciones.** El nodo de física
   interpola el movimiento pedido, pero solo mientras dura. En cuanto termina, en cada
   vuelta del ciclo vuelve a aplicar lo que dice el controlador de ROS, que no recibe
   las órdenes y sostiene la pose cero. Por eso el brazo vuelve solo a cero, y por eso
   nunca termina de llegar.
2. **`robot_api` lo tapa.** Al terminar cada movimiento escribe 8 fotogramas con la
   pose *ordenada*, no la medida, para que la animación muestre el brazo en su sitio.
   El siguiente movimiento arranca desde donde está el brazo de verdad, y en pantalla
   se ve un salto. Es además el «segundo escritor» que bloquea el arreglo de la
   animación (`faithful-robot-playback`).
3. **Todo va por vueltas de un ciclo, no por tiempo.** La orden se revisa y la
   posición se escribe cada 80 vueltas, suponiendo 800 vueltas por segundo. En la
   máquina real van ~240. De ahí los 0,9 s de retraso y las 3 actualizaciones por
   segundo.
4. **Dos procesos escriben el archivo de posiciones**, `joint_writer.py` y el nodo de
   física, y los dos lo vacían antes de escribir: quien lo lee puede pillarlo a medias.
5. **Nada valida lo que pide el alumno.** `robot_api` solo comprueba que el nombre de
   la articulación exista. Una velocidad imposible para un UR5e real (más de 180°/s)
   o un ángulo fuera de rango se aceptan sin aviso.
6. **Los choques del brazo consigo mismo no se avisan.** La física los calcula, pero
   los motores siguen empujando: el brazo vibra o se traba. Un UR5e real haría una
   parada de protección.

## What Changes

**En el contenedor del simulador** (requiere reconstruir y desplegar la imagen):

- El brazo y la pinza **mantienen la última pose ordenada**. El controlador de ROS
  deja de pisarla.
- La orden se revisa y la posición se escribe **por tiempo**: cada 20 ms y cada
  100 ms. Ya no depende de cuántas vueltas dé el ciclo.
- El archivo de posiciones tiene **un solo escritor** y se escribe de forma
  **atómica**.
- **Parada de protección**: si el brazo choca consigo mismo o con el suelo durante un
  movimiento, se detiene donde está y el programa del alumno lo dice.
- `robot_api` **valida**: rechaza ángulos fuera de los límites del UR5e y, si la
  velocidad pedida supera la del robot real, alarga el movimiento y lo avisa.
- `robot_api` **espera a que el brazo llegue** en vez de dormir un tiempo fijo, y deja
  de inventar fotogramas.

**En el backend:** los números de línea de los errores de Python se traducen a las
líneas del alumno, porque el backend es el único que sabe cuánto mide el wrapper.

## Capabilities

**Modified**
- `simulator` — el movimiento es el de un UR5e real: llega, se mantiene, respeta sus
  límites y se detiene si choca.

## Impact

- `cirta_simulation-master/ros2_pkgs/ros2_simulation_bridge2/scripts/bullet_node.py`
- `cirta_simulation-master/simulation/robot_api.py`
- `cirta_simulation-master/Dockerfile.edurobotics` — deja de lanzar `joint_writer.py`
  y `command_executor.py`
- `cirta-work/edurobotics_backend/backend/app/features/robotics/routes.py`
- `frontend-react/src/features/simulator/components/LeftPanel.jsx`

La carpeta del simulador **no tiene control de versiones**. Los originales se
respaldaron en `cirta_simulation-master/_respaldo_antes_ur5e_motion_20261001/`.
