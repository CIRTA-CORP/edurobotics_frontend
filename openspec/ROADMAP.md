# EduRobotics — Plan de trabajo maestro

> **Cómo usar este documento (instrucciones para el agente implementador):**
> Cada fase de abajo se ejecuta como UN change de OpenSpec. El flujo es siempre:
> 1. Crear `openspec/changes/<nombre-del-change>/` con `proposal.md`, `design.md` (si hay decisiones), `tasks.md` y deltas de spec en `specs/`.
> 2. **Esperar el OK de Mario antes de escribir código.** Nunca implementar sin proposal aprobado.
> 3. Implementar siguiendo `tasks.md`, marcando tareas completadas.
> 4. Correr `pytest tests/` en el backend y `npm run build && npm run lint` en el frontend antes de dar por cerrada cualquier tarea. A partir de F0, la suite DEBE quedar verde.
> 5. Commits locales sí; **nunca `git push` sin que Mario lo pida** (regla permanente).
>
> Las fases están en orden de prioridad. No saltar de fase sin cerrar la anterior,
> salvo que Mario lo autorice. Los criterios de aceptación de cada fase son el
> contrato: si no se cumplen todos, la fase no está cerrada.

Repos:
- Backend: `/Users/mario/Desktop/proyecto/edurobotics_backend` (FastAPI + SQLAlchemy + Alembic, deploy en Railway)
- Frontend: `/Users/mario/Desktop/proyecto/edurobotics_frontend/edurobotics_frontend/frontend-react` (React 19 + Vite + Tailwind, deploy en Vercel)

---

## F0 — Red de seguridad: tests verdes + CI + dependencias `fix-tests-ci-deps`

**Por qué primero:** la suite está rota (17 failed / 22 errors: `no such table: specialization_courses` — el conftest quedó atrás cuando se agregaron especializaciones). Sin tests verdes ni CI, todo lo que sigue se degrada en silencio. Además `python-multipart==0.0.6` tiene CVE-2024-24762 (ReDoS → DoS).

**Alcance:**
- Arreglar `tests/conftest.py`: la BD de test debe crearse desde `Base.metadata.create_all` con TODOS los modelos importados (usar `init_db()` o equivalente), en SQLite en memoria o archivo temporal — nunca el `edurobotics.db` del repo. Eliminar `edurobotics.db` y `test_output.txt` del working tree / historial de tracking y añadirlos a `.gitignore`.
- Actualizar `requirements.txt`: `python-multipart>=0.0.18`, `fastapi` a la última 0.1xx compatible, `pydantic` 2.x actual, y el resto de forma conservadora. Correr la suite tras cada bump para aislar breakages.
- Añadir tests de auth que hoy faltan (login ok/fail, register duplicado, reset-password expirado, `ensure_self_or_admin` bloquea IDOR, `require_admin` bloquea student).
- GitHub Actions en ambos repos: backend `pytest` + frontend `npm ci && npm run lint && npm run build`, en push y PR.

**Criterios de aceptación:** `pytest tests/` 100% verde local y en CI · CI verde en ambos repos · `pip-audit` (o `pip list --outdated` + revisión de advisories) sin CVEs conocidos en deps directas.

**Tamaño estimado:** 1 sesión larga. Sin cambios de producto — no requiere aprobación de la directora.

---

## F1 — Fixes de seguridad puntuales `security-hardening-pilot`

**Alcance (3 fixes de código):**
1. **Rate limiter spoofeable** (`backend/app/core/ratelimit.py:37`): hoy toma el PRIMER valor de `X-Forwarded-For` (controlado por el cliente → bypass total del límite de login). Tomar el ÚLTIMO valor (el que añade el proxy de Railway) con fallback al peer directo. De paso, eliminar el cleanup muerto (`if not window: pop` tras `append` nunca ejecuta) y compactar el dict de IPs periódicamente.
2. **Token JWT en query string del WebSocket** (`/api/simulator/ws?token=...` queda en logs de proxies): pasar el token como primer mensaje tras `accept()`, con timeout de 5s y cierre 1008 si no llega o es inválido. Actualizar el cliente en `src/features/simulator/`.
3. **Roles vivos en JWT de 24h**: al degradar un admin, sus tokens siguen siendo admin hasta 24h. Mitigación mínima viable: columna `token_version` en `users` (migración aditiva), incluida en el JWT y verificada en `require_admin`; al cambiar rol se incrementa (cablear en el `/admin/promote` existente y en el endpoint nuevo de F2).

