## Why

El simulador es lo más importante de la plataforma y hoy **dibuja un robot que no es el
robot**. No es un desajuste visual: el visor tiene hardcodeadas las medidas de un **UR5**
mientras las mallas que carga son de un **UR5e**.

La evidencia, medida sobre los propios archivos `.glb`:

| | Código (`BabylonViewer.jsx`) | Real (`config/ur5e/default_kinematics.yaml`) | Error |
|---|---|---|---|
| Altura del hombro | `d1 = 0.089159` | `z = 0.1625` | **73 mm** |
| Codo | `y = +0.425` | `x = −0.425` | eje equivocado |
| Muñeca 2 | `−0.093` | `y = −0.0997` | 6.7 mm |
| Muñeca 3 | `0.09465` | `y = 0.0996` | 5 mm |

`base.glb` mide 0.0991 m de alto y el código sitúa el hombro a 0.089 m: el hombro queda
**dentro** de la base, algo geométricamente imposible. Con el valor real (0.1625) la base
del hombro cae en 0.0986 m, justo sobre la tapa de la base.

Las mallas salieron de `cirta_simulation/ros2_pkgs/robot_description/meshes/arms/ur5e/visual/*.dae`
y se guardaron en una carpeta llamada `ur5/`. Ese nombre de carpeta es el origen del error.

### Por qué no basta con corregir los números

Hay cuatro defectos apilados, y solo el primero es de valores:

1. **Robot equivocado**: constantes de UR5 con mallas de UR5e.
2. **Se ignoran las rotaciones `rpy` de las juntas.** `default_kinematics.yaml` define
   `roll: 1.570796327` en `upper_arm`, `wrist_2` y `wrist_3`. El visor solo copia
   traslaciones y elige el eje de giro a mano (`metadata.axis`).
3. **Se ignoran los `<origin>` de cada `<visual>`.** En `ur_macro.xacro:159` el visual de
   `wrist_1` tiene su propio `rpy="π/2 0 0"`. El visor aplica una única rotación global
   (`ROS_FIX`) a todas las mallas.
4. **El gripper Robotiq 85 es un cuadrilátero articulado** (juntas `mimic`, lazo cerrado).
   El visor corta el lazo parentando `finger_tip` al `inner_knuckle`, por lo que los dedos
   se separan al cerrar.

Los números mágicos presentes en el archivo (`- 0.032` en `j5`, `+ 0.020` en `TOOL0_OFFSET`)
son intentos de compensar 1–3. Por eso el ajuste manual no converge: cada parche exige otro.

### La causa de fondo

El robot está descrito **dos veces**: en `cirta_simulation` (correcta, la que usa PyBullet)
y copiada a mano en `BabylonViewer.jsx` (incorrecta). El defecto no es que alguien se
equivocara al copiar, sino que **existe una segunda copia donde equivocarse**, y las dos
divergieron sin que nadie lo notara.

### Por qué ahora

CIRTA quiere incorporar robots nuevos y ese trabajo quedó **pausado** justamente porque el
actual está mal. El repo ya describe cuatro: `ur5e`, `ur10e`, `pupi` (9 juntas + gripper) y
`bluerov2`. Con el enfoque actual, cada robot nuevo son 400 líneas transcritas a mano y una
nueva oportunidad de enseñar medidas falsas. Además existen calibraciones de brazos físicos
reales (`kinematics_unagi.yaml`, `kinematics_uni.yaml`) que hoy la web no puede aprovechar.

## What Changes

Un **spike en rama aparte** (`spike/urdf-viewer`), sin tocar producción, que reemplaza la
transcripción manual por la carga del URDF: la misma descripción que ya usa ROS.

### Alcance del spike
- Exportación única y offline de `ur5e_robotiq2f85.xacro` → `.urdf` plano, versionado junto
  a sus mallas en `public/robots/ur5e/`.
- Visor nuevo que carga ese URDF y aplica los ángulos que ya llegan por WebSocket. Cero
  constantes cinemáticas en el código.
- **Convivencia**: el visor actual sigue siendo el predeterminado. El nuevo se activa con
  `?viewer=urdf`, para poder mostrarlos lado a lado con el mismo robot antes de decidir.
- Verificación numérica: un test que compara las posiciones de las juntas contra los valores
  del YAML, de modo que "las piezas calzan" deje de ser un juicio visual.

### Motor
Se usa **Three.js + `urdf-loader`**. La alternativa de quedarse en Babylon se evaluó y se
descartó con datos: el único puente a URDF para Babylon es `babylon-urdf-loader` 0.1.4, sin
cambios desde septiembre de 2024 y con 23 descargas semanales, frente a `urdf-loader` 0.13.1
(julio de 2026, 54.689 descargas semanales, origen NASA JPL). Se verificó que `urdf-loader`
soporta juntas `mimic`, límites y tipos de junta — justo lo que el Robotiq 85 necesita.

La decisión de fondo no es el motor sino **leer la descripción en vez de copiarla**; el motor
es consecuencia de que solo uno de los dos tiene una vía mantenida para hacerlo.

### Fuera de alcance (deliberadamente)
- Cambiar el visor por defecto en producción. Esto es un spike: se muestra y se decide.
- Mejoras estéticas (PBR, HDRI, sombras de contacto). Se anotan pero no se mezclan: primero
  que el robot sea correcto, después que se vea mejor.
- Los otros tres robots. El spike prueba que el camino sirve con uno; incorporarlos es el
  trabajo que este change desbloquea.
- El límite de concurrencia del simulador (ver Riesgos).

## Capabilities

### New Capabilities
- `simulator-viewer`: renderizado del robot a partir de su descripción URDF, con una única
  fuente de verdad compartida con ROS.

## Impact

**Frontend:** un visor nuevo conviviendo con el actual; dependencias `three` + `urdf-loader`;
assets del robot en `public/robots/`.
**Backend:** ninguno. Los ángulos ya llegan por WebSocket y el visor es solo un renderizador.
**Producción:** ninguno mientras el spike no se apruebe.

## Riesgo

Bajo: vive en una rama, detrás de un parámetro, y el visor actual no se toca.

Riesgos concretos: (1) que `urdf-loader` no resuelva bien el lazo cerrado del gripper —
se mide temprano, en la tarea 3.2, antes de invertir en lo demás; (2) que el tamaño del
bundle no mejore como se espera — se mide, no se asume; (3) que la exportación de xacro
requiera ROS instalado — mitigado exportando una vez y versionando el `.urdf` resultante.

## Hallazgo relacionado (no es parte de este change)

`SIM_MAX_CONCURRENT = 3` sobre una **única máquina Fly compartida** (`FLY_MACHINE_ID` fijo):
el simulador admite tres estudiantes simultáneos. En un curso de 30 eso es un problema mayor
que la geometría, y es de arquitectura, no un bug. Se documenta aquí porque conviene decidirlo
antes del piloto, pero se resuelve en un change propio.
