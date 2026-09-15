## Orden de trabajo (por impacto/riesgo)

Se hace en el orden en que rinde, y cada paso es medible por separado.

### 1. GZip (backend) — el más rentable, 2 líneas
```python
from fastapi.middleware.gzip import GZipMiddleware
app.add_middleware(GZipMiddleware, minimum_size=1000)
```
Orden de middlewares: GZip se agrega junto a CORS; FastAPI aplica el último agregado primero,
pero para gzip el orden relativo a CORS no rompe nada (comprime la respuesta saliente). Se
verifica con `curl -H "Accept-Encoding: gzip" -I` → `content-encoding: gzip` en respuestas >1KB.

### 2. Cache-Control en GET públicos
Solo en catálogo público de lectura: lista de cursos, roadmap público, especializaciones,
landing content. Se añade `Cache-Control: public, max-age=30` en la respuesta (dependencia o
`Response.headers`). **Excluir**: `/api/progress/*`, `/api/admin/*`, cualquier cosa con
`user_id`, y todo POST/PUT/DELETE. `max-age=30` casa con el `staleTime: 30_000` del cliente,
así no hay incoherencia entre el cache del navegador y React Query.

### 3. Flag v7_startTransition (frontend, trivial)
```jsx
<BrowserRouter future={{ v7_startTransition: true }}>
```
Envuelve las actualizaciones de navegación en `startTransition`, así React mantiene la UI
anterior visible mientras el chunk lazy resuelve — desaparece el flash gris. Cero riesgo.

### 4. Prefetch del chunk en hover (extender lo existente)
Hoy `CourseGrid.handlePrefetch` ya hace `getCourseDetail(id)` (datos). Se agrega el prefetch
del **código**:
```js
const prefetchCourse = (id) => {
  import('@/features/courses/pages/CoursePage')   // calienta el chunk
  queryClient.prefetchQuery({ queryKey: ['course', id], queryFn: () => getCourseDetail(id) })
}
```
Se dispara en `onMouseEnter` y `onFocus` (teclado). Al hacer clic, chunk + datos ya están →
navegación instantánea. Mismo patrón para los links del header del alumno.

### 5. Shell del alumno persistente (el más estructural)
Hoy cada página del alumno (incluido su header) es un chunk lazy dentro del `Suspense` global,
así que al navegar "muere" toda la pantalla. Se introduce un **layout route** con el
`StudentHeader` montado UNA vez, y el `Suspense` solo alrededor del `<Outlet/>` de contenido.
Resultado: al navegar, el header queda fijo y solo cambia el área central. Es el cambio más
grande de la fase; si el tiempo aprieta, los pasos 1–4 ya eliminan la mayor parte del flash.

### 6. Secundario
- **Fuente:** `@fontsource-variable/inter` + `import` en el entry, y quitar el `<link>` a
  Google Fonts de `index.html`. Elimina un request render-blocking en la primera visita.
- **Web Vitals:** `web-vitals` → callback que envía LCP/INP/CLS a GA4 vía `react-ga4`.

## Qué NO se toca
- La lógica de negocio, datos, auth, migraciones (no hay).
- Los vendor chunks y el lazy loading actuales (ya están bien).
- No se cachea nada por-usuario ni mutable.

## Verificación (post-deploy, la corre Mario)
- `content-encoding: gzip` en respuestas JSON/HTML > 1 KB.
- Navegar dashboard → curso con cache caliente: sin pantalla-spinner completa.
- Lighthouse Performance ≥ 90 (móvil) en landing y dashboard.
- Comparativa antes/después pegada en este change.
- Si TTFB `/api/*` > ~400 ms constante → revisar regiones Railway↔Supabase ANTES de seguir.
