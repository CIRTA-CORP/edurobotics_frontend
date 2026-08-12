## Why

El "Tiempo de dedicación" mide el **span de calendario** de un scope: `max(fin) − min(inicio)`
sobre los contenidos del scope (ver `progress/metrics.py`). Eso funciona a nivel curso/módulo
(abarca varias sesiones → "26 min" es creíble), pero **por unidad colapsa a ~0**: como el
progreso solo se registra al abrir y al completar, en una unidad de un solo contenido inicio ≈
fin. El propio pie de la tarjeta lo confiesa: *"Las unidades de un solo contenido tienden a ~0."*

El daño no es cosmético: la directora ve **"1 s" repetido en casi todas las unidades** y eso
erosiona la credibilidad de TODOS los números del panel (si "1 s" es obviamente falso, ¿por qué
creer el "26 min" o el "87.5%"?). Un número que no sabemos medir es peor que no mostrarlo.

Decisión (Mario, 2026-08-05): **medir tiempo activo real** con heartbeats, como hacen las
plataformas serias (Coursera/Duolingo), en vez de inferirlo del span.

## What Changes

### Backend
- `user_progress` gana `active_seconds` (Integer, default 0) — tiempo activo acumulado por
  (usuario, contenido). **Migración aditiva y reversible.**
- Nuevo endpoint `POST /api/progress/heartbeat` (auth de usuario): suma tiempo activo al
  contenido abierto, **acotado por llamada** (se acepta a lo más ~20 s por heartbeat) para que
  no se pueda inflar. Idempotente ante reintentos razonables; rate-limit amistoso.
- `progress/metrics.py` pasa a calcular el tiempo de un scope como **suma de `active_seconds`**
  de sus contenidos (por alumno), y la mediana entre alumnos — reemplaza el span por unidad.
  El curso/módulo también usa suma de activo (coherente en todos los niveles).

### Frontend
- Heartbeat en `ContentViewer`: mientras la pestaña está **visible** (`visibilityState`),
  un `setInterval` de ~15 s hace `POST /heartbeat` del contenido actual; se **pausa al ocultar
  la pestaña / perder foco** y se detiene al desmontar. Así no cuenta tiempo con la pestaña en
  segundo plano.
- Rediseño de `CourseTimeMetrics.jsx`: la cifra pasa a ser **tiempo activo** (no span); tabla
  por módulo/unidad con columnas legibles (Parte · Completaron · Tiempo típico) en vez del
  apilado a la derecha. Copy actualizado ("tiempo activo real", se quita "incluye pausas").

## Capabilities

### New Capabilities
- `time-metrics`: tiempo activo real por contenido/unidad/módulo/curso y su presentación admin.

## Impact

**Backend:**
- `progress/models.py` (+`active_seconds`), migración Alembic aditiva.
- `progress/routes.py` (+`POST /heartbeat`) y `progress/service.py` (acumulación acotada).
- `progress/metrics.py` reescrito a suma de tiempo activo (curso/módulo/unidad).

**Frontend:**
- `features/courses/components/ContentViewer.jsx` (hook de heartbeat visibility-gated).
- `features/progress/services/progress.js` (+`sendHeartbeat`).
- `features/admin/features/courses/CourseTimeMetrics.jsx` (rediseño + copy).

**Datos históricos:** no hay backfill posible (nunca se midió tiempo activo). Los cursos con
actividad previa mostrarán "datos insuficientes" por unidad hasta que se acumule actividad
nueva. Es honesto y esperado; se comunica en la UI. El nivel curso/módulo por span puede
mantenerse como *fallback* transitorio si se decide, pero por defecto se muestra el activo.

**Riesgo:** medio. Migración aditiva/reversible; el heartbeat es acotado por llamada y
visibility-gated (no infla ni por pestaña abierta ni por reintentos). Sin romper el cálculo
actual hasta que la nueva columna tenga datos.
