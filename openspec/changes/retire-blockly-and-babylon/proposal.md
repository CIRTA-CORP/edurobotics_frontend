# Retirar Blockly y Babylon

## Why

Dos piezas del simulador siguen en el proyecto sin entregar nada:

**Blockly** está apagado por el flag `"blockly?": false` desde que su ejecución
no funcionaba (issue #21). El código se conservó para poder reactivarlo, pero la
reactivación nunca llegó y el coste sigue ahí: importado de forma estática, sus
**787 kB (205 kB gzip)** se descargan en toda visita a `/simulator` aunque la
pestaña no se muestre nunca. Diferirlo con `lazy()` se intentó y rompe: Monaco
instala un cargador AMD y el envoltorio UMD de Blockly choca con él.

**Babylon** es el visor anterior. El visor URDF lo sustituyó, es el que se
renderiza por defecto y la landing entera se reescribió alrededor de él, pero
Babylon seguía disponible tras `?viewer=babylon` y pesa **1.430 kB gzip**.

Mario decide: el visor URDF se adopta formalmente y **los dos se retiran**.

## What Changes

**Blockly se borra**, no se apaga: `BlocklyPanel.jsx`, `Blockly.css`, la carpeta
`editors/blockly/` (bloques, toolbox, startup), el flag, la pestaña, el estado y
los manejadores en `LeftPanel.jsx`, y las tres dependencias
(`blockly`, `react-blockly`, `@blockly/theme-dark`).

**Babylon se borra**: `BabylonViewer.jsx`, la rama `?viewer=babylon` y el
selector `useLegacyViewer` de `SimulatorPanel.jsx`, y las dos dependencias
(`@babylonjs/core`, `@babylonjs/loaders`).

**`RobotComparePage` se va con ellos.** Su única razón de ser era enseñar los dos
visores lado a lado para decidir cuál adoptar. Tomada la decisión, la página
compara algo contra nada.

Los dos grupos de `manualChunks` en `vite.config.js` desaparecen, y los
comentarios que citan «el visor anterior de Babylon» se corrigen.

## Capabilities

**Modified**
- `simulator` — un solo editor y un solo visor.
- `performance` — lo que no se entrega no se descarga.

## Impact

**Frontend**
- Se borran 10 ficheros (8 de Blockly, `BabylonViewer.jsx`, `RobotComparePage.jsx`).
- `src/features/simulator/components/LeftPanel.jsx` — fuera pestaña, flag y estado.
- `src/features/simulator/components/SimulatorPanel.jsx` — fuera la rama legacy.
- `src/App.jsx` — fuera la ruta `/robot-compare`.
- `src/features/simulator/viewer/{jointNames,UrdfViewer}.jsx` — comentarios.
- `package.json` — cinco dependencias menos.
- `vite.config.js` — dos grupos de chunks menos.

**Backend** — sin cambios.

**Ahorro esperado**: ~1.635 kB gzip fuera del grafo de `/simulator`.
