# Tasks — Endurecimiento P2

Siete bloques independientes, uno por commit. En orden de valor, no de esfuerzo.

## 1. Subir las dependencias vulnerables

- [x] 1.1 `npm audit fix` **sin** `--force` y **sin** `--omit=dev` (esa bandera
      borra el toolchain; ver `design.md` §1).
- [~] 1.2 Confirmar que las siete de producción quedan en cero.
      Cinco resueltas, incluidas las dos altas (`@tiptap/core`, `linkify-it`) y
      `dompurify`. Quedan **2 moderadas en `react-router`**: el aviso cubre de
      6.0.0 a 7.17.0, así que limpiarlas es migrar a la v7 — ruptura, decisión
      de Mario. **Trampa encontrada**: `audit fix` subió solo `@tiptap/core` y
      dejó los otros 32 paquetes de Tiptap en 3.20.x; la mezcla rompe el editor
      con «Cannot read properties of null (reading 'cached')». Hay que fijar
      toda la suite a la misma versión.
- [x] 1.3 `npm run lint` y `npm run build` sin hallazgos nuevos
      (baseline: 45 errores, 5 warnings).
- [x] 1.4 **Probar el editor de lecciones a mano**: Tiptap sube once versiones
      menores. Escribir, dar formato, insertar imagen y enlace, guardar y
      recargar.
- [x] 1.5 Comprobar que una lección ya guardada se sigue viendo igual.

## 2. Detener el simulador es de administrador

- [x] 2.1 `POST /api/simulator/stop` pasa a `require_admin`.
- [x] 2.2 Revisar que el frontend no ofrezca el botón a quien no puede usarlo.
- [x] 2.3 Test: un estudiante recibe 403; un administrador, 200.

## 3. Cabeceras de seguridad

- [x] 3.1 En `vercel.json`, añadir las que no pueden romper nada:
      `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` y
      `frame-ancestors`.
- [x] 3.2 CSP: construirla y **verificarla contra `/simulator`** (Monaco levanta
      workers) y contra una lección con contenido de Tiptap. Si no se puede
      validar en esta pasada, dejarla fuera y anotarlo.
      **Hallazgo**: Monaco NO está empaquetado; `@monaco-editor/react` lo carga
      entero desde `cdn.jsdelivr.net` en runtime. Hubo que permitir el CDN en
      `script-src`, `style-src` y `font-src`. Es una dependencia de terceros en
      tiempo de ejecución: si jsDelivr cae, el editor cae. Autoalojar Monaco
      merece su propio change y devolvería la política a `'self'`.
- [x] 3.3 Backend: CORS deja de ser `*`, pasa a lista desde variable de entorno.
- [x] 3.4 Backend: `/docs` y `/openapi.json` solo fuera de producción.
- [x] 3.5 Test: el backend rechaza un origen no permitido.

## 4. Uploads: comprobar el tamaño mientras se lee

- [x] 4.1 Leer por trozos y abortar al superar el límite, en vez de bufferizar
      entero y comparar después.
- [x] 4.2 Test: un archivo por encima del límite se rechaza.

## 5. Dockerfile

- [x] 5.1 Multi-stage de verdad, para que `gcc` no quede en la imagen final.
- [x] 5.2 Usuario sin privilegios (`USER`).
- [x] 5.3 `HEALTHCHECK` contra `/api/health`.
- [~] 5.4 Construir la imagen y arrancarla para comprobar que sirve.
      **NO verificado**: el daemon de Docker no corre en este entorno. El
      Dockerfile está escrito pero no se ha construido.

## 6. Resiliencia del cliente

- [x] 6.1 `ErrorBoundary` envolviendo el árbol de rutas en `App.jsx`.
- [x] 6.2 Comprobar que un error en una ruta no deja pantalla en blanco.
- [~] 6.3 `invalidateApiCache` con prefijo en los tres puntos de escritura.
      **Revisado el diagnóstico**: el global es la opción correcta. El árbol de
      contenidos está entrelazado, así que acotar por prefijo dejaría lecturas
      obsoletas. Invalidar de más cuesta un refetch de 30 s; de menos, enseñar
      datos viejos. Se añadió un parámetro opcional para quien conozca el
      alcance, pero el defecto sigue siendo global a propósito.

## 7. `datetime.utcnow()`

- [x] 7.1 Sustituir en los 39 sitios por `datetime.now(timezone.utc)` sin zona
      al persistir (ver `design.md` §6).
- [x] 7.2 `pytest` en verde y sin warnings de deprecación por `utcnow`.
- [x] 7.3 Revisar que ninguna comparación mezcle naive y aware.

## Verificación final

- [x] 8.1 Backend: `pytest -q` verde y `ruff` sin hallazgos nuevos.
- [x] 8.2 Backend: `python scripts/check_migrations.py` en verde.
- [x] 8.3 Frontend: `npm run lint` y `npm run build`.
- [x] 8.4 Recorrido a mano: login, una lección, el editor de la directora y
      `/simulator`.
- [x] 8.5 Incorporar los deltas a `specs/` y archivar el change.
