# study-mode-redesign — nueva vista de estudio

> Diseño de referencia: canvas «Modo estudio EduRobotics»
> (artifact `c82ae7d9-48bd-4fc8-a55f-18531fdc0f8c`), artboards `Main`, `Movil`, `Bloques`.
> No rediseñar sobre la marcha: lo que no está en el canvas se pregunta antes de inventarlo.

## 0. Antes de tocar código (bloqueante)

- [x] 0.1 Cambios sin commitear del 13-08 **conservados** en `fd63e9f` (modo foco de
      escritorio + índice más silencioso). El árbol quedó limpio; el rediseño parte de ahí.
      Dos cosas de ese commit son **decisiones pendientes**, no hechos consumados:
      (a) se quitó el enlace «Ver la malla del curso» del pie del índice — era la única
      entrada a la malla desde dentro de un curso; (b) se quitaron los iconos por tipo de
      unidad, pero el canvas **sí** los conserva en el índice → la tarea 2.2 los repone.
- [ ] 0.2 Capturas del estado ACTUAL de las tres unidades de referencia (solo texto; video +
      PDF + simulador; con evaluación), escritorio y 390 px — son la mitad "antes".
      **Nota (2026-10-07):** el rediseño ya está desplegado y no se tomaron capturas antes de
      empezar: el estado previo **ya no existe** en la app. No se van a fabricar; la mitad
      "antes" queda sin evidencia (lo más cercano es el código en `c4e1da3`, previo al rediseño).

## 1. Shell y layout

- [x] 1.1 Barra superior: volver · título + badge de nivel + versión · anillo de progreso
      `hechas/total` · avatar.
- [x] 1.2 Barra de progreso de lectura de 2 px ligada al scroll de la columna.
- [x] 1.3 Columna de lectura `max-width: 704px` centrada; índice como aside de 320 px con
      fondo `#fafafa` y botón de modo foco.

## 2. Índice por módulos

- [x] 2.1 Línea de módulos con nodos: actual abierto (unidades + barra de progreso del
      módulo), terminado cerrado con nodo verde y check, por venir atenuado.
- [x] 2.2 Duración estimada por unidad; unidad activa destacada; **reponer el icono por tipo
      de unidad** (video/texto/recurso/evaluación), que el canvas conserva y el commit
      `fd63e9f` había quitado.
- [x] 2.2b Decidir dónde vive la entrada a la malla del curso, que `fd63e9f` quitó del índice
      (la barra superior es el candidato natural). No dejarla sin entrada: la malla es lo que
      pidió la directora.
- [x] 2.3 Modo foco (ocultar/mostrar índice), estado local a la sesión.
- [x] 2.4 Móvil: el índice vive en una hoja inferior que se abre desde la barra.

## 3. Lección: tipografía y bloques

- [x] 3.1 Escala tipográfica: h1 y h2 grandes en la **sans de la app** (la serif del canvas se
      descartó por decisión de Mario, 2026-08-29), cuerpo 17 px/1.75,
      monoespaciada para migas y metadatos, cita con barra de acento.
- [x] 3.2 Migas (módulo › unidad), título, tiempo de lectura y etiqueta de material; indicador
      «Completado» cuando corresponde.
- [x] 3.3 Bloques con la misma gramática (borde, radio, densidad): video, PDF con
      previsualización, descarga, enlace externo, simulador (fondo oscuro), evaluación con
      estados Disponible/Bloqueada.
