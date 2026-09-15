# Tasks — Autoalojar Monaco

El orden importa: el CDN sale de la CSP **al final**, cuando ya está probado que
no hace falta (`design.md` §3).

## 1. Traer el editor

- [ ] 1.1 `npm install monaco-editor` en la versión que satisface el peer
      (`>= 0.25.0 < 1`). La del CDN es la 0.55.1; usarla evita diferencias de
      comportamiento con lo que hay hoy en producción.
- [ ] 1.2 Configurar `loader.config({ monaco })` **antes** de que se monte el
      `<Editor />`, importando la API del editor y la contribución de Python.
- [ ] 1.3 Declarar el worker base con el sufijo `?worker` de Vite. Python no
      necesita worker de lenguaje (`design.md` §2).
- [ ] 1.4 Resolver la rama muerta de C++ en `EditorPanel.jsx:57` (`design.md` §1).

## 2. Comprobar que funciona de verdad

Que el editor aparezca no prueba nada: aparecería igual viniendo del CDN.

- [ ] 2.1 **Mirar la red**: abrir `/simulator` y confirmar que NO hay ninguna
      petición a `cdn.jsdelivr.net`. Esta es la comprobación que cierra el change.
- [ ] 2.2 Escribir Python en el editor y ver que colorea.
- [ ] 2.3 Provocar un error de sintaxis y comprobar que la línea se resalta (es
      lo único que usa `monaco.Range`).
- [ ] 2.4 Redimensionar el panel y cambiar de pestaña Editor ↔ Guía: Monaco se
      rompe cuando su `layout()` recibe dimensiones cero.
- [ ] 2.5 Comprobar que el código escrito sigue persistiendo en `localStorage`
      entre recargas.

## 3. Estrechar la CSP

- [ ] 3.1 Quitar `https://cdn.jsdelivr.net` de `script-src`, `style-src` y
      `font-src` en `vercel.json`.
- [ ] 3.2 Volver a probar el simulador con la política estrechada, sirviendo el
      build (las cabeceras de Vercel no se aplican en desarrollo).
- [ ] 3.3 Confirmar que no aparece ninguna violación de CSP nueva.

## 4. Cierre

- [ ] 4.1 Revisar el grupo `vendor-monaco` de `manualChunks`: ahora captura el
      editor de verdad, no solo el envoltorio.
- [ ] 4.2 Anotar el tamaño real del chunk antes y después (`design.md` §5).
- [ ] 4.3 `npm run lint` y `npm run build` sin hallazgos nuevos.
- [ ] 4.4 Actualizar la política de privacidad si mencionaba proveedores: ya no
      hay transferencia a jsDelivr.
- [ ] 4.5 Incorporar los deltas a `specs/` y archivar el change.
