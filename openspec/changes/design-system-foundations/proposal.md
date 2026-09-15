## Why

El modo estudio ya quedó rediseñado (`study-mode-redesign`), pero el resto de la app sigue
hablando otro idioma visual: hay **tres primarios distintos** conviviendo (`#0f172a` en los
tokens, `#2563eb` en botones y focus ring, `slate-700→900` en cabeceras) y **cuatro degradados
de relleno** (rosa→naranja en descargas, azul en enlaces, `blue-500→indigo-600` en avatares,
`slate` en bandas). De ahí viene la sensación de estar navegando páginas de aplicaciones
distintas.

El canvas «Modo estudio EduRobotics» (artifact `c82ae7d9-48bd-4fc8-a55f-18531fdc0f8c`) incorporó
un artboard **«Fundamentos»** que resuelve esto en una hoja: color, tipografía, componentes y
—literalmente— los seis archivos del repo que hay que tocar. Este change implementa esa hoja.

Es además el **prerrequisito correcto para el modo claro/oscuro** que Mario quiere después: si
los tokens quedan semánticos y centralizados en `@theme`, el modo oscuro pasa a ser un cambio de
paleta; si se hace al revés, hay que perseguir colores hardcodeados por toda la app. Por eso el
orden que pidió Mario (diseño primero, modo oscuro después) es el correcto, y se deja anotado.

## What Changes

### Color: un gris cálido, un acento, dos estados
Un solo azul-violeta para lo interactivo (`#4b46d6`), verde **solo** para avance real
(`#10b981`), ámbar **solo** para bloqueos (`#b45309` sobre `#fffbeb`). El negro de marca es el
`#0a0a0c` del HeroBand que ya existe.

| Rol | Valor |
|---|---|
| Fondo / superficie apagada / secundario | `#ffffff` · `#fafafa` · `#f4f3f8` |
| Borde / borde de tarjeta | `#ececf1` · `#e9e9ee` |
| Texto y acción / cuerpo de lectura / apagado | `#16151b` · `#33323b` · `#8b8a95` |
| Acento / avance / bloqueo | `#4b46d6` · `#10b981` · `#b45309` |

**Se retiran:** `#2563eb`, `#0f172a`, los degradados rosa→naranja y slate. **Se conserva** la
paleta de 8 colores de especializaciones (`specStyle.js`): ahí el color sí significa algo
distinto en cada valor.

### Tipografía — NO cambia (decisión de Mario, 2026-08-29)
La familia tipográfica se queda **exactamente como está en producción**: la sans propia de la
app en toda la interfaz y en la lección. El canvas proponía una serif editorial (Iowan/Georgia)
para títulos de unidad y encabezados: **se descarta por completo**, y la que se había
introducido en la rama del visor ya fue retirada.

Dato verificado al decidirlo: producción cargaba Inter desde Google Fonts pero **ningún CSS la
declaraba**, así que el navegador la descargaba sin usarla y la página siempre se vio con la
sans del sistema. El commit `c71b366` que quitó ese enlace fue correcto y **no cambió nada
visualmente**; no hay que "restaurar Inter".

Lo que sí se mantiene de esta sección: **mono para todo lo contable** (progresos, duraciones,
versiones, contadores), porque eso distingue números de prosa sin cambiar de familia de texto.
Columna de lectura 704 px y cuerpo 17/1.75 — ya vigentes.

### Componentes
Una sola acción primaria por vista, siempre `#16151b`, radio 11–12 px y **altura 44 px** (que es
también el mínimo táctil). Sobre banda oscura se invierte a blanco. Tarjetas con un solo radio
(14) y borde `#e9e9ee`, en vez de mezclar `xl` y `2xl`.

### Los seis archivos (los nombra el propio artboard)
1. `src/index.css` — los tokens de `@theme` con los valores de arriba (la prosa ya está alineada).
2. `shared/components/button.jsx` — variante `default` al negro de marca, radio 12, altura 44.
3. `shared/components/card.jsx` — un solo radio y borde `#e9e9ee`.
4. `features/student/components/StudentHeader.jsx` — avatar sólido en vez de degradado; enlace
   activo con el tinte del acento.
5. `features/student/components/CourseGrid.jsx` — barra de avance en verde/acento y el mismo
   radio de tarjeta que el resto.
6. `features/courses/components/ContentViewer.jsx` — **ya hecho** en `study-mode-redesign`
   (descarga y enlace sin degradado, tarjeta silenciosa con icono en gris). Se verifica que no
   haya quedado nada del degradado anterior.

## Alcance v1 vs diferido

**v1**: los seis archivos y el barrido de los colores retirados en el resto de `src/`.

**Diferido con nota**: **modo claro/oscuro** (`theme-switching`) — es el siguiente change
natural y este lo habilita; no se implementa aquí para no mezclar "unificar la paleta" con
"duplicarla". Tampoco entra la personalización tipográfica.

## Capabilities

### New Capabilities
- `design-system`: los tokens, la tipografía y los primitivos compartidos que hacen que todas
  las pantallas se lean como una sola aplicación.

## Impact

**Frontend únicamente.** Sin backend, sin migraciones, sin dependencias nuevas. Los primitivos
de shadcn/ui **no se reemplazan**: cambian sus tokens y un par de variantes.

**Riesgo de alcance:** tocar `button.jsx` y `card.jsx` afecta a TODA la app, incluido el panel
admin, que no está en el canvas. Se acepta a propósito (es el punto del change: consistencia),
pero obliga a revisar el panel admin y el simulador después del cambio.

## Riesgo

Medio. El focus ring accesible de la F6 usa hoy `#2563eb`, uno de los colores que se retiran:
al cambiarlo hay que **mantener el contraste AA** del anillo sobre fondo blanco y sobre la banda
oscura (la capability `accessibility` no puede regresar). Sin tests de UI, la verificación es
manual y por capturas; el build y el lint son la única red automática.