**Criterios de aceptación:** test que demuestra que XFF spoofeado NO evade el límite · test de WS que rechaza token inválido/ausente · test de que un admin degradado recibe 401/403 en el siguiente request admin.

**Tamaño:** 1 sesión.

---

## F2 — Cerrar el change en curso `registered-users-admin`

Ya existe el proposal (lista de usuarios + cambio de rol desde el panel). Ajustes antes de implementar:
- Añadir al `design.md` la interacción con el `token_version` de F1 (degradar rol debe invalidar tokens admin vivos).
- Mantener las salvaguardas ya especificadas: un admin no se cambia su propio rol; no degradar al último admin.

**Criterios de aceptación:** los del proposal existente + tests de los dos endpoints nuevos (incluye caso "último admin") + la pestaña Usuarios funcionando.

**Tamaño:** 1–2 sesiones. Ya tiene OK conceptual; confirmar con Mario el proposal actualizado.

---

## F3 — Contenido v2: parchar la jerarquía (opción A) `content-model-v2`

**Decisión de arquitectura (aprobada por Mario en análisis del 2026-08-04):** se mantiene la jerarquía Curso → Módulo → Unidad → Contenido. NO se aplana ni se migra a documento-por-unidad. Se corrigen las cuatro costuras:

1. **Quiz como bloque del flujo:** permitir que un quiz ocupe una posición en el `order_index` de los contenidos de la unidad (p. ej. `UnitContent` con `content_type="quiz"` y `quiz_id` FK, o columna `order_index` en `quizzes` — decidir en design.md). Resultado: se puede intercalar video → quiz → texto. Migración Alembic con backfill de los quizzes existentes al final de su unidad (comportamiento actual, sin romper datos).
2. **Tabla `enrollments`** (`user_id`, `course_id`, `enrolled_at`, único por par): se crea al primer acceso al curso. Las métricas de la directora pasan a distinguir "inscrito sin actividad" vs "en progreso". Backfill desde `user_progress` existente.
3. **Metadatos y validación de contenido:** en `UnitContent` añadir `title` y `duration_minutes` (nullable); validar `content_value` según `content_type` en el schema Pydantic (URL válida para video, HTML no vacío para text). El HTML sigue sanitizándose SOLO en el frontend con `sanitizeHtml.js` — no duplicar sanitización en backend, pero sí validar estructura.
4. **Servicio único de completitud:** extraer a `app/features/progress/completion.py` la definición de "contenido/unidad/módulo/curso completado" y hacer que perfil (`auth/routes.py`), métricas admin (`admin/routes.py`) y roadmap (`progress/`) consuman esa única fuente. Tests que fijan la definición.

**Criterios de aceptación:** migraciones reversibles con backfill probado contra un dump de producción (`backup_prod_2026-07-03.dump` como referencia de forma) · los tres consumidores de completitud dan los mismos números que antes del refactor (test de regresión) · quiz intercalable visible en CoursePage.

**Tamaño:** 2–3 sesiones. Este change SÍ necesita proposal detallado y OK explícito antes de tocar nada (toca datos de producción).

---

## F4 — Especializaciones en la malla curricular `specializations-in-roadmap`

**Pendiente pedido por la directora.** Hoy las especializaciones solo aparecen como tarjetas en el dashboard; deben verse EN la malla (roadmap). Ya existe `RoadmapGraph.jsx` con colores por especialización y chips de filtro — falta la representación estructural: agrupar visualmente los cursos de una especialización (contenedor/columna/banda por especialización, orden según `specialization_courses.order_index`) y el estado de avance de la especialización completa (usar el servicio de completitud de F3).

Evaluar **React Flow** (ya identificado como candidato) si el grafo actual se queda corto; si el SVG/HTML actual aguanta la agrupación, no añadir la dependencia.

**Criterios de aceptación:** la directora puede ver en la malla qué cursos forman cada especialización y el % de avance por especialización · funciona con cursos que pertenecen a varias especializaciones · sin regresión del filtro por chips.

**Tamaño:** 1–2 sesiones. **Trabajo visual: Mario levanta frontend+backend y manda capturas para iterar.**

---

## F5 — Visual de métricas de tiempo `time-metrics-visual`

