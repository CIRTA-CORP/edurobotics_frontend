# Tasks — Retirar Blockly y Babylon

El orden no es negociable: primero las referencias, luego las dependencias. Al
revés, el proyecto deja de compilar y cualquier error se confunde con el
desmontaje (`design.md` §3).

## 1. Blockly fuera del código

- [x] 1.1 `LeftPanel.jsx`: quitar el import, el flag `"blockly?"`, la constante
      `BLOCKLY` donde ya no aplique, la pestaña, el panel y `handleBlocklyChange`.
- [x] 1.2 **Conservar** la guarda que redirige una pestaña guardada `blockly` a
      `EDITOR`: hay usuarios con esa preferencia en `localStorage` (`design.md` §4).
- [x] 1.3 Simplificar `handleRun`, que hoy elige entre el código de bloques y el
      del editor.
- [x] 1.4 Borrar `editors/BlocklyPanel.jsx`, `editors/Blockly.css` y la carpeta
      `editors/blockly/` entera.
- [x] 1.5 Retirar el icono `Puzzle` si queda sin uso.

## 2. Babylon fuera del código

- [x] 2.1 `SimulatorPanel.jsx`: quitar el import diferido, `useLegacyViewer` y la
      rama `?viewer=babylon`; dejar el visor URDF como único.
- [x] 2.2 Borrar `viewer/BabylonViewer.jsx`.
- [x] 2.3 Borrar `pages/RobotComparePage.jsx` y su ruta en `App.jsx`.
- [x] 2.4 Corregir los comentarios que citan Babylon en `jointNames.js` y
      `UrdfViewer.jsx`.

## 3. Comprobar antes de desinstalar

- [x] 3.1 `npm run build` verde **con las dependencias todavía instaladas**.
- [x] 3.2 Confirmar que ni `blockly` ni `@babylonjs` aparecen ya en el build.

## 4. Fuera las dependencias

- [x] 4.1 `npm uninstall blockly react-blockly @blockly/theme-dark @babylonjs/core @babylonjs/loaders`.
- [x] 4.2 Quitar los grupos `vendor-blockly` y `vendor-babylon` de `manualChunks`.
- [x] 4.3 `npm run build` y `npm run lint` verdes.
- [x] 4.4 Medir el ahorro real en el build y anotarlo.
      **~1.635 kB gzip fuera**: `vendor-babylon` (1.430 kB) y `vendor-blockly`
      (205 kB) ya no existen. El mayor chunk pasa a ser `UrdfViewer` con 184,67 kB.
      El build baja de ~25 s a 7,2 s y el lint de 45 a 44 errores.

## 5. Verificación

- [x] 5.1 Abrir `/simulator`: el editor carga, la pestaña Bloques no existe, el
      visor URDF renderiza el UR5e.
- [x] 5.2 Confirmar en la red que no se descarga ningún chunk de Blockly ni de
      Babylon.
- [x] 5.3 Comprobar que `?viewer=babylon` ya no hace nada raro (cae al visor único).
- [x] 5.4 Con `panelSelected` guardado como `blockly` en `localStorage`, la app
      abre en el editor y no en blanco.
- [x] 5.5 Incorporar los deltas a `specs/` y archivar el change.