- [x] 3.4 Riel de secciones **lateral**. Hoy el índice de secciones existe pero es un bloque
      **en línea** sobre la lección (`TableOfContents`), no el riel a la derecha del canvas;
      ya cumple lo esencial (se construye desde los `h2`, se oculta con menos de dos) y no
      toca `sanitizeHtml`. Falta moverlo a una columna lateral pegajosa en pantallas anchas.
      **Hecho y visto en el navegador (2026-10-07)**, con una unidad local de 4 secciones: a 1440
      px el riel queda fijo a la derecha, marca la sección en lectura y al hacer clic salta y
      deja el foco en el encabezado; a 375 px aparece el bloque en línea. La revisión destapó
      dos fallos que se corrigieron: la página se desplazaba entera en vez del panel de
      lectura (la barra de lectura y «Volver arriba» nunca funcionaban, ya en producción), y
      la lección se reinsertaba en cada render (React 19 compara `dangerouslySetInnerHTML`
      por identidad)
      **Pendiente a propósito:** es un cambio de layout de la columna de lectura y en esta
      sesión no había navegador para verificarlo visualmente; hacerlo a ciegas arriesgaba
      romper la pantalla más usada. Hacer con la app a la vista.
      **Implementado en código (2026-10-07), falta verlo en el navegador** — por eso sigue sin
      marcar. `ContentViewer.jsx`: `SectionRail` (riel lateral pegajoso, resalta la sección
      activa con `aria-current="location"`), `useActiveHeading` (lee los nodos ya pintados al
      hacer scroll en el panel; no toca `sanitizeHtml`), `goToHeading` (scroll instantáneo con
      `prefers-reduced-motion`, y mueve el foco al encabezado). El riel aparece por
      **container query** cuando el panel de lectura mide ≥ 960 px (704 de columna + 48 + 208
      de riel): a 1440 con el índice abierto sí cabe; a 1280 con índice, no, y queda el bloque
      en línea `TableOfContents`, que es también el respaldo a 390 px. Sigue oculto con menos
      de dos encabezados. Se construye desde h1–h3 (igual que antes), no solo h2.
      Build y lint verdes.

## 4. Acción primaria y registro de avance

- [x] 4.1 Botón primario único con sus estados: `Marcar como leído` → `Siguiente unidad`;
      `Completar módulo N` → `Empezar módulo N+1`; `Finalizar curso` (abre el modal de
      feedback, como hoy).
- [x] 4.2 **Eliminar el enlace secundario «Siguiente»** del pie; conservar «Anterior».
      Saltar a otra unidad se hace desde el índice.
- [x] 4.3 Automarcar la unidad al aprobar su quiz o al ejecutar el simulador.
- [x] 4.4 Confirmar que `markComplete` y los heartbeats siguen registrando igual
      (`completed_at`, `active_seconds`) — sin cambios de backend.
      **Verificado por código y tests (2026-10-07):** `progress.js` y `useProgress.js` sin
      cambios commiteados desde `c4e1da3` (previo al rediseño); `CoursePage` sigue pasando
      `progressHook.markComplete`/`updateAccess`; en `ContentViewer` el heartbeat es el mismo
      (15 s, solo con la pestaña visible, sobre `contents[0]`) y `markComplete` se llama por
      contenido pendiente desde el botón primario, el autocompletado del quiz y el botón del
      simulador. Backend: `test_progress.py`, `test_active_time.py`, `test_completion.py` →
      21 passed. La comprobación en vivo (que la fila cambie) es la 6.3.

## 5. Accesibilidad (no regresar la F6)

- [x] 5.1 Índice y botón primario como controles reales con foco visible; recorrido de teclado
      completo en la vista de estudio.
- [x] 5.2 Anuncio discreto (`aria-live`) al marcar una unidad como completada.
- [x] 5.3 Contraste AA en los módulos atenuados del índice.

## 6. Verificación

- [x] 6.1 `npm run build` verde; `npm run lint` **mejoró** la línea base (53 problemas / 48
      errores, contra 55 / 50 antes del rediseño). Los errores que quedan son previos y
      viven en `QuizView`, `CoursePreviewPage` y dos efectos antiguos de `CoursePage`.
- [ ] 6.2 Capturas DESPUÉS de las tres unidades de referencia (escritorio y 390 px) y
      comparación con las de 0.2.
- [x] 6.3 Prueba manual: completar una unidad y verificar que el avance queda registrado y que
      el índice y el anillo de progreso reflejan el cambio. Hecho en local (2026-10-07):
      `mark-complete` 200, el índice pasa a «Listo» y el anillo a 1/1; en 20 s solo salen
      heartbeats, sin peticiones en bucle

## Diferido (decidido en el canvas, no reabrir sin motivo)
- Partir la unidad en pasos numerados (Opción D).
- Pantalla partida con panel de material en pestañas (Opción C).
- Lectura inmersiva sin índice (Opción B).
- Modo oscuro y personalización tipográfica.
