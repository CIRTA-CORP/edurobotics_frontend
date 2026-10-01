# Design — Editor, terminal y guía del simulador

## Goals

- Que lo primero que vea un alumno sea el robot moviéndose bien.
- Que la guía sea la referencia de la librería, sin un solo dato falso.
- Que ningún control parezca hacer algo que no hace.
- Editor y terminal a la altura de un playground actual.

## Non-Goals

- **No** se cambia la tipografía de la página. La única excepción, pedida por Mario, es la
  letra del código (editor, terminal y bloques de la guía): ver la decisión 7.
- **No** se añade autocompletado de `robot_api` ni análisis de código.
- **No** se hace la ejecución en vivo: la API de Fly es de tanda (ver
  `ur5e-motion-correctness`).
- **No** se cambia el backend. Los mensajes en inglés que manda se traducen en el
  frontend, para que funcione igual con el backend de producción actual.

## Decisions

### 1. El código inicial es un recorrido verificado

Empieza poniendo el brazo vertical: así siempre hay movimiento, venga de donde venga. El
programa anterior iba a todo cero; si el brazo ya estaba ahí, no pasaba nada, y eso fue
justo lo que confundió.

Gira la muñeca con el brazo arriba. Con el brazo horizontal la herramienta queda a 6 cm
del suelo, y al girar la muñeca los dedos chocan con él (verificado: parada de protección
a ~45°). Dura ~22 s, dentro del límite de 40 s.

### 2. La guía es una referencia, no un tutorial de pasos

Lo que necesita un alumno al escribir es saber qué hace cada función, qué recibe, qué
devuelve y qué puede fallar. Se organiza como documentación de una librería:

1. Cómo funciona una ejecución (primero se ejecuta, después se ve).
2. Primer programa.
3. Referencia de `robot_api`: cada función con parámetros, comportamiento y errores.
4. Las articulaciones: qué mueve cada una y su rango.
5. Recetas: secuencias, bucles, movimiento relativo, la pinza.
6. Límites del simulador.
7. Errores frecuentes y qué significan.
8. Vista previa de posturas.

**Cada ejemplo se ejecuta en la máquina antes de publicarse.** El ejemplo anterior ponía
el hombro bajo la horizontal; un dato de la guía que no se comprobó es un error que el
alumno no puede distinguir de uno suyo.

El código se colorea con el mismo coloreado de Monaco que el editor, para que se vea igual
en los dos sitios. Cada bloque tiene «Copiar».

### 3. El editor: poco adorno, tema propio

Tomado de codi.link: sin minimapa, sin margen de iconos, relleno arriba y abajo, sin
desplazamiento más allá del final, desplazamiento suave y cursor animado. Más:

- Un **tema propio** con la paleta del simulador (`#0d0d10`, acento `#7d79e3`), en vez de
  `vs-dark`, que desentona con el resto de la pantalla.
- **Ajuste de línea**: los diccionarios de `move_joints` son largos.
- **Sangría de 4** espacios: es Python.
- **`Ctrl+Enter` / `Cmd+Enter`** ejecuta, como en cualquier playground.

### 4. La terminal clasifica por tipo, no por texto suelto

Cada línea es una fila con una etiqueta: `SALIDA` (lo que imprime el programa), `AVISO`
(`[robot] Aviso`), `PARADA` (parada de protección), `ERROR` (traceback, errores),
`SISTEMA` (conexión, cola, animación). Los errores llevan fondo teñido. Se oculta la
línea `[sim] Simulacion lista. Joints: [...]`, que es ruido técnico.

Los mensajes del backend en inglés se traducen al mostrarse («Done.» → «Programa
terminado»), sin cambiar el backend.

### 5. «Añadir al editor» agrega, no reemplaza

Genera la llamada `move_joints` con los ángulos de los deslizadores y la añade **al final**
del programa. Si falta `from robot_api import Robot`, lo antepone; si falta la instancia,
añade `robot = Robot()`; si el alumno la llamó de otra forma (`r = Robot()`), usa ese
nombre. Se inserta como una edición, así que `Ctrl+Z` la deshace.

