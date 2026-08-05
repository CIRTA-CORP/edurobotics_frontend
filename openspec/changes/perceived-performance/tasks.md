# perceived-performance (F8) — fluidez percibida

## 0. Medición ANTES (obligatoria, la corre Mario en el deploy)

- [ ] 0.1 Lighthouse móvil (Slow 4G) en landing, dashboard y una lección → guardar cifras.
- [ ] 0.2 TTFB de `/api/*` en DevTools → Network. Si > ~400 ms constante, revisar regiones
      Railway↔Supabase antes de seguir.

## 1. Backend — compresión y cache

- [x] 1.1 `GZipMiddleware(minimum_size=1000)` en `main.py` (verificado: middleware registrado).
- [x] 1.2 `Cache-Control: public, max-age=30` (helper `app/core/http.py`) en los 4 GET públicos
      auth-invariantes: lista de cursos, `/courses/roadmap`, lista de especializaciones, landing.
      Se EXCLUYÓ `/specializations/{id}` (usa optional-auth) y todo lo autenticado/mutable.
- [ ] 1.3 Verificar `content-encoding: gzip` con `curl` (post-deploy, lo hace Mario).

## 2. Frontend — matar el flash de navegación

- [x] 2.1 `future={{ v7_startTransition: true }}` en `<BrowserRouter>` (main.jsx).
- [x] 2.2 Prefetch del **chunk** (`import()` de `CoursePreviewPage`) + datos en
      `onMouseEnter`/`onFocus` de las tarjetas.
- [ ] 2.3 **DIFERIDO — shell del alumno persistente.** El `StudentHeader` está en 5 páginas, 2
      condicionalmente (alumno vs `PublicNav`). Convertirlo a layout route es un refactor con
      riesgo real (headers dobles / equivocados para no logueados) justo antes del piloto, y
      `v7_startTransition` YA elimina el flash gris. Recomendado como follow-up enfocado.

## 3. Secundario

- [x] 3.1 **Fuente:** hallazgo — Inter se descargaba (render-blocking) pero NO estaba aplicada
      (sin `font-family: Inter` en CSS/config). Se quitó el `<link>` muerto de Google Fonts →
      menos requests bloqueantes, cero cambio visual. (Mejor que autohospedar, que la añadiría.)
- [ ] 3.2 **DIFERIDO — web-vitals→GA4.** `react-ga4` está instalado pero GA nunca se inicializa
      (sin measurement ID en el código). Reportaría a nada; necesita configurar GA primero.

## 4. Medición DESPUÉS + verificación

- [x] 4.1 `npm run build` verde; `pytest` verde (23 passed; el resto es el issue local de TestClient).
- [ ] 4.2 Repetir Lighthouse + TTFB en el deploy; pegar comparativa antes/después (Mario).
- [ ] 4.3 Confirmar sin pantalla-spinner al navegar con cache caliente; Performance ≥ 90 (Mario).