**Pendiente conocido:** las métricas de tiempo (mediana inicio→fin por curso, ya calculadas en backend) se muestran de forma pobre en el dashboard admin. Rediseñar la presentación: distribución/percentiles en vez de un número seco, unidades legibles ("2 h 15 min", no minutos crudos), y estados vacíos claros cuando no hay datos.

**Criterios de aceptación:** definidos sobre capturas — Mario manda screenshots del estado actual y se itera el diseño ANTES de codear (mockup en el proposal).

**Tamaño:** 1 sesión.

---

## F6 — Pasada de UX, accesibilidad e idioma `ux-a11y-pass`

**Alcance:**
- **Idioma:** unificar TODOS los mensajes de error visibles al usuario en español (hoy conviven "Passwords do not match" y "Las contraseñas no coinciden"). Barrido de `detail=` en backend + textos del frontend.
- **Accesibilidad** (hoy: 31 atributos aria/alt en 128 archivos — casi nada, y es una plataforma para colegios): foco visible y navegación por teclado en los flujos de estudiante (login → dashboard → curso → quiz), `alt` en imágenes de cursos, labels en inputs, roles/aria en el quiz (radiogroup), contraste de los estados "bloqueado/dimmed" del roadmap.
- Revisión de UX con capturas: Mario levanta la app, recorre los flujos y manda screenshots; el orquestador (Claude) revisa y lista hallazgos concretos antes de abrir el proposal.

**Criterios de aceptación:** flujo completo de estudiante operable solo con teclado · cero mensajes en inglés de cara al usuario · hallazgos de la revisión con capturas resueltos o explícitamente descartados.

**Tamaño:** 1–2 sesiones.

---

## F7 — Contratos de API y consistencia `api-contracts`

**Oportunista (hacer al tocar cada endpoint, o como fase final):**
- `response_model` Pydantic en todos los endpoints (hoy devuelven dicts a mano) — habilita OpenAPI fiel y valida salidas.
- Servicios que lanzan excepciones tipadas en vez de devolver `{"success": bool, "error": str}` — elimina el boilerplate repetido de traducción en cada route.
- Unificar prefijos de rutas bajo `/api/...` (hoy conviven `/register`, `/admin/promote` y `/api/auth/...`). Mantener alias de compatibilidad hasta desplegar frontend y backend juntos.
- Backfillear specs base de OpenSpec (`openspec/specs/`) para las capacidades núcleo: auth, progreso, contenido — así los futuros changes tienen contra qué diffear.

**Criterios de aceptación:** `/docs` (OpenAPI) refleja fielmente todas las respuestas · cero endpoints con dict crudo · specs base de auth y progreso escritas.

**Tamaño:** 2 sesiones, divisible.

---

## F8 — Fluidez percibida `perceived-performance`

**Diagnóstico (análisis 2026-08-05).** La app YA tiene buena base (rutas lazy, vendor chunks, skeletons, React Query con staleTime, warm-up ping al backend). La sensación de "no fluido" viene de tres causas concretas, en este orden:

1. **Respuestas del backend sin comprimir.** FastAPI NO comprime por defecto y no hay `GZipMiddleware` en `main.py`. El roadmap, las listas de cursos y sobre todo `content_value` (HTML completo de lecciones) viajan en texto plano desde Railway; el HTML comprime 5–10×. Fix: `app.add_middleware(GZipMiddleware, minimum_size=1000)` — 2 líneas, el mayor impacto de toda la fase.
2. **Transiciones de ruta que "parpadean".** El `Suspense` global usa `PageLoader`: pantalla completa gris + spinner en CADA navegación mientras baja el chunk lazy. Eso se percibe como lentitud aunque tarde 200 ms. Fixes:
   - Activar el future flag `v7_startTransition` de React Router para que la página anterior permanezca visible mientras carga la nueva (sin flash gris).
   - Sacar el header/shell del estudiante FUERA del `Suspense` (layout persistente) para que solo cambie el área de contenido.
   - **Prefetch en hover/focus**: al pasar el mouse por una tarjeta de curso, disparar `import()` del chunk de `CoursePage` + `queryClient.prefetchQuery` de sus datos. La navegación pasa a sentirse instantánea. Igual para los links del header.
3. **Sin cache HTTP en endpoints públicos.** No hay `Cache-Control`/`ETag` en ninguna respuesta; el navegador nunca reutiliza nada entre sesiones. Fix: `Cache-Control: public, max-age=30` (alineado con el staleTime del cliente) en cursos/especializaciones/landing públicos.

