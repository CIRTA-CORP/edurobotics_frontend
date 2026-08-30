# simulator-urdf-viewer — visor del simulador basado en URDF

Spike en `feature/3-urdf-viewer`. Producción no se toca: el visor actual sigue siendo el
predeterminado durante todo el change.

## 0. Antes de empezar

- [x] 0.1 Robot y calibración: **`ur5e` con `default_kinematics.yaml`** (nominal del
      fabricante). Decidido con evidencia, no por preferencia: `load_ur5e_robotiq.launch:11`
      y `robot.xacro:80` lo cargan por defecto, así que es lo que simula PyBullet. Usar una
      calibración por brazo (`kinematics_unagi.yaml`, `kinematics_uni.yaml`) volvería a
      separar el visor de la simulación, que es el defecto que este change corrige; además
      difieren en micras y describen un brazo con nombre propio, mientras 0.1625 es el
      número que el estudiante encuentra en la hoja de datos.
- [x] 0.2 Línea base del bundle: `vendor-babylon` 6.59 MB, **1.43 MB gzip**.

## 1. Exportar la descripción del robot

- [x] 1.1 `scripts/export-robot-urdf.py` exporta `ur5e_robotiq2f85.xacro` → URDF plano.
      No hizo falta Docker: `xacro` desde pip basta sustituyendo `$(find robot_description)`
      por la ruta real, que es lo que el script hace sobre una copia temporal.
- [x] 1.2 Calibración nominal aplicada (la que el xacro toma por defecto).
- [x] 1.3 **No hubo que convertir nada**: las 13 mallas ya existían como `.glb` en
      `public/meshes/`. Las mallas nunca estuvieron mal — el defecto era el ensamblaje. El
      script reescribe las rutas `package://…​.dae` a esos `.glb` y verifica que existan.
- [x] 1.4 URDF en `public/robots/ur5e/` y `public/robots/README.md` con el comando exacto
      de regeneración y las decisiones tomadas al exportar.

## 2. Base del visor nuevo

- [x] 2.1 `three` 0.185.1 y `urdf-loader` 0.13.1 instalados.
- [x] 2.2 `UrdfViewer.jsx` con la misma interfaz que el actual (`{ jointAngles, cameraView }`).
- [x] 2.3 Carga del URDF y montaje en la escena, con la conversión Z-arriba → Y-arriba.
- [x] 2.4 Presets de cámara portados con la fórmula de `ArcRotateCamera` para que el
      encuadre sea idéntico y la comparación lado a lado sea honesta; suavizado exponencial
      portado tal cual (mismo `SMOOTH_TAU = 0.12`).

## 3. Movimiento

- [x] 3.1 Ángulos aplicados con `setJointValue`. La normalización de nombres se extrajo a
      `viewer/jointNames.js` y ahora la comparten ambos visores, así que los dos hablan el
      mismo idioma con el backend.
- [x] 3.2 **Gripper verificado** con `scripts/check-gripper-linkage.mjs`: moviendo solo la
      junta motriz, las 5 `mimic` la siguen exactamente y la punta del dedo recorre 39,2 mm
      al cerrar. El mayor riesgo técnico del change queda despejado.

## 4. Verificación numérica

- [x] 4.1 `scripts/verify-robot-kinematics.py` compara los orígenes de las 6 juntas del
      brazo contra `default_kinematics.yaml` con tolerancia de 1 mm.
      **Se comprobó que falla cuando debe**: reintroduciendo `0.089159` reporta
      «desviación 73.3 mm» y sale con código 1.
      *Desviación respecto al plan*: se hizo como script ejecutable y no como test de
      framework, porque el frontend hoy no tiene ninguna infraestructura de tests y montar
      vitest para un solo caso era desproporcionado. Queda anotado como deuda.
- [x] 4.2 El visor no contiene ninguna constante cinemática; lo comprueba el mismo script.

## 5. Convivencia y comparación

- [x] 5.1 Selección por `?viewer=urdf` en `SimulatorPanel.jsx`, en `lazy` para que quien no
      lo pida no pague su descarga. Sin el parámetro, el visor actual, intacto.
- [x] 5.2 Comparación hecha en `/robot-compare`: ambos visores, misma pose, sin backend —
      así mirar un robot no consume uno de los tres cupos del simulador. Capturado con
      Chrome headless.
      **Resultado en la pose Home (todas las juntas a cero)**: el visor actual apila el
      brazo en vertical; el nuevo lo extiende en horizontal, que es la pose cero de un
      UR5e. Con el gripper a 0.70, el nuevo cierra como una pinza y el actual muestra las
      piezas dispersas.
- [x] 5.3 Bundle medido: `UrdfViewer` 716,77 kB / **183,40 kB gzip** frente a los
      1.425,09 kB gzip de `vendor-babylon`. **7,8× más liviano**, ~1,24 MB gzip menos en la
      ruta del simulador.

## 6. Decisión

- [ ] 6.1 Mario revisa la comparación y decide: se adopta, se ajusta o se descarta.
- [ ] 6.2 Si se adopta, un change aparte cubre el cambio del visor por defecto, la baja de
      Babylon, el renombrado de `meshes/ur5/` (el robot es un UR5e y ese nombre originó la
      confusión) y la incorporación de `ur10e` y `pupi`.

## Hallazgos durante la implementación

- **Las mallas cargaban en cero y el fallo era invisible.** urdf-loader antepone el
  directorio del propio URDF a cualquier ruta que no empiece por `package://`, así que las
  rutas absolutas reescritas daban 404 en silencio: el robot aparecía con sus 22 juntas y
  nada de geometría. Se corrigió conservando los `package://` como en ROS y espejando el
  paquete en `public/robots/robot_description/`, que además es lo que hará que el URDF de
  `ur10e` o `pupi` funcione sin tocar rutas.
- El indicador en pantalla («22 juntas · 0 mallas») es lo que hizo legible ese fallo. Sin
  él, la pantalla negra no distingue entre «no cargó», «cargó fuera de cámara» y «cargó sin
  geometría».

- La firma real de `loadMeshCb` es `(ruta, manager, material, onComplete)`, con el material
  en tercer lugar. La primera versión del visor usaba tres argumentos y habría fallado al
  cargar cualquier malla en el navegador. Lo detectó la comprobación del gripper, no la
  vista.
- El loader por defecto de `urdf-loader` solo entiende `.stl` y `.dae`, no `.glb`; por eso
  el `loadMeshCb` propio es necesario y no opcional.
- `npm audit` reporta 18 vulnerabilidades en el frontend (vite, react-router, postcss…),
  **todas preexistentes** y ajenas a este change. Merecen su propio trabajo, equivalente al
  que se hizo en el backend con pip-audit.

## Fuera de alcance (anotado, no se hace aquí)

- Mejoras estéticas (PBR, HDRI, sombras de contacto). Primero correcto, después bonito, para
  poder atribuir el resultado.
- Los otros robots (`ur10e`, `pupi`, `bluerov2`). El spike prueba el camino con uno.
- `SIM_MAX_CONCURRENT = 3` sobre una única máquina Fly compartida: tres estudiantes
  simultáneos. Es de arquitectura y merece su propio change; conviene decidirlo antes del
  piloto.
