## Why

El modelo de contenido tiene cuatro costuras que limitan el producto y arriesgan la
consistencia de los datos que ve la directora:

1. **Los quizzes no se pueden intercalar en el flujo de una unidad.** `UnitContent`
   se ordena por `order_index`, pero `Quiz` vive aparte (sin `order_index`) y hoy
   siempre se muestra al final. No se puede armar video → quiz → texto.
2. **No existe el concepto de "inscripción".** "Iniciado" se infiere del progreso, así
   que no se puede distinguir "inscrito sin actividad" de "nunca lo tocó" — justo lo
   que las métricas de la directora necesitan.
3. **`UnitContent` no tiene metadatos** (título, duración), lo que impide una tabla de
   contenidos, tiempos estimados y una presentación consistente (base de #29 / F5).
4. **"Completado" está definido en tres lugares y ya divergen:** el roadmap cuenta
   contenidos + quizzes; las métricas admin (#35 / #36) cuentan solo contenidos. Un
   alumno que hizo todo menos el quiz aparece "completado" en un lado y no en el otro.

Se mantiene la jerarquía Curso→Módulo→Unidad→Contenido (opción A, aprobada 2026-08-04):
NO se aplana ni se migra a documento-por-unidad. Se corrigen las cuatro costuras, con
el **servicio único de completitud como pieza angular**.

## What Changes

Cuatro pasos secuenciados por seguridad (cada uno es aditivo, reversible y desplegable
por separado — ver `design.md`):

### 1. Servicio único de completitud (keystone, SIN migración)
Módulo `app/features/progress/completion.py` con la definición autoritativa: un scope
(unidad/módulo/curso) está completo cuando **todos sus contenidos están completos Y
todos sus quizzes aprobados**. El roadmap, las métricas admin y el perfil lo consumen.
**Corrección intencional:** las métricas admin pasan a incluir los quizzes (hoy los
ignoran), unificando el número con lo que el alumno ve. Tests de regresión fijan la
definición.

### 2. Metadatos y validación de contenido (migración aditiva)
`UnitContent` gana `title` y `duration_minutes` (nullable). El schema Pydantic valida
`content_value` según `content_type` (URL válida para video, HTML no vacío para texto).
La sanitización de HTML sigue SOLO en el frontend (`sanitizeHtml.js`); acá se valida
estructura, no se duplica sanitización.

### 3. Quiz como bloque ordenable (migración aditiva + backfill)
`Quiz` gana `order_index`. Backfill: cada quiz existente toma
`order_index = (máx order de los contenidos de su unidad) + 1` (preserva el
comportamiento actual "al final"). La API de detalle de curso devuelve una lista
**`blocks`** unificada (contenidos + quizzes) ordenada por `order_index`; el frontend
la renderiza en orden → video → quiz → texto.

### 4. Inscripciones (migración aditiva + backfill)
Nueva tabla `enrollments (user_id, course_id, enrolled_at, único por par)`. Se crea al
primer acceso al curso (endpoint idempotente `POST /api/courses/{id}/enroll`, llamado al
abrir el curso). Backfill: por cada (user, course) con progreso, una inscripción con
`enrolled_at` = su primer timestamp. Las métricas distinguen **inscrito / activo /
completado**.

## Capabilities

### New Capabilities
- `completion`: definición única y autoritativa de "completado".
- `enrollment`: inscripción a cursos e indicadores inscrito/activo/completado.

### Modified Capabilities
- `content`: bloques de unidad ordenables (contenidos + quizzes) y metadatos.

## Impact

**Backend:**
- `progress/completion.py` (nuevo); consumidores: `progress/service.py` (roadmap),
  `admin/routes.py` (métricas #35/#36), perfil.
- `contents/models.py` (+`title`, +`duration_minutes`) + schema de validación.
- `quizzes/models.py` (+`order_index`) + backfill; `courses/service.py`
  (`get_course_detail` → `blocks`).
- `enrollments` (modelo + tabla) + endpoint enroll + uso en métricas.
- **4 migraciones Alembic aditivas y reversibles** (una por paso 2-4; el paso 1 no migra).

**Frontend:**
- Render de `blocks` ordenados (contenidos + quizzes intercalados) en `CoursePage` /
  `ContentViewer`.
- Llamada a enroll al abrir el curso.
- (Opcional) mostrar título/duración de contenido (ToC / tiempo estimado) — puede
  diferirse a #29 / F5.

**Riesgo: toca datos de producción.** Cada paso es aditivo, reversible y se despliega por
separado; los backfills se prueban contra la forma del dump `backup_prod_2026-07-03.dump`.