**Secundario (hacer si sobra tiempo en la sesión):**
- Autohospedar la fuente Inter (`@fontsource-variable/inter`) en vez del CSS de Google Fonts, que hoy bloquea el primer render (afecta solo la primera visita).
- `width`/`height` (o `aspect-ratio`) en imágenes de tarjetas para eliminar cualquier layout shift restante.
- Reportar Web Vitals (LCP/INP/CLS) vía `web-vitals` → GA4 (react-ga4 ya está instalado) para tener datos reales de alumnos, no impresiones.

**Medir ANTES y DESPUÉS (obligatorio, es el criterio de honestidad de la fase):** Lighthouse (móvil, Slow 4G) sobre landing, dashboard y una lección en el deploy de Vercel; y en DevTools → Network, el TTFB de `/api/*`. Si el TTFB desde Railway supera ~400 ms constantes, el problema es latencia/regiones (Railway ↔ Supabase) y ningún fix de frontend lo tapa — revisar que ambos estén en la misma región antes de seguir optimizando.

**Criterios de aceptación:** respuestas JSON > 1 KB llegan con `content-encoding: gzip` · navegar dashboard → curso con cache caliente no muestra pantalla-spinner completa · Lighthouse Performance ≥ 90 en landing y dashboard (móvil) · comparativa antes/después documentada en el change.

**Tamaño:** 1–2 sesiones. Requiere que Mario pruebe en el deploy real (Vercel + Railway), no solo local.

---

## F9 — Tramo de diseño: una sola aplicación

Nace del canvas «Modo estudio EduRobotics» (artifact `c82ae7d9-48bd-4fc8-a55f-18531fdc0f8c`),
que además del modo estudio incorporó los artboards de **preview del curso, dashboard, perfil**
y una hoja de **«Fundamentos»** (color, tipografía, componentes y los seis archivos a tocar).

Orden obligatorio — cada uno depende del anterior:

1. `study-mode-redesign` — **hecho** (falta el riel lateral de secciones, anotado en su
   `tasks.md`).
2. `design-system-foundations` — tokens, `button`, `card`, header y grid del alumno. Retira los
   tres primarios y los cuatro degradados de relleno que hacen que la app parezca varias apps.
3. `student-pages-redesign` — preview, dashboard y perfil. **Dos desviaciones deliberadas del
   canvas:** las especializaciones conservan su **foto** (decisión de Mario), y la tarjeta
   «Continúa donde quedaste» exige enriquecer `GET /api/progress/{user_id}/last-accessed`, que
   hoy devuelve sólo `content_id` sin curso/módulo/unidad.
4. `landing-redesign` — **hecho**. La banda de marca abre y cierra la página; se fueron los tres
   degradados apilados, el azul y la ventana falsa del mockup.
5. `admin-panel-redesign` — **escrito, pendiente de OK**. El más grande: 6 artboards y un mapa de
   cobertura con **72 funciones (24 cambian de lugar, ninguna desaparece)**. El armazón ya está
   hecho (`c13b969`); quedan 5 rebanadas. **Tarea 0 bloqueante: Mario revisa el mapa de cobertura
   antes de codear.**
6. `theme-switching` (modo claro/oscuro) — **por escribir**. Va al final a propósito: si los
   tokens quedan centralizados en `@theme` (paso 2), el modo oscuro es un cambio de paleta; si
   se hace antes, hay que perseguir colores hardcodeados por toda la app.

**Tipografía (regla transversal):** ningún change de este tramo cambia la familia tipográfica.
El canvas propone una serif editorial; se descartó por decisión de Mario (2026-08-29). Crece la
escala, no la familia.

---

## Reglas permanentes del proyecto (para cualquier change)

- Proposal aprobado por Mario ANTES de codear. Sin excepciones.
- Suite de tests verde antes de cerrar cualquier tarea (desde F0).
- Nunca `git push` sin permiso explícito de Mario.
- Toda migración Alembic debe ser reversible y probada contra una copia del dump de producción.
- Mensajes de cara al usuario: siempre en español.
- HTML de usuario: sanitizar SIEMPRE con `sanitizeHtml.js` antes de `dangerouslySetInnerHTML`; nunca añadir `.svg` a `ALLOWED_EXTENSIONS` de uploads.