### 6. La vista previa se presenta como tal

El panel de deslizadores se titula «Vista previa de posturas» y dice que no mueve el
robot. Al cerrarlo, el visor vuelve a mostrar la pose real. Se quita «Posición de inicio»,
que solo cambiaba la vista pero parecía una orden.

### 7. La letra del código: Cascadia Code

Mario pidió la letra de codi.link para el editor y la terminal. Es **Cascadia Code**
(Microsoft, licencia OFL-1.1), con ligaduras. La excepción se limita al código: el resto de
la página conserva su tipografía.

- Va **empaquetada** con `@fontsource/cascadia-code`, no desde un CDN: la CSP de
  `vercel.json` solo permite fuentes propias (`font-src 'self' data:`).
- Solo los pesos que se usan (400, 400 cursiva para comentarios, 600). Cada hoja trae varios
  alfabetos con `unicode-range`; el navegador baja solo el latino (medido: un archivo por
  peso).
- Monaco mide los caracteres al crearse. Si la fuente llega después, el cursor queda
  desalineado; por eso se espera a `document.fonts.load` y se llama a
  `monaco.editor.remeasureFonts()`.

### 8. Los ejemplos se abren en el editor sin perder nada

Cada receta de la guía tiene «Abrir en el editor». Reemplaza el programa como una edición
(`executeEdits`), no con `setValue`, que vacía el historial: así `Ctrl+Z` recupera lo que
había. «Subir archivo» hacía `setValue` y se cambia por lo mismo.

El foco y el desplazamiento se aplican un fotograma después de cambiar a la pestaña Editor:
en el mismo instante el editor aún está oculto (`display: none`) y el foco se perdía.

### 9. Ningún texto de la pantalla promete algo que no pasa

Revisados contra el código y la configuración:

- La pantalla de arranque mostraba tres pasos **escritos a mano** («Reservando un
  contenedor · 3 s ✓», «Levantando ROS2… · 38 s»): el primero salía siempre hecho y ninguno
  avanzaba. Se sustituye por el tiempo transcurrido real y una barra indeterminada. No se
  pone una barra que avance con el reloj: sería un progreso inventado, porque el backend no
  informa en qué fase va.
- «Te avisamos al terminar»: no había ningún aviso. Ahora, si la pestaña está en segundo
  plano cuando el simulador queda listo, el título de la pestaña lo dice.
- «Se apaga solo cuando sales»: no ocurre (`auto_stop_machines = false` en `fly.toml`, y el
  backend solo apaga por orden de un administrador). Se quita.
- «Tarda entre 40 y 90 s»: sin medición que lo respalde. Se dice lo que fija el código: el
  arranque se da por fallido a los 2 minutos.
- «Ver el brazo moverse en 3D, en el momento»: el movimiento se ve al terminar el programa.
- «Detener» queda desactivado cuando no hay nada ejecutándose.

### 10. Un solo estado del servidor

La cabecera y el panel consultaban el estado cada uno por su cuenta (cada 8 s y cada 5 s) y
podían mostrar cosas distintas. Pasa a un único almacén (`lib/simulatorStatus.js`) con una
sola consulta periódica mientras haya alguien suscrito.

### 11. La terminal se pliega de verdad y se redimensiona

Plegarla ocultaba el contenido pero dejaba el hueco: el editor no crecía. Ahora plegada
ocupa solo su cabecera, el borde entre editor y terminal se arrastra (la altura se recuerda
en el navegador) y al pulsar Ejecutar se despliega sola. Sigue siendo solo de salida: el
programa no puede leer del teclado (`input()`), así que un campo para escribir prometería
algo que no existe.

### 12. Animaciones donde explican algo

Cortas (150–250 ms) y anuladas con `prefers-reduced-motion`: las filas nuevas de la
terminal, el panel de la vista previa al abrirse, el cambio de pestaña, el indicador
«Moviendo / En reposo», y un aviso breve más el resaltado de las líneas añadidas cuando el
código cambia desde fuera del editor («Añadir al editor», un ejemplo, un archivo subido).
El visor 3D no se anima: lo único que se mueve ahí es lo que hizo el robot.
