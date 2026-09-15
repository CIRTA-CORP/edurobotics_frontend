# Tasks — Autoalojar Monaco

El orden importa: el CDN sale de la CSP **al final**, cuando ya está probado que
no hace falta (`design.md` §3).

## 1. Traer el editor

- [x] 1.1 Instalada la **0.56.0**, no la 0.55.1 del CDN como decía el diseño.
      Motivo: la 0.55.1 empaqueta su propia copia anidada de `dompurify` con **18
      avisos abiertos** — y es la versión que el CDN venía sirviendo, así que
      producción la lleva ejecutando sin que se pudiera ver. La 0.56.0 baja a 4,
      y un `override` de npm fuerza toda la instalación a usar la `dompurify`
      3.4.15 ya parcheada: **cero avisos**.
- [x] 1.2 Configurar `loader.config({ monaco })` **antes** de que se monte el
      `<Editor />`, importando la API del editor y la contribución de Python.
      Dos correcciones sobre el diseño: (a) el `exports` del paquete mapea
      `./*` → `./esm/vs/*.js`, así que las rutas NO llevan `esm/vs/`; (b) en la
      0.56 desaparecieron las carpetas por lenguaje, así que se importa el punto
      de entrada `basic-languages/monaco.contribution`, que además es estable
      entre versiones — las rutas internas claramente no lo son.
- [x] 1.3 Declarar el worker base con el sufijo `?worker` de Vite. Python no
      necesita worker de lenguaje (`design.md` §2).
- [x] 1.4 Resolver la rama muerta de C++ en `EditorPanel.jsx:57` (`design.md` §1).

## 2. Comprobar que funciona de verdad

Que el editor aparezca no prueba nada: aparecería igual viniendo del CDN.

- [x] 2.1 **Mirar la red**: abrir `/simulator` y confirmar que NO hay ninguna
      petición a `cdn.jsdelivr.net`. Esta es la comprobación que cierra el change.
- [x] 2.2 Escribir Python en el editor y ver que colorea.
- [x] 2.3 Provocar un error de sintaxis y comprobar que la línea se resalta (es
      lo único que usa `monaco.Range`).
- [x] 2.4 Redimensionar el panel y cambiar de pestaña Editor ↔ Guía: Monaco se
      rompe cuando su `layout()` recibe dimensiones cero.
- [x] 2.5 Comprobar que el código escrito sigue persistiendo en `localStorage`
      entre recargas.

## 3. Estrechar la CSP

- [x] 3.1 Quitar `https://cdn.jsdelivr.net` de `script-src`, `style-src` y
      `font-src` en `vercel.json`.
- [x] 3.2 Volver a probar el simulador con la política estrechada, sirviendo el
      build (las cabeceras de Vercel no se aplican en desarrollo).
- [x] 3.3 Confirmar que no aparece ninguna violación de CSP nueva.

## 4. Cierre

- [x] 4.1 Revisar el grupo `vendor-monaco` de `manualChunks`: ahora captura el
      editor de verdad, no solo el envoltorio.
- [x] 4.2 Anotar el tamaño real del chunk antes y después (`design.md` §5).
      `vendor-monaco`: **14.360 → 3.089.047 bytes** (793 kB gzip), más un chunk
      de worker de 272.779 bytes. Ese peso ya se descargaba: pasa de petición
      invisible a un CDN a chunk medible y cargado bajo demanda con la ruta.
- [x] 4.3 `npm run lint` y `npm run build` sin hallazgos nuevos.
- [~] 4.4 Actualizar la política de privacidad si mencionaba proveedores: ya no
      hay transferencia a jsDelivr.
      **Pendiente**: la política nunca listó jsDelivr, así que no hay texto que
      corregir — pero conviene que Mario confirme que no queda ningún otro
      tercero en tiempo de ejecución sin declarar.
- [x] 4.5 Incorporar los deltas a `specs/` y archivar el change.
