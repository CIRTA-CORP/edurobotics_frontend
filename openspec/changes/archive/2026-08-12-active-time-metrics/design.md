## Modelo de acumulación

Se acumula tiempo activo por **(usuario, contenido)** en `user_progress.active_seconds`
(entero, default 0). El scope se agrega por suma:

```
tiempo_activo(unidad,   alumno) = Σ active_seconds de sus contenidos
tiempo_activo(módulo,   alumno) = Σ de sus unidades
tiempo_activo(curso,    alumno) = Σ de sus módulos
```

y la cifra de un scope es la **mediana** entre alumnos (robusta a outliers, igual que hoy),
sobre quienes completaron el scope; el "invertido hasta ahora" pasa a ser la mediana entre
quienes iniciaron. Se conservan los contadores `learners` / `completed`.

## Heartbeat: cómo se cuenta sin poder inflarse

Cliente (mientras `document.visibilityState === 'visible'` y el `ContentViewer` montado):

- `setInterval` cada **15 s** → `POST /api/progress/heartbeat { content_id }`.
- Se **pausa** en `visibilitychange` a hidden y en `blur`; se **reanuda** al volver.
- Se detiene al desmontar / cambiar de unidad.

Servidor:

- Suma un incremento **acotado**: `active_seconds += min(15, ...)`; se acepta a lo más ~20 s
  por llamada para absorber jitter, nunca más. Un cliente que spamea heartbeats no puede sumar
  más que el paso real, porque el server ignora llamadas más frecuentes que ~10 s por contenido
  (se guarda `last_heartbeat` y se descarta el exceso).
- **Guarda de inactividad (opcional, anotada):** si se quiere no contar "pestaña visible pero
  sin interacción", el cliente puede omitir el heartbeat tras N min sin eventos de mouse/teclado/
  scroll. Para el piloto basta el gate de visibilidad; la guarda de inactividad queda como mejora.

Por qué el gate de visibilidad es suficiente para el piloto: el abuso realista (dejar la pestaña
abierta) ya no cuenta porque en segundo plano `visibilityState` es `hidden`. El tope por llamada
cierra el abuso por reintento.

## Métricas: reescritura de `metrics.py`

`_scope_span_seconds` (span de calendario) se reemplaza por `_scope_active_seconds`:

```python
def _scope_active_seconds(scope_rows):
    return float(sum(r.active_seconds or 0 for r in scope_rows))
```

El resto de `_scope_stats` (learners/completed/mediana/rango) se mantiene, solo cambia la
fuente del número. La firma pública `get_course_time_metrics` no cambia → el frontend sigue
consumiendo la misma forma, con valores ahora reales.

## Presentación (CourseTimeMetrics.jsx)

- Cifra principal del curso: **tiempo activo típico** (mediana). Rango mín–máx si `sample ≥ 2`.
- Por módulo/unidad: **tabla** con columnas alineadas — `Parte | Completaron (N de M) | Tiempo típico`
  — en vez del apilado a la derecha actual, que es difícil de escanear.
- Estado sin datos: por unidad, si `active_seconds` sumado es 0 en toda la muestra, mostrar
  "datos insuficientes" en gris, **no** "1 s". Nunca inventar un número.
- Copy: "Tiempo activo real mientras el alumno está en la lección" (se elimina "incluye pausas
  entre sesiones" y el pie de "tienden a ~0").

## Qué NO cambia

- La jerarquía Curso→Módulo→Unidad→Contenido y el resto del panel admin.
- La definición de completitud (`completion.py`); esto es tiempo, no completitud.
- El endpoint `update-access` y `mark-complete` siguen igual; el heartbeat es aditivo.

## Riesgos

- **Inflación de tiempo** → tope por llamada + gate de visibilidad + descarte de heartbeats
  demasiado seguidos.
- **Carga de requests** → 1 request / 15 s por alumno activo; despreciable, y con rate-limit.
- **Cursos históricos sin dato** → se muestran como "insuficiente", no como 0/1 s.
