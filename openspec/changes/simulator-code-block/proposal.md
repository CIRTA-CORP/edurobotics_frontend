# Código de la clase en el simulador

## Why

La directora quiere que el código que el profesor escribe en una clase le
aparezca al alumno en el simulador, en vez de la plantilla fija.

Hoy no hay ninguna conexión entre las dos cosas:

- El simulador arranca con lo último que el alumno escribió **en cualquier
  clase** —hay una sola clave, `code_python_env`, para todo— o con una plantilla
  fija. No sabe de qué clase viene.
- El bloque «Simulador 3D» de una unidad solo guarda una descripción. No lleva
  código.

Dos datos de producción condicionan cómo hacerlo:

**El código que hay hoy en las clases no es para ejecutar.** De las 62 unidades,
8 tienen bloques de código: 15 en total. Ninguno es un programa. Hay un URDF en
XML (`<robot name="robot">`), lecturas de sensores de ejemplo
(`LiDAR: [0.52, 0.48, …]`) y pseudocódigo
(`Error = Altura deseada - Altura actual`). Ninguno guarda lenguaje, porque la
barra del editor no tiene selector. Si el simulador tomara el código de la clase
de forma automática, al alumno le aparecería un XML y al pulsar Ejecutar
recibiría un error de sintaxis. **El profesor tiene que decir cuál código va al
simulador.**

**Hoy ningún alumno puede llegar al simulador.** Ninguna de las 62 unidades tiene
el bloque «Simulador 3D», y `/simulator` solo deja entrar a un alumno que viene
desde ese bloque. Solo entran los admins.

## What Changes

**Un tipo nuevo de bloque en el editor: «Código para el simulador».** El profesor
lo inserta desde la barra de herramientas. Se ve distinto a un bloque de código
normal, para que se sepa cuál va al simulador. Puede haber varios en una clase.
Los bloques de código normales no cambian.

**En la clase, cada uno de esos bloques lleva un botón «Probar en el
simulador».** Al pulsarlo, el simulador se abre con ese código en el editor.

**El trabajo del alumno se guarda por ejercicio.** Si vuelve, encuentra su
versión, no la original. Un botón «Restablecer el código de la clase» le devuelve
la del profesor. Esto arregla además la clave única de hoy, que mezcla lo escrito
en una clase con lo de otra.

**Ese botón también da acceso al simulador**, igual que el bloque «Simulador 3D».
Es la primera puerta que tendrían los alumnos desde un curso.

## Capabilities

**Modified**
- `simulator` — arranca con el código de la clase de la que viene el alumno.
- `content` — el editor tiene un bloque de código marcado para el simulador.

## Impact

Solo frontend. El bloque se guarda dentro del HTML de la clase, como un atributo
del bloque de código. No hay migración ni endpoint nuevo.

- `src/features/admin/features/content/RichTextEditor.jsx` — el bloque y su botón
- `src/features/courses/components/ContentViewer.jsx` — el botón del alumno
- `src/features/simulator/components/LeftPanel.jsx` — el código inicial y su
  guardado por ejercicio
- `src/index.css` — cómo se distingue el bloque
