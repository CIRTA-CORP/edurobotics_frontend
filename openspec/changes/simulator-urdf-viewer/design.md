# Diseño — Visor del simulador basado en URDF

## Contexto

El visor actual (`src/features/simulator/viewer/BabylonViewer.jsx`, 416 líneas) transcribe a
mano la cadena cinemática del robot: constantes en metros, elección de eje por junta y
correcciones ajustadas a ojo. La física **no** está aquí: el backend manda `joint_angles` por
WebSocket (`LeftPanel.jsx:185`) desde PyBullet, y el visor solo dibuja. Por eso todo el
defecto vive en la capa de render, en un único archivo, y Babylon no se usa en ninguna otra
parte de la aplicación.

## Decisión 1 — Cargar el URDF en vez de transcribirlo

**Se descarta** seguir corrigiendo constantes. Aunque se arreglaran los cuatro defectos hoy,
el problema estructural persiste: cada robot nuevo vuelve a ser una transcripción manual, y
la web y ROS pueden volver a divergir sin que nada lo detecte. Ya ocurrió.

**Se adopta** cargar el `.urdf` exportado del mismo `robot_description` que usa ROS. El
código deja de contener medidas: si el robot cambia, cambia su archivo.

## Decisión 2 — Three.js + `urdf-loader`, no Babylon

Evaluado con datos, no por preferencia:

| | `babylon-urdf-loader` | `urdf-loader` (Three.js) |
|---|---|---|
| Versión | 0.1.4 | 0.13.1 |
| Última publicación | septiembre 2024 | julio 2026 |
| Descargas semanales | 23 | 54.689 |
| Mantención | un autor | gkjohnson, origen NASA JPL, 813 ★ |

Quedarse en Babylon obliga a una de dos: depender de un paquete 0.1.x sin cambios en dos
años, o escribir el parser de URDF nosotros — precisamente la clase de trabajo manual que
produjo el defecto actual. Se verificó en la API de `urdf-loader` que soporta juntas `mimic`,
`limit`, `jointType` e `ignoreLimits`, que es lo que el Robotiq 85 exige.

**Costo asumido y declarado**: es una dependencia nueva y hay que portar la cámara y el
suavizado. Ambos son matemáticas independientes del motor (interpolación exponencial y
`ArcRotateCamera` → `OrbitControls`), así que se trasladan casi literalmente.

**Lo que NO se afirma**: que Three.js "se vea mejor" que Babylon. No es cierto — lo que hoy
hace que la escena se vea pobre son los materiales (`StandardMaterial`) y la iluminación
(`HemisphericLight` + grilla de líneas), no el motor. Ambos motores admiten PBR e iluminación
por imagen. Eso queda fuera de este change a propósito, para no mezclar corrección con
estética y poder atribuir el resultado.

## Decisión 3 — Exportar el xacro una vez, offline

Los archivos fuente son `.xacro` con expresiones `${}` y parámetros en YAML; resolverlos en
el navegador exigiría `xacro-parser` en tiempo de ejecución.

Se exporta **una vez** con la herramienta `xacro` (dentro del contenedor Docker que el repo
`cirta_simulation` ya provee) y se versiona el `.urdf` plano resultante junto a sus mallas.
Ventajas: el navegador no parsea xacro, el resultado es auditable en el diff, y no se añade
una dependencia de runtime. El costo es que regenerar tras un cambio en ROS es un paso
manual — aceptable, porque la cinemática de un robot cambia muy rara vez, y el test de la
tarea 4.1 detecta la divergencia si ocurre.

Las mallas se convierten de `.dae` a `.glb` como ya se hace hoy, manteniendo la ruta relativa
que el `.urdf` declara.

## Decisión 4 — Convivencia, no reemplazo

El visor nuevo se monta bajo `?viewer=urdf`; sin el parámetro sigue el actual. Motivos:

- Permite mostrar ambos **lado a lado con el mismo robot**, que es la forma honesta de
  decidir y de presentar el resultado.
- Producción no corre riesgo mientras la decisión no esté tomada.
- Si el spike se descarta, se borra la rama y no queda deuda.

La selección se hace en `SimulatorPanel.jsx`, que ya recibe `jointAngles` y es el único punto
que monta el visor. Ambos visores comparten la misma interfaz (`{ jointAngles, cameraView }`),
de modo que el intercambio no toca nada aguas arriba.

## Decisión 5 — Verificar con números, no con la vista

"Las piezas calzan" no puede seguir siendo un juicio visual: así se llegó hasta aquí. El
spike incluye un test que carga el URDF, fija una pose conocida y compara la posición mundial
de cada junta contra la esperada según `default_kinematics.yaml`, con tolerancia de 1 mm.

Ese test es el que habría detectado el defecto original: con `d1 = 0.089159` contra el
`0.1625` del YAML, falla por 73 mm.

## Alternativas consideradas y descartadas

- **Corregir las constantes a los valores del UR5e.** Arregla el síntoma visible más grave
  y nada más: quedan los `rpy` ignorados, los `<visual origin>` ignorados y el lazo del
  gripper cortado; y el robot sigue descrito dos veces. Es la opción barata que garantiza
  repetir el problema con el robot siguiente.
- **Babylon + parser propio de URDF.** Evita la dependencia nueva y el cambio de motor —una
  ventaja real, porque no exige explicar un cambio de tecnología—, pero traslada a CIRTA el
  mantenimiento de un parser, incluidos el orden de composición de `rpy` y las juntas
  `mimic`, que es la parte delicada.
- **Física en el navegador (MuJoCo WASM).** Resolvería de raíz el límite de tres estudiantes
  simultáneos, pero hoy está en alpha y no es apuesta para un piloto escolar. Se menciona
  porque un motor de física en el navegador **también** consume URDF: este change es
  prerrequisito de ese camino, se tome o no.

## Riesgos y mitigación

| Riesgo | Mitigación |
|---|---|
| `urdf-loader` no resuelve bien el lazo cerrado del gripper | Se prueba en la tarea 3.2, temprano y aislado, antes de invertir en el resto |
| El bundle no mejora lo esperado | Se mide antes y después (hoy: 6.59 MB / 1.43 MB gzip) y se reporta el número real |
| La exportación de xacro exige ROS | Se hace una vez en el Docker del repo y se versiona el `.urdf` |
| El robot físico está calibrado y difiere del nominal | Existen `kinematics_unagi.yaml` y `kinematics_uni.yaml`; se decide cuál usar en la tarea 1.2 |
