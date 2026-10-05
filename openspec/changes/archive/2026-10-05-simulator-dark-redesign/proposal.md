## Why

El simulador es la única pantalla oscura de la plataforma y hoy conviven **cuatro oscuros
distintos**: slate en la página, grises de VS Code en el editor, casi negro en la terminal y
gray-900 en las juntas. Además hay ruido heredado: degradado azul en la cabecera, separador
azul de 10 px, blobs animados detrás de la pantalla de inicio, dos botones "Detener" en rojo
que se confunden (cortar programa vs apagar servidor), y un botón morado sin uso.

El canvas `SimuladorInicio`, `Simulador` y `SimuladorPiezas` define una **única escala de
grises construida desde el negro de marca** (#0a0a0c), el acento en su versión clara
(#7d79e3 / #a5a1ee), y dónde vive cada control.

## What Changes (solo estético — no toca visores ni lógica de ejecución)

- **Paleta única** (escala completa en `SimuladorPiezas`): lienzo #0a0a0c, terminal #0d0d10,
  panel #131316, elevado #1a1a1f, cabecera #0f0f12; filetes #1c1c22/#23232a/#2c2c34,
  contorno #33333c; texto #f4f4f6 → #3f3f48; acento #7d79e3/#a5a1ee; ejecutar #10b981,
  éxito #6ee7b7, error #f08099, aviso #fbbf24.
- **`SimulatorPage`**: cabecera sin degradado (52 px, #0f0f12) con «Volver al curso», marca,
  «UR5 · ROS 2» y pill BETA; pill de estado del servidor + «Detener servidor» (no rojo) y
  avatar. Pantallas «lleno» y «solo escritorio» con la banda de marca (ilustración, serif,
  botón blanco).
- **`SimulatorPanel`**: fuera los blobs azules (fondo de puntos con máscara + resplandor);
  pantallas de inicio y «levantando» rediseñadas (ilustración del brazo, pasos con estados);
  controles del visor en pill translúcida con blur (cámaras con iconos SVG, home, juntas);
  badge de estado del visor arriba a la izquierda. «Detener servidor» sube a la cabecera.
- **`Ide`**: separador de 10 px azul → filete de 5 px con tirador (#3a3a44).
- **`CodeButtons`**: Ejecutar (verde, texto oscuro) y Detener (contorno, rosa al correr) en
  una barra junto a las pestañas; iconos de descargar/subir/ocultar silenciosos.
- **`LeftPanel`**: las pestañas suben del pie a la barra superior (Editor/Guía; Bloques sigue
  oculto — decisión de retirarlo aparte).
- **`Terminal`**: misma clasificación de líneas con la paleta nueva; hora en #3f3f48;
  cabecera con «Salida», badge de estado y tiempo.
- **`JointSliders`**: grados y radianes juntos, vista previa del `robot.move_joints({…})`
  antes de copiar, botón blanco «Copiar al editor».
- **`Panel`**: se borra el botón morado sin uso (`PanelButton`).

## Non-Goals

- NO se toca `BabylonViewer`/`UrdfViewer` ni la decisión URDF (change aparte, otra IA).
- NO se toca Blockly ni su lógica (su retiro es decisión aparte).
- NO se cambia comportamiento de start/stop/polling ni los endpoints.
- TCP en coordenadas reales: requiere cinemática directa en el visor; queda diferido.

## Capabilities

### New Capabilities
- `simulator-shell`: sistema visual oscuro único para la sección del simulador.

## Impact

Frontend únicamente: 8 archivos de `features/simulator/`. Sin backend, sin dependencias.

## Riesgo

Bajo: solo clases y composición de JSX; la lógica (WS, polling, sliders) queda intacta.
