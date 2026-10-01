# EduRobotics — frontend

Plataforma educativa de robótica de CIRTA. React 19 + Vite 7 + Tailwind 4 +
TanStack Query, con Tiptap para el contenido, Monaco para el editor de código y
three.js + urdf-loader para el visor del robot. Se despliega en Vercel.

Este repositorio contiene además **`openspec/`**, que gobierna los cambios de los
dos repositorios — este y el backend (`cirta-work/edurobotics_backend`).

## Reglas que no se negocian

**Nunca `git push` sin que Mario lo pida. Jamás a `main`.** Commitear sí, cuando
lo pida. Subir es decisión suya, siempre, y el push a `main` no ocurre nunca
desde una sesión: los cambios llegan por PR desde una rama.

**Honestidad por encima de todo.** Verificar contra el código real antes de
afirmar nada. Si falta información, decir «datos insuficientes» — nunca rellenar
el hueco con algo plausible. Si algo falla, se dice y se enseña la salida.

**Esperar el OK de Mario antes de escribir código.** Primero el change de
OpenSpec, después la implementación.

**La tipografía no se cambia.** La serif tipo Iowan/Palatino está descartada.

**Ramas**: `feature/<n>-<slug>`, con número correlativo simple.
La rama de trabajo del frontend es `feature/3-urdf-viewer`.

**Commits en inglés, en imperativo, separados por tema.** Un commit por asunto.
El cuerpo explica *por qué*, no *qué*.

**Todo lo que ve el usuario va en español.** Textos, errores, estados vacíos.

## Entorno

Windows con **PowerShell 5.1**. No tiene `&&` — encadenar con `;`, o con
`; if ($?) { ... }` cuando la segunda orden dependa de la primera.

## Cómo se trabaja aquí

Las órdenes concretas viven en las skills:

- `/frontend-dev` — servidor de desarrollo (puerto **5173**; espera el backend en
  **8001**)
- `/frontend-build` — build de producción
- `/frontend-lint` — ESLint y Prettier
- `/react-doctor-check` — diagnóstico de React, accesibilidad y rendimiento

Tras cambiar de rama hay que `npm install`: `package.json` cambia entre ramas.

## OpenSpec

Todo cambio de comportamiento pasa por aquí antes de escribirse:

1. `proposal.md` — **Why** (el problema, con datos), **What Changes**,
   **Capabilities**, **Impact**
2. `design.md` — **Context**, **Goals**, **Non-Goals**, **Decisions** numeradas.
   Los Non-Goals no son relleno: son lo que evita que el alcance crezca solo.
3. `tasks.md` — numeradas por fase, con casillas
4. `specs/<capacidad>/spec.md` — el delta: `## ADDED Requirements` /
   `## MODIFIED Requirements`, cada requisito con **SHALL** y sus escenarios
   `#### Scenario:` en **WHEN** / **THEN**

Se escribe, se espera el OK, y solo entonces se implementa. Al terminar, el
delta se vuelca en `openspec/specs/` y el change se archiva.

**Hoy hay siete changes atascados en esa última tarea**, así que
`openspec/specs/` describe menos de lo que el sistema hace. Conviene cerrarlos
antes de abrir más.

Un change nunca se marca completo por un reemplazo masivo: cada casilla se marca
cuando su trabajo está hecho y verificado. Ya pasó una vez y hubo que revertirlo.

## Cosas que conviene saber antes de tocarlas

**Monaco está autoalojado**, no viene de un CDN. Se importa
`monaco-editor/editor/editor.api` más `basic-languages/monaco.contribution`, y el
worker base con el sufijo `?worker` de Vite. Las rutas internas de Monaco cambian
entre versiones —en 0.55 había carpeta por lenguaje y en 0.56 ya no— así que ese
es el punto de entrada estable. La CSP de `vercel.json` ya no permite jsDelivr:
si el autoalojamiento se rompe, el editor no tiene red de seguridad.

**`connect-src` necesita `blob:` para el robot.** Las texturas van dentro de cada
`.glb`, y three.js las lee con `fetch()` sobre una URL `blob:` (en Chrome y Edge,
vía `ImageBitmapLoader`). Sin `blob:` en `connect-src`, la CSP las bloquea y el
robot sale casi negro: las piezas quedan como metal puro y sin color. **Solo pasa en
producción**, porque el servidor de desarrollo no aplica la CSP de `vercel.json`;
en local el robot se ve bien y el fallo pasa inadvertido.

**Blockly y Babylon se retiraron por completo.** El visor es `UrdfViewer`
(three.js + urdf-loader), y toda la geometría sale de
`public/robots/ur5e/*.urdf`. No hay ni una medida del robot escrita en el código,
y así debe seguir: el visor anterior tenía las medidas copiadas a mano y estaban
mal.

**El visor interpola entre fotogramas usando las marcas de tiempo (`t`) que manda
el backend.** No persigue el objetivo con un filtro: eso era lo que hacía que el
brazo nunca alcanzara las posiciones. Si se toca el bucle de animación, esa
distinción es la que importa.

**Los ángulos y su marca de tiempo viajan en un solo estado** (`Ide.jsx`). En dos
estados separados, un render intermedio emparejaría ángulos nuevos con la marca
anterior y la duración del tramo saldría mal.

**El diagnóstico del visor sale solo con `?debug=viewer`.** Los errores de carga
son otra cosa y se muestran siempre: un visor que falló al cargar es
indistinguible de una escena vacía.

**`npm audit fix` ha roto cosas dos veces.** Subió solo `@tiptap/core` dejando 32
paquetes atrás, y `--omit=dev` se lleva Vite, Tailwind, ESLint y los tipos.
Revisar qué propone antes de aceptarlo.
