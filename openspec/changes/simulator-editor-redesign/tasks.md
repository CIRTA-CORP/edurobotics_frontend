# Tasks — Editor, terminal y guía del simulador

## 1. Código y ejemplos

- [x] 1.1 Código inicial: el recorrido de demostración
- [x] 1.2 Ejecutar en la máquina real el código inicial y cada ejemplo de la guía
      (todos sin choques ni avisos; el de la parada de protección, con su parada)

## 2. Guía

- [x] 2.1 Reescribir la guía como referencia de `robot_api`
- [x] 2.2 Bloques de código coloreados con Monaco y botón «Copiar»
      (verificado en el navegador: 13 bloques, con el tema del editor)
- [x] 2.3 «Abrir en el editor» en cada ejemplo, que se deshace con `Ctrl+Z`
      (verificado en el navegador, con la tecla real)

## 3. Editor

- [x] 3.1 Tema propio con la paleta del simulador
- [x] 3.2 Opciones: sin minimapa ni margen de iconos, relleno, desplazamiento suave, ajuste
      de línea, sangría de 4
- [x] 3.3 `Ctrl+Enter` / `Cmd+Enter` ejecuta (verificado en el navegador)
- [ ] 3.4 Descargar guarda `programa.py` — hecho; falta probarlo a mano (6.3)
- [x] 3.5 Letra Cascadia Code en editor, terminal y guía, empaquetada
      (verificado: cargada, solo el alfabeto latino, ligaduras activas)
- [ ] 3.6 Subir archivo como edición que se deshace — hecho; falta probarlo a mano (6.3)

## 4. Terminal

- [x] 4.1 Filas con etiqueta por tipo; errores con fondo teñido
- [x] 4.2 Mensajes en español, también los que llegan del backend en inglés
- [x] 4.3 Ocultar la línea técnica `[sim] Simulacion lista`

## 5. Vista previa de posturas

- [ ] 5.1 «Añadir al editor» agrega al final y completa la cabecera — la lógica está
      verificada (siete programas generados, ejecutados sin `NameError`); falta en el
      navegador con el simulador encendido (6.3)
- [ ] 5.2 Panel titulado como vista previa; quitar «Posición de inicio» — hecho; falta
      verlo con el simulador encendido (6.3)

## 6. Verificación

- [x] 6.1 Build y ESLint sin hallazgos nuevos (los 4 que quedan ya estaban en la base)
- [x] 6.2 Revisión visual en el navegador, sin sesión: editor, guía y terminal
- [ ] 6.3 **A mano:** recorrer el simulador con sesión — lo hace Mario: ejecutar el
      código inicial, la vista previa y «Añadir al editor», Descargar y Subir

## 7. Revisión de la interfaz

- [ ] 7.1 Arranque: tiempo transcurrido real en vez de pasos inventados; aviso en el título
      — hecho; falta verlo arrancando la máquina de verdad (6.3)
- [x] 7.2 Quitar «se apaga solo», «40–90 s» y «en el momento»; Guía coherente
- [x] 7.3 «Detener» desactivado sin ejecución, activo mientras corre (verificado)
- [x] 7.4 Un solo estado del servidor para cabecera y panel
- [x] 7.5 Terminal: plegado real, borde arrastrable (ratón y flechas), se abre al ejecutar
      (verificado con clic y arrastre reales). Al probarlo apareció un fallo anterior:
      `EditorPanel` leía `onResize(width, height)` y react-resize-detector 12 pasa un
      objeto, así que el editor nunca seguía a su contenedor; y el `resize` de ventana lo
      dejaba en 0 de alto. Corregidos los dos.
- [x] 7.6 Botones de icono con nombre accesible y ayuda también con teclado
- [ ] 7.7 Deslizadores con nombres en español y el nombre técnico debajo — hecho; falta
      verlo con el simulador encendido (6.3)
- [ ] 7.8 Animaciones de la decisión 12, con `prefers-reduced-motion` — verificadas las
      filas de la terminal, el cambio de pestaña y el aviso; faltan el panel de la vista
      previa y el resaltado de líneas, que necesitan el simulador encendido (6.3)
- [x] 7.9 «ROS2» junto, como pidió Mario
