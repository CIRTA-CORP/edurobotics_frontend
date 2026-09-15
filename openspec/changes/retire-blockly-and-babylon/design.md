# Design — Retirar Blockly y Babylon

## Context

Las dos piezas llevaban tiempo en un limbo: presentes en el bundle, ausentes del
producto. Cada una se conservaba por una razón razonable en su momento —Blockly
por si volvía, Babylon por poder comparar— y las dos razones caducaron.

## Goals

- Que el simulador tenga un editor y un visor, no dos de cada.
- Que `/simulator` deje de descargar ~1.635 kB gzip que nadie usa.
- Dejar registrada la adopción del visor URDF, que hasta ahora era un hecho
  consumado sin decisión escrita.

## Non-Goals

- **No** se toca la cinemática ni el comportamiento del visor URDF. Esto retira
  lo viejo; no cambia lo que se queda.
- **No** se aborda el aislamiento del simulador ni la reproducción diferida de la
  animación. Siguen pendientes y tienen su propio sitio.
- **No** se retira `three.js` ni `urdf-loader`: son el visor que se queda.

## Decisions

### 1. Se borra, no se desactiva

La alternativa era dejar el código y quitar solo las dependencias, o mantener el
flag. Se descarta: el flag ya demostró que un apagado no evita el coste ni la
confusión —la documentación del simulador siguió explicando la pestaña Bloques
durante meses, y la landing la siguió prometiendo.

El historial de git conserva el código. Si Blockly vuelve algún día, volverá
sobre un Tiptap y un Monaco distintos de los de hoy, así que recuperarlo del
historial no será peor que mantenerlo muerto.

### 2. `RobotComparePage` se va

Es la página que enseñaba ambos visores lado a lado para decidir. Con la decisión
tomada, muestra el visor nuevo contra un hueco. Mantenerla obligaría a conservar
Babylon solo para ella, que es exactamente lo que este change retira.

### 3. El orden importa: primero el código, luego las dependencias

Si se desinstalan los paquetes antes de quitar los imports, el proyecto queda sin
compilar y cualquier error posterior se confunde con el desmontaje. Se retiran
primero las referencias, se comprueba que compila, y solo entonces se
desinstalan los paquetes.

### 4. Verificación: que el simulador siga funcionando de verdad

Quitar un visor y un editor de un panel con pestañas puede dejar estado muerto
—una pestaña guardada en `localStorage` que ya no existe, por ejemplo. El panel
ya contempla ese caso para Blockly (`stored === BLOCKLY ? EDITOR : stored`), y esa
guarda debe permanecer hasta que no queden usuarios con esa preferencia guardada,
aunque la pestaña ya no exista.
