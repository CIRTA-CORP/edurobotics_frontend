## Why

La app se siente "no fluida" pese a tener buena base (rutas lazy, vendor chunks, skeletons,
React Query con staleTime, warm-up ping). Verificado en código (2026-08-05), la sensación
viene de 3 causas concretas y medibles:

1. **Backend sin comprimir.** `main.py` solo tiene `CORSMiddleware`; no hay `GZipMiddleware`.
   El roadmap, las listas de cursos y sobre todo `content_value` (HTML completo de lecciones)
   viajan en texto plano desde Railway; el HTML comprime 5–10×. Es el fix más rentable.
2. **Transiciones de ruta que parpadean.** `App.jsx` envuelve TODO en un `Suspense` con
   `PageLoader` (pantalla completa gris + spinner) en CADA navegación mientras baja el chunk
   lazy. Aunque tarde 200 ms, ese flash ES la sensación de lentitud.
3. **Sin cache HTTP.** Ninguna respuesta manda `Cache-Control`/`ETag`; el navegador nunca
   reutiliza nada entre visitas.

**Matiz verificado:** el prefetch en hover **ya existe para los datos** (`CourseGrid`
prefetchea `getCourseDetail` en `onMouseEnter`); falta prefetchear el **chunk** de la página.

## What Changes

### Backend (mayor impacto, bajo riesgo)
- `GZipMiddleware` con `minimum_size=1000` en `main.py` (2 líneas).
- `Cache-Control: public, max-age=30` en los GET públicos de solo lectura (cursos,
  especializaciones, landing) — alineado con el `staleTime` de React Query. NUNCA en
  endpoints autenticados/mutables ni con datos por-usuario.

### Frontend — matar el flash de navegación
- Activar el future flag **`v7_startTransition`** en `<BrowserRouter>` (main.jsx): la página
  anterior queda visible mientras carga la nueva, sin pantalla-spinner.
- **Prefetch del chunk en hover/focus:** extender el prefetch existente para además disparar
  el `import()` de `CoursePage` (y links del header). Data + código ya cargados al hacer clic.
- **Shell del alumno persistente:** sacar el header/nav del estudiante FUERA del `Suspense`
  (layout route) para que al navegar solo cambie el área de contenido, no toda la pantalla.

### Secundario (si sobra tiempo)
- Autohospedar Inter (`@fontsource-variable/inter`) en vez del CSS de Google Fonts, que hoy
  bloquea el primer render (solo afecta la primera visita).
- Reportar Web Vitals (LCP/INP/CLS) con `web-vitals` (no instalado) → GA4 (`react-ga4` ya
  está) para datos reales de alumnos.

## Capabilities

### New Capabilities
- `performance`: compresión, cache HTTP y fluidez de navegación percibida.

## Impact

**Backend:** `main.py` (+GZip), y una dependencia de cache en los routers públicos de
cursos/especializaciones/landing. Sin migraciones.

**Frontend:** `main.jsx` (flag), `App.jsx` (layout persistente/Suspense), `CourseGrid` y
header (prefetch de chunk), `index.html`/fuentes (opcional), `main.jsx` (web-vitals, opcional).

## Medición — OBLIGATORIA (criterio de honestidad de la fase)

Medir **antes y después** sobre el **deploy real** (Vercel + Railway), NO local:
- Lighthouse móvil (Slow 4G) en landing, dashboard y una lección.
- TTFB de `/api/*` en DevTools → Network.

**Caveat crítico:** si el TTFB desde Railway supera ~400 ms constantes, el cuello es
**latencia/regiones (Railway ↔ Supabase)** y ningún fix de frontend lo tapa — primero
verificar que ambos estén en la misma región. Sin medición, se puede "optimizar" sin mover
la aguja. **Esta parte la corre Mario** (yo hago el código; la comparativa la hace él en el
deploy y la pegamos en el change).

## Riesgo

Bajo, salvo un punto: `Cache-Control` mal puesto puede servir datos viejos. Mitigación: solo
en GET públicos de catálogo, `max-age` corto (30 s), nunca en respuestas por-usuario ni tras
un POST/PUT/DELETE. El resto (gzip, flag, prefetch) es aditivo y reversible.
