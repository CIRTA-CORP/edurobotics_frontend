# Tasks — Migrar a React Router v7

## 1. Subir

- [x] 1.1 Instalada la **7.18.4** (react-router y react-router-dom).
- [x] 1.2 `npm audit`: confirmar que los dos avisos de `react-router` desaparecen.

## 2. Ajustar

- [x] 2.1 `npm run build` y `npm run lint`; corregir lo que rompa.
- [x] 2.2 Ningún cambio de import necesario: las nueve APIs usadas siguen
      exportándose desde `react-router-dom` en v7.

## 3. Verificar las rutas a mano

Un salto mayor en el enrutador no se valida compilando.

- [x] 3.1 Recorrer: `/`, `/login`, `/register`, `/dashboard`, `/student`,
      `/admin`, `/courses/:id`, `/courses/:id/study`, `/courses/:id/quiz/:quizId`,
      `/roadmap`, `/profile`, `/simulator`.
- [x] 3.2 Comprobar las redirecciones: sin sesión va a `/login`; un estudiante en
      `/admin` va a `/dashboard`; una ruta inexistente cae donde debe.
- [x] 3.3 Comprobar los parámetros (`useParams`) en curso y quiz, y
      `useSearchParams` donde se use.
- [x] 3.4 Comprobar `navigate(-1)` (el botón Volver del simulador).

## 4. Cierre

- [x] 4.1 `npm audit`: **cero avisos** en dependencias de producción.
- [ ] 4.2 Incorporar el delta a `specs/` y archivar el change.
