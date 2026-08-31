# simulator-dark-redesign — sistema visual del simulador

Fuente: canvas `SimuladorPiezas` (paleta), `SimuladorInicio` (pantallas de estado) y
`Simulador` (workspace), exportados en `/Users/mario/Desktop/proyecto/html/Simulador*-html/`.

## 1. Página y cabecera

- [x] 1.1 `SimulatorPage`: cabecera 52px `#0f0f12` sin degradado; «Volver al curso», marca,
      «Simulador · UR5e · ROS 2 · BETA»; pill de estado del servidor + «Detener servidor» +
      avatar.
      Añadido después: **el logo de CIRTA**, que faltaba. Va con `brightness-0 invert`
      porque el SVG es negro y sobre la cabecera oscura no se veía — mismo tratamiento que
      en `AuthLayout` y `StudentHeader`.
      Corregido: decía **UR5** y el robot es un **UR5e**. Es el mismo error de nombre que
      originó el defecto de las piezas mal encajadas, así que conviene no repetirlo.
- [x] 1.2 Pantallas «lleno» y «solo escritorio» con la banda de marca (ilustración del
      brazo, botón blanco, nota mono).
      **Desviación respecto al canvas**: los títulos **no** llevan serif. La regla del
      proyecto es que los rediseños tocan estructura, color y componentes, y la familia
      tipográfica se queda como en producción. El canvas proponía Iowan/Palatino y se
      descarta, aquí y en `SimulatorPanel`.

## 2. Workspace

- [x] 2.1 `Ide`: separador 5px filete `#23232a` con tirador `#3a3a44`.
- [x] 2.2 `CodeButtons`: Ejecutar `#10b981`/`#04231a`, Detener contorno, iconos silenciosos.
- [x] 2.3 `LeftPanel`: pestañas Editor/Guía en la barra superior junto a los botones;
      eliminada la barra de pestañas del pie.
- [x] 2.4 `Terminal`: paleta por tipo de línea, hora `#3f3f48`, cuerpo `#0d0d10`.
- [x] 2.5 `SimulatorPanel`: sin blobs azules; controles del visor en pill con blur;
      «Detener servidor» movido a la cabecera; pantallas de inicio/levantando con pasos.
- [x] 2.6 `JointSliders`: rail, relleno `#7d79e3`, grados + radianes, preview de código y
      botón blanco «Copiar al editor».
- [x] 2.7 `Panel`: `PanelButton` (morado sin uso) eliminado.

## 3. Verificación

- [x] 3.1 `npm run build` verde y `npm run lint` sin hallazgos nuevos en los archivos
      tocados. **No lo estaba**: ver los defectos corregidos abajo.
- [ ] 3.2 Revisión visual del recorrido completo (inicio → levantando → en línea → ejecutar
      → juntas → terminal). Requiere una sesión activa del simulador en Fly.

## Defectos encontrados al revisar y corregidos

1. **El build estaba roto.** `JointSliders.jsx` tenía una `}` suelta en JSX — error de
   sintaxis, no de estilo. En la línea contigua, `{'{"{"}'}` habría impreso literalmente
   `{"{"}` en pantalla en vez de una llave.
2. **Reaparece el serif** en `SimulatorPanel` y `SimulatorPage` (constante `SERIF`, 4
   títulos), contra la regla de tipografía del proyecto. Eliminado.
3. **«UR5» en 7 sitios** (cabecera, pantallas de inicio, Guía) cuando el robot es un UR5e.
4. **`DocumentationPanel` quedó fuera del rediseño**: seguía entero en la paleta anterior
   (`slate-950`, `slate-900`, `blue-400`), y es la pestaña «Guía» que se ve junto al editor.
5. **«Copiar al editor» no copiaba al editor.** La cadena estaba conectada desde
   `JointSliders` hasta `SimulatorPanel`, pero `Ide` no pasaba `onCopyToEditor`: el botón
   caía al respaldo de portapapeles y había que pegar a mano. Cableado hasta Monaco con un
   `editorApiRef` que expone solo la operación necesaria, sin sacar el editor de `LeftPanel`.

## Integración con el visor URDF

El visor basado en URDF pasa a ser el predeterminado (`?viewer=babylon` deja ver el anterior
para comparar). Se alineó a esta paleta: lienzo `#0a0a0c`, rejilla en grises con los ejes en
el acento. Su diagnóstico en pantalla queda restringido a desarrollo o `?debug=viewer`.

## Diferido (anotado)
- TCP con cinemática directa; retiro de Blockly (decisión aparte).
- `SIM_MAX_CONCURRENT = 3` sobre una única máquina Fly: tres estudiantes simultáneos.
