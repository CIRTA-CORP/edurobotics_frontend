# Design — La landing deja de prometer bloques

## Context

Retirar una función del producto deja rastros en tres capas distintas, y las tres
están hoy desalineadas con lo que el simulador hace:

1. **Marketing** — la landing, que promete bloques.
2. **Ayuda en producto** — la documentación del simulador, que explica cómo usar
   una pestaña inexistente.
3. **Entrega** — el bundle, que sigue enviando la librería de la función apagada.

La primera es copy. La segunda es un bug que ve el alumno. La tercera es peso
muerto medible.

## Goals

- Que ningún texto de cara al usuario prometa programación por bloques.
- Sustituir el gancho del hero por uno igual de concreto, sin inventar nada.
- Que el código que se muestra sea el que de verdad se escribe.
- Que la función apagada no cueste ancho de banda.

## Non-Goals

- **No** se borra Blockly. Ni el código, ni las dependencias, ni el flag. La
  decisión de conservarlo para reactivarlo se respeta tal cual; esto solo deja de
  anunciarlo y de descargarlo.
- **No** se rediseña la landing. Cambian textos, dos tarjetas y el contenido de
  un panel; la estructura de secciones, la paleta y la tipografía se quedan.
- **No** se toca el contenido que la directora ya haya guardado desde el admin
  (ver Decisión 4).
- **No** se añade el UR10e al discurso, aunque ya esté dibujado: sigue retirado a
  la espera de aprobación de CIRTA.
- **No** se arregla el aislamiento del simulador ni `/stop` abierto a cualquier
  estudiante. Es P2 y tiene su propio change.

## Decisions

### 1. El mockup pasa a `Código / Salida`

Se conserva el conmutador de dos pestañas —es lo que hace que el hero no sea una
captura muerta— pero las dos vistas pasan a ser las dos mitades reales del ciclo
de trabajo: escribes Python, lo ejecutas, lees la salida.

Es además más fiel que el par anterior: bloques y código eran dos formas
alternativas de hacer lo mismo, mientras que código y salida son dos momentos del
mismo flujo, que es como se usa el simulador.

### 2. El código del mockup es el API real

Hoy el mockup muestra `robot.move_j(90, -45)`, que **no existe**. El API real,
según `simulation/robot_api.py`:

```python
from robot_api import Robot

robot = Robot()
robot.move_joints({"shoulder_pan_joint": 0.5}, duration=2.0)
```

Si el argumento de venta pasa a ser «Python real», enseñar una API inventada lo
desmonta en cuanto alguien entra al simulador. El snippet del mockup pasa a ser
código que de verdad corre.

Consecuencia de formato: `move_joints({...}, duration=...)` es bastante más largo
que `move_j(90, -45)`, y la columna izquierda del mockup mide 170–200 px. Hay que
ensancharla; el ajuste exacto se hace mirándolo en el navegador, no a ojo.

La vista de salida refleja lo que imprime de verdad esa ejecución: las líneas
`[robot_api]` del propio `robot_api.py` y el cierre del backend (`Done.` y el
número de frames de animación).

### 3. La estadística pasa a «1 mm»

`2 · Modos: bloques y código` deja de ser cierta. Se reemplaza por
**`1 mm · Precisión frente al robot real`**, que es el dato más fuerte que hay y
que hoy no aparece en ninguna parte de la landing.

Es verificable: `scripts/verify-robot-kinematics.py` compara el visor con ROS y
falla si la desviación supera el umbral. No es una cifra de marketing.

### 4. Los defaults cambian; el contenido guardado NO se migra

`landingContent.js` son **valores por defecto**. `mergeLandingContent()` combina
lo guardado en `landing_content` encima de ellos, así que si la directora ya editó
el subtítulo del hero o las FAQ, seguirá viéndose su texto con «bloques» dentro.

Se opta deliberadamente por **no** escribir en la base de datos para corregirlo:
sobrescribir contenido que una persona editó a mano es peor que el problema que
resuelve. En su lugar, las tareas incluyen comprobar desde el admin si esas dos
secciones tienen contenido guardado y, si lo tienen, avisar para que se editen
desde ahí — que es el sitio donde la directora espera cambiarlo.

### 5. Blockly se difiere, no se borra

`BlocklyPanel` pasa a `lazy()`, igual que se hizo con `BabylonViewer`. El flag
`"blockly?"` sigue mandando: con `false` no se descarga nada, y poniéndolo en
`true` el panel carga bajo demanda y todo sigue funcionando.

Es el mismo patrón y la misma verificación: mirar en el build quién importa el
chunk de forma estática.

### 6. La documentación describe lo que existe

Los pasos 2 y 3 de `DocumentationPanel` se reescriben para el flujo de editor
único. Se mantiene la mención a `robot_interface`, que sí está disponible.

El paso 2 deja de ser «elige cómo programar» (ya no hay elección) y pasa a
presentar el editor y dónde ver la salida.
