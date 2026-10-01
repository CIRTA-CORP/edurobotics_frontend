# Tasks — Código de la clase en el simulador

## 1. Editor del profesor

- [x] 1.1 Atributo `simulator` en el bloque de código, guardado como
      `data-simulator="true"` en el `<pre>`, y leído al cargar
- [x] 1.2 Botón en la barra: «Código para el simulador». Convierte el bloque
      actual (o crea uno) y lo marca como Python; pulsado otra vez, lo devuelve a
      bloque normal
- [x] 1.3 El bloque se distingue visualmente en el editor y en la vista previa

## 2. Clase del alumno

- [x] 2.1 Botón «Probar en el simulador» en cada bloque marcado, inyectado
      después de sanitizar
- [x] 2.2 Al pulsarlo: da acceso al simulador y lo abre con ese código, la unidad
      y la posición del bloque
- [x] 2.3 La página de impresión muestra el bloque sin botón

## 3. Simulador

- [x] 3.1 Si viene de una clase, el editor arranca con la versión del alumno de
      ese ejercicio o, la primera vez, con el código del profesor
- [x] 3.2 Guardado por ejercicio (`code_python_env:unit:<id>:<n>`); entrar
      directo mantiene el comportamiento de hoy
- [x] 3.3 Franja «Código de la clase» con «Restablecer el código de la clase»
- [x] 3.4 «Copiar al editor» escribe en la clave activa

## 4. Verificación

- [x] 4.1 El HTML con el bloque sobrevive al sanitizador con su marca
- [x] 4.2 Ida y vuelta en Tiptap: marcar, guardar, volver a cargar conserva la
      marca, y un bloque normal sigue siendo normal
- [x] 4.3 El botón inyectado no aparece en bloques sin marca, ni se puede
      fabricar desde el contenido
- [x] 4.4 Build de producción y ESLint sin hallazgos nuevos
- [ ] 4.5 **A mano, con sesión:** crear el bloque en una clase, abrirla como
      alumno, pulsar el botón, modificar, volver y restablecer — lo hace Mario

## 5. Cierre

- [ ] 5.1 Volcar los deltas en `openspec/specs/` y archivar
