# Design — Código de la clase en el simulador

## Context

El contenido de una clase es **un solo documento de Tiptap**, guardado como HTML
en `unit_contents.content_value` (`rich_text`). El simulador es otra ruta
(`/simulator`) con su propio editor (Monaco).

El HTML pasa por `sanitizeHtml` (DOMPurify) antes de pintarse, y se pinta en
tres sitios: la clase del alumno (`ContentViewer`), la página de impresión y la
vista previa del editor.

## Goals

- Que el profesor elija, sin ambigüedad, qué código llega al simulador.
- Que el alumno llegue a ese código con un clic.
- Que lo que el alumno modifica no se pierda ni se mezcle entre ejercicios.

## Non-Goals

- **No** se corrige el ejercicio. El sistema no comprueba si el alumno lo logró.
- **No** se avisa al alumno si el profesor cambia el código después. Quien ya lo
  modificó se queda con su versión y tiene «Restablecer».
- **No** se guarda el código del alumno en el servidor. Sigue en el navegador,
  como hoy, así que otro computador empieza de cero. Llevarlo al servidor es el
  paso siguiente, con su propia migración.
- **No** se añade selector de lenguaje a los bloques de código normales.
- **No** se toca el bloque «Simulador 3D» existente.

## Decisions

### 1. El profesor marca el bloque, no se adivina

Se descartó tomar automáticamente el código de la clase. Los 15 bloques que hay
hoy en producción son XML, datos y pseudocódigo: adivinar mandaría al simulador
algo que no se ejecuta.

Tampoco se pone un botón en **todos** los bloques de código, porque pondría
«Probar en el simulador» junto a un URDF.

### 2. Es un atributo del bloque de código, no un nodo nuevo

El bloque de simulador es el mismo `codeBlock` de Tiptap con un atributo más,
`simulator`, que se guarda como `data-simulator="true"` en el `<pre>`. Y lleva
`language: 'python'` para colorearse como Python.

Así:

- Pasar un bloque normal a bloque de simulador, o al revés, es cambiar un
  atributo. No se reescribe el contenido.
- Todo lo que ya sabe pintar un bloque de código —la impresión, la vista previa,
  el coloreado— sigue funcionando sin cambios.
- Un contenido guardado con el atributo y leído por una versión anterior del
  frontend se ve como un bloque de código normal. No se rompe nada.

**Comprobado contra la configuración real del sanitizador:** DOMPurify conserva
`data-simulator="true"` y la clase `language-python`, y sigue eliminando
`onclick`.

### 3. El botón del alumno se inyecta después de sanitizar

`ContentViewer` pinta el HTML con `dangerouslySetInnerHTML`, así que el botón no
puede ser un componente de React dentro del bloque. Se añade al HTML **después**
de `sanitizeHtml`, con marcado propio, y el clic se recoge con un manejador en el
contenedor (delegación de eventos).

El orden importa: inyectarlo antes haría que el sanitizador lo procesara. Y el
manejador no lee ningún atributo del HTML para decidir qué hacer, solo el texto
del bloque y su posición. Un contenido malicioso no puede convertir ese botón en
otra cosa.

### 4. El código viaja en el estado de la navegación, no en la URL

`navigate('/simulator', { state: { … } })`. No va en la URL: un programa largo no
cabe con comodidad, quedaría en el historial y en los registros del servidor, y
cualquiera podría fabricar un enlace que abra el simulador con código ajeno.

El estado de React Router vive en `history.state`, que sobrevive a recargar la
página.

### 5. El guardado es por ejercicio: unidad + posición del bloque

Clave: `code_python_env:unit:<id>:<n>`, donde `n` es la posición del bloque entre
los bloques de simulador de esa unidad.

- **Primera vez:** el editor arranca con el código del profesor.
- **Después:** con la versión del alumno.
- **«Restablecer»:** vuelve al código **actual** del profesor, el que viene de la
  clase, no a una copia guardada.

Se descartó usar como clave un hash del código: corregir una errata en el bloque
cambiaría la clave, y el alumno perdería lo que llevaba hecho.

**Coste conocido:** si el profesor reordena o inserta bloques de simulador antes
de uno existente, la posición cambia y el alumno vería su versión de otro
ejercicio. Es raro, y «Restablecer» lo arregla. Queda anotado.

Entrar sin venir de una clase (un admin, directo) mantiene el comportamiento de
hoy: `code_python_env` o la plantilla.

### 6. El simulador dice de dónde viene el código

Una franja sobre el editor indica «Código de la clase: <título>», con
«Restablecer el código de la clase». Sin ella, el alumno no sabe por qué no ve la
plantilla, ni que puede volver al original.

### 7. «Copiar al editor» escribe en la clave del ejercicio

El botón de los deslizadores reemplaza el código y lo guarda. Hoy escribe en
`code_python_env` fijo. Pasa a escribir en la clave activa; si no, el código
copiado se guardaría en un sitio y se leería de otro.
