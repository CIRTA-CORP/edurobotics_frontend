# Design — Autoalojar Monaco

## Context

`@monaco-editor/react` está pensado para funcionar sin configurar nada: si no
encuentra `monaco-editor` instalado, se lo baja de un CDN. Es una comodidad
razonable para un prototipo y un problema en producción, y es fácil no darse
cuenta porque **todo funciona**: el editor aparece, el alumno escribe, nada
falla. Solo se ve cuando algo mira las peticiones de red, que es lo que hizo la
CSP.

## Goals

- Que el editor viaje con la aplicación y no dependa de nadie en tiempo de ejecución.
- Devolver la CSP a `'self'` en las tres directivas que hubo que abrir.
- No arrastrar lenguajes ni funciones que el producto no usa.

## Non-Goals

- **No** se cambia de editor ni se toca su configuración visible (tema, opciones,
  comportamiento). El alumno no debería notar nada.
- **No** se añaden lenguajes nuevos. Hoy se usa Python; si mañana hay otro, se
  añade su contribución entonces.
- **No** se aborda el resto de dependencias de terceros en tiempo de ejecución.
  Si las hay, es otro trabajo; este change cierra la que se encontró.

## Decisions

### 1. Solo la API del editor y el lenguaje que se usa

Importar `monaco-editor` entero trae todos los lenguajes que soporta VS Code, y
el producto usa uno. Se importa la API del editor más la contribución de Python.

Dato que lo justifica: de toda la API de Monaco, el código llama exactamente a
**una** cosa, `monaco.Range` en `LeftPanel.jsx:104`, para resaltar la línea de un
error de Python. Nada más.

**Cabo suelto a resolver al implementar:** `EditorPanel.jsx:57` tiene
`language === "python" ? language : "cpp"`, pero `enviromentConfig.editor` está
fijado a `"python"`, así que la rama de C++ es inalcanzable. Hay que decidir si
se incluye también la contribución de C++ por si el respaldo llega a usarse, o
se retira la rama muerta. Inclinación: retirarla — un respaldo que nunca se
ejecuta solo sirve para confundir, y añadir un lenguaje "por si acaso" contradice
el objetivo de no arrastrar lo que no se usa.

### 2. Los workers se declaran explícitamente

Monaco delega trabajo a *web workers*. Sin configurarlos, intenta cargarlos por
su cuenta y vuelve a fallar —a veces en silencio, con el editor funcionando a
medias.

Lo que salva este caso: los workers de lenguaje de Monaco existen para
TypeScript, JSON, CSS y HTML. **Python no tiene worker propio**: se resuelve con
coloreado de sintaxis, sin análisis en segundo plano. Así que basta con el worker
base del editor, no los cuatro de lenguaje.

En Vite se declara con el sufijo `?worker`, que empaqueta el fichero como worker
en lugar de como módulo normal.

La CSP ya contempla esto: `worker-src 'self' blob:` está puesto y **verificado**
—se comprobó en el navegador que un worker desde blob arranca— así que esta parte
no debería requerir tocar la política.

### 3. La CSP se estrecha al final, no al principio

Tentación: quitar el CDN de la política a la vez que se cambia el código. Mala
idea. Si el autoalojamiento falla a medias, el editor cae y la política ya no
permite el respaldo, así que se pierden las dos vías a la vez y cuesta más ver
qué pasó.

Orden: primero autoalojar y comprobar que el editor funciona **sin** que el
navegador pida nada a jsDelivr; entonces, y solo entonces, retirar el CDN de la
CSP.

### 4. La verificación es de red, no de vista

Que el editor aparezca no prueba nada: aparecería igual si siguiera viniendo del
CDN. La comprobación que cierra este change es **mirar las peticiones de red** y
confirmar que no hay ninguna a `cdn.jsdelivr.net` al abrir el simulador.

Y además hay que escribir en el editor: colorear Python, resaltar la línea de un
error (que es lo único que usa `monaco.Range`) y redimensionar el panel, que es
donde Monaco suele romperse cuando su `layout()` no recibe dimensiones.

### 5. El bundle va a crecer, y está bien

Hoy `vendor-monaco` pesa 14 kB porque solo contiene el envoltorio; el editor no
está en el bundle en absoluto. Al autoalojarlo, ese chunk crecerá bastante.

No es una regresión: ese peso **ya se descargaba**, solo que desde otro servidor y
sin aparecer en las mediciones. Pasa de ser una petición invisible a un chunk
medible, que es justo lo que se quiere. Y sigue cargándose bajo demanda, porque
la ruta del simulador ya va en `lazy()`.

Anotar el tamaño real tras el cambio, para que quede el número honesto y no la
impresión de que «el bundle creció».

### 6. Beneficio colateral: se va el cargador AMD

El mecanismo del CDN instala un cargador AMD que deja un `define` global. Eso fue
lo que impidió diferir Blockly en su momento: su envoltorio UMD veía ese `define`
y chocaba con él.

Blockly ya no está, así que hoy no desbloquea nada. Pero conviene saberlo: con
imports ESM normales ese `define` global desaparece, y cualquier librería UMD que
se añada en el futuro dejará de tener ese problema.
