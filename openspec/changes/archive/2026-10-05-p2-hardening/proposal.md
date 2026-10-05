# Endurecimiento P2

## Why

Lo que quedó de la revisión tras cerrar P0 y P1. Al ir a por ello apareció algo
que cambia el orden: las vulnerabilidades del frontend no eran «7 de
`markdown-it`», como se había resumido. Las dos que importan son otras:

- **`@tiptap/core` (alta)** — `mergeAttributes()` convierte una clave propia
  `__proto__` en atributos DOM heredados y ejecutables. Tiptap es el editor con
  el que los profesores escriben las lecciones.
- **`dompurify` (moderada, 3 avisos)** — entre ellos un subárbol separado que
  queda ejecutable y contaminación permanente de `ALLOWED_ATTR`. DOMPurify es
  justamente la defensa contra XSS que se añadió en el change anterior, así que
  las lecciones se sanean con una versión que tiene bypasses conocidos.

También hay redirección abierta en `react-router` y dos DoS por complejidad
cuadrática (`linkify-it`, `markdown-it`). Las siete se arreglan sin salto de
versión mayor.

Y una comprobación del propio simulador: `POST /api/simulator/stop` no tiene
ningún guard. Cualquier estudiante autenticado apaga la máquina compartida para
toda la clase.

## What Changes

**1. Dependencias del frontend** — subir las siete. `@tiptap/core` salta de
3.20.2 a 3.31.3 (once versiones menores), así que el editor de lecciones hay que
probarlo, no solo compilarlo.

**2. Detener el simulador pasa a ser de administrador** — hoy es un apagado a
disposición de cualquiera.

**3. Cabeceras de seguridad** — `vercel.json` solo tiene el rewrite de SPA: sin
CSP, sin `X-Content-Type-Options`, sin `frame-ancestors`. Se renderiza HTML
escrito por profesores; DOMPurify es la primera capa y la CSP la segunda.
En el backend, CORS deja de ser `*` y `/docs` se cierra en producción.

**4. Uploads** — el límite de 5 MB se comprueba *después* de cargar el archivo
entero en memoria.

**5. Dockerfile** — corre como root, es una sola etapa pese al comentario de
multi-stage, deja `gcc` en la imagen final y no tiene `HEALTHCHECK`.

**6. Resiliencia del cliente** — `ErrorBoundary` solo envuelve `/admin`; un fallo
en el simulador o en un curso es pantalla en blanco. Y cada escritura borra la
caché entera en vez de lo que corresponde.

**7. `datetime.utcnow()`** en 39 sitios: deprecado y se elimina en una versión
futura de Python.

## Capabilities

**Modified**
- `security` — cabeceras de respuesta, origen de las peticiones, superficie de la API.
- `simulator` — apagar la máquina compartida es una acción de administración.
- `engineering` — imagen de contenedor sin privilegios y dependencias sin CVEs.
- `performance` — la caché del cliente se invalida por lo que cambió.
- `accessibility` — un fallo de render no deja la pantalla en blanco.

## Impact

**Frontend**
- `package.json` / `package-lock.json` — siete subidas.
- `vercel.json` — cabeceras.
- `src/App.jsx` — cobertura de `ErrorBoundary`.
- `src/shared/services/api.js` — invalidación selectiva.

**Backend**
- `backend/app/main.py` — CORS y `/docs`.
- `backend/app/features/robotics/routes.py` — guard en `/stop`.
- `backend/app/features/uploads/routes.py` — tamaño antes de bufferizar.
- `Dockerfile` — multi-stage, usuario sin privilegios, healthcheck.
- ~15 ficheros con `datetime.utcnow()`.

**Fuera de alcance**: el aislamiento del simulador (código del alumno como root
en una máquina compartida) y la reproducción diferida de la animación. Son los
dos puntos grandes que quedan y necesitan su propio change con decisión de
arquitectura. Ver `design.md`.
