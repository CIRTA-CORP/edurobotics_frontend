# Editor, terminal y guía del simulador

## Why

La directora pide un código inicial que muestre bien el robot, una guía profesional de la
librería y un editor y una terminal fluidos y bonitos, al nivel de playgrounds como
codi.link.

Al revisar la pantalla aparecieron además defectos concretos:

- **«Copiar al editor» rompe el programa.** Reemplaza el editor entero por una sola línea
  `robot.move_joints(...)`, sin `from robot_api import Robot` ni `robot = Robot()`: al
  ejecutarla da `NameError`, y lo que el alumno había escrito se pierde.
- **Los deslizadores y el botón «Posición de inicio» solo mueven la vista**, pero parecen
  órdenes al robot. El visor queda mostrando una pose que no es la real, y al ejecutar
  parece que el robot «salta». Fue lo que hizo creer que el movimiento era instantáneo.
- **La guía tiene errores**: habla de una librería `robot_interface` que no es la que se
  usa, dice que la salida aparece «en tiempo real» (llega al terminar) y su ejemplo pone el
  hombro por debajo de la horizontal.
- **La terminal mezcla idiomas** («Connecting...», «Done.», «Execution time», «Animation:
  15 frames») y colorea según mensajes que ya no existen («CMD written», «[robot_api]»).
- **El botón Descargar no hace nada** (`handleDownload={() => {}}`).
- **El diagnóstico de mallas** sigue en pantalla en la rama que se estaba probando; el
  arreglo estaba en otra rama.

## What Changes

- **Código inicial**: un programa de demostración, verificado en la máquina real, que
  recorre posturas, gira la muñeca, abre y cierra la pinza y vuelve. Empiece donde empiece
  el brazo, siempre se ve movimiento.
- **Guía nueva**: cómo funciona una ejecución, la referencia completa de `robot_api`, las
  articulaciones con sus rangos, recetas, límites del simulador y errores frecuentes. Cada
  ejemplo, probado en la máquina.
- **Editor**: tema propio con la paleta del simulador, menos adorno, desplazamiento suave,
  `Ctrl+Enter` para ejecutar. Letra Cascadia Code en el código (editor, terminal y
  guía), a pedido de Mario; el resto de la página conserva su tipografía.
- **Terminal**: filas con etiqueta por tipo (salida, aviso, parada, error), errores con
  fondo teñido, todo en español.
- **«Añadir al editor»**: agrega el movimiento al final del programa y completa la
  cabecera si falta. No borra nada y se deshace con `Ctrl+Z`.
- **Deslizadores**: marcados como vista previa. Se quita el botón «Posición de inicio».
- **Descargar** guarda el programa como `programa.py`. **Subir** se puede deshacer.
- **Ejemplos de la guía**: «Abrir en el editor», que se deshace con `Ctrl+Z`.

## Capabilities

**Modified**
- `simulator` — editor, terminal, guía y vista previa de posturas.

## Impact

Solo frontend: `LeftPanel`, `EditorPanel`, `Terminal`, `CodeButtons`,
`DocumentationPanel`, `JointSliders`, `SimulatorPanel`, y `lib/` nuevo (`terminalLines`,
`editorCode`, `codeFont`). Dependencia nueva: `@fontsource/cascadia-code` 5.3.0 (OFL-1.1,
sin dependencias propias).

Rama `feature/6-simulator-editor-redesign`, creada juntando `feature/3`, `feature/4` y
`feature/5`, para que todo se pruebe sobre el conjunto que va a salir.
