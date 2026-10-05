# Design — Endurecimiento P2

## Context

Siete arreglos pequeños e independientes más una subida de dependencias que, al
investigarla, resultó ser lo más urgente del lote.

## Goals

- Que las lecciones se saneen con una versión de DOMPurify sin bypasses conocidos
  y se editen con un Tiptap sin ejecución de atributos por `__proto__`.
- Que apagar el simulador compartido no esté al alcance de cualquier alumno.
- Que el navegador tenga una segunda capa frente al HTML de las lecciones.
- Que un fallo de render no deje la pantalla en blanco.

## Non-Goals

- **No** se aborda el aislamiento del simulador. Hoy el código del alumno corre
  como root en una máquina Fly compartida, sin sandbox. El límite de concurrencia
  (`SIM_MAX_CONCURRENT`) ya existe y mitiga la saturación, pero no el aislamiento.
  Arreglarlo de verdad es una máquina por sesión o un sandbox real: decisión de
  arquitectura y de coste, con su propio change.
- **No** se cambia la reproducción diferida de la animación ni el botón Detener,
  que hoy solo cierra el WebSocket del cliente. Va con lo anterior.
- **No** se unifican las dos capas de caché (React Query y el `Map` de `api.js`).
  Aquí solo se corrige la invalidación; elegir una sola es un refactor aparte.
- **No** se suben las dependencias de desarrollo. `npm audit` cuenta 21 avisos
  cuando las incluye, pero son de cadena de construcción y no llegan al
  navegador; mezclarlas escondería las siete que sí importan.

## Decisions

### 1. Las dependencias se suben con `npm audit fix`, sin `--force` y sin `--omit=dev`

Las siete se resuelven con versiones menores o de parche:

| Paquete | De | A | Por |
|---|---|---|---|
| `@tiptap/core` | 3.20.2 | 3.31.3 | **alta** — `__proto__` → atributos ejecutables; ReDoS |
| `dompurify` | 3.4.9 | 3.4.15 | 3 bypasses de saneado |
| `react-router` / `-dom` | 6.30.3 | 6.30.6 | redirección abierta; inyección de constructor |
| `linkify-it` | 5.0.0 | 5.0.2 | **alta** — DoS cuadrático |
| `markdown-it` | 14.1.1 | 14.3.2 | DoS cuadrático |

**Cuidado con `--omit=dev`**: comprobado que con esa bandera `npm audit fix`
además **elimina** Vite, Tailwind, ESLint y los tipos, y deja el proyecto sin
poder construir. La bandera se usa para *leer* el informe, nunca para arreglar.

Tiptap salta once versiones menores. Compilar no basta: hay que abrir el editor
de lecciones y escribir, porque es la pieza con la que la directora trabaja.

### 2. La CSP se construye probándola, no copiándola

La tentación es copiar una CSP de ejemplo con `script-src 'self'`. Aquí eso
rompe el simulador: Monaco levanta *web workers* (necesita `worker-src blob:`) y
los motores 3D pueden pedir `wasm-unsafe-eval`.

El orden es: añadir primero las cabeceras que no pueden romper nada
(`X-Content-Type-Options`, `Referrer-Policy`, `frame-ancestors`,
`Permissions-Policy`), y la CSP después, verificándola contra `/simulator` y
contra una lección con contenido de Tiptap. Si la CSP no se puede validar en esta
pasada, se deja fuera y se anota: media CSP mal puesta rompe el producto, y una
CSP ausente es el estado actual, no una regresión.

### 3. CORS se restringe por lista, `/docs` se cierra en producción

`allow_origins=["*"]` con `allow_credentials=False` es defendible, pero permite
que cualquier sitio monte un frontend sobre la API. Pasa a leerse de una variable
de entorno con los orígenes reales (Vercel y local).

`/docs` y `/openapi.json` se sirven solo fuera de producción. Hoy exponen el mapa
completo de la API a cualquiera.

### 4. El tamaño del upload se comprueba mientras se lee

Hoy `await file.read()` carga el archivo entero y *después* se compara con los
5 MB. Se pasa a leer por trozos y abortar en cuanto se supera el límite.

### 5. `ErrorBoundary` envuelve el árbol de rutas

En vez de añadirlo pantalla por pantalla, se envuelve el `Suspense` de `App.jsx`:
una sola línea cubre todas las rutas, y las que quieran un fallback propio pueden
seguir anidando el suyo (como hace `/admin`).

### 6. `datetime.utcnow()` → `datetime.now(timezone.utc)`

Cambio mecánico en 39 sitios. El matiz que importa: `utcnow()` devuelve un
*naive* y `now(timezone.utc)` un *aware*, y comparar los dos lanza `TypeError`.
Como las columnas son `DateTime` sin zona, hay que decidir si se guardan aware
(y migrar) o se sigue guardando naive.

**Decisión: seguir guardando naive**, usando `datetime.now(timezone.utc)` y
quitando la zona antes de persistir. Evita una migración de datos y el cambio
sigue siendo mecánico. Se hace en último lugar porque toca muchos ficheros y
tiene el mayor riesgo de romper comparaciones.
