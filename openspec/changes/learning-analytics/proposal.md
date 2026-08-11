## Why

Issue #25: la directora pidió métricas de seguimiento en cuatro frentes: **progreso**
(tiempo por curso/módulo/unidad, tasa de finalización, dónde abandonan), **interacción**
(tiempo por login, avance por login, días activos, frecuencia, tiempo entre sesiones),
**rendimiento** (promedio por quiz, pregunta más fallada, intentos hasta aprobar) y
**contenido** (videos más vistos / abandonados antes de terminar).

La buena noticia: **la mayoría ya se puede derivar de datos que YA recolectamos** —
`user_progress.active_seconds` (tiempo activo real por heartbeats), `completed_at`,
`enrollments`, `LoginEvent`, `QuizAttempt(score, passed, submitted_at)` y el servicio único
de completitud. Hay exactamente **dos huecos de instrumentación**:

1. **"Pregunta más fallada"**: `QuizAttempt` guarda solo score/passed, NO qué respondió el
   alumno en cada pregunta. Sin una tabla de respuestas por intento, esta métrica es
   imposible — y cada semana sin instrumentarla es data del piloto que se pierde para
   siempre.
2. **Tracking de video** (visto/abandonado): los videos son embeds de YouTube dentro del
   HTML de la lección; medir % de reproducción requiere integrar la YouTube IFrame API.
   `active_seconds` del contenido es un proxy razonable de "tiempo frente al video", no del
   % reproducido.

## What Changes

### Instrumentación nueva (PRIMERO — acumula datos desde ya)

- Tabla `quiz_attempt_answers` (`attempt_id` FK, `question_id` FK, `answer_id` FK,
  `is_correct` Bool, `created_at`). **Migración aditiva y reversible.** Se escribe en el
  submit de quiz que ya existe; los intentos históricos quedan sin detalle (honesto: la
  métrica dice "desde <fecha de deploy>").

### Métricas derivadas (sin instrumentación nueva)

Endpoint(s) de analítica con guard `require_teacher_or_admin` (reusa el guard de #26),
calculados on-demand con agregados SQL (escala de piloto; sin ETL ni tablas precalculadas):

1. **Progreso**: tiempo activo total/promedio/mín/máx por curso/módulo/unidad (suma de
   `active_seconds`, coherente con F5); tasa de finalización = completados / inscritos
   (`enrollments` + servicio de completitud); **funnel de abandono por curso**: % de
   inscritos que completó cada contenido en orden — el mayor salto entre pasos consecutivos
   es "dónde abandonan".
2. **Interacción**: días activos/semana y tiempo entre sesiones desde `LoginEvent`;
   "avance por login" = contenidos completados entre login y login siguiente (aproximación
   por timestamps, documentada como tal).
3. **Rendimiento**: promedio y distribución de score por quiz, intentos hasta aprobar
   (secuencia de `QuizAttempt` por usuario+quiz), y — con la tabla nueva — % de error por
   pregunta ("más fallada").
4. **Contenido**: ranking de contenidos por `active_seconds` totales y por alumnos que lo
   abrieron vs completaron (proxy de "abandonado a medias").

### Definición de "abandono / en riesgo" (única y explícita)

Un alumno está **"sin actividad reciente"** en un curso cuando: está inscrito, el curso no
está completado, y no registra NINGUNA señal (heartbeat, progreso, login) en los últimos
**14 días**. Constante nombrada en un solo lugar; la consumen esta analítica Y la vista de
profesor (#26).

### Honestidad en la UI

Toda tarjeta/tabla muestra **"datos insuficientes"** cuando n < 3 alumnos con señal (nunca
promedios de 1 persona presentados como tendencia), y las métricas que dependen de la tabla
nueva indican su fecha de inicio de recolección.

## Alcance v1 vs diferido

**v1**: todo lo anterior. **Diferido con nota**: tracking real de reproducción de video
(YouTube IFrame API — requiere tocar el render de lecciones y postMessage; el proxy de
`active_seconds` cubre al piloto), exportar CSV, comparativas entre cohortes/clases (no hay
clases aún), y modelos predictivos de riesgo (Moodle-style) — con ~20 alumnos de piloto no
hay data para entrenar nada y sería teatro estadístico.

## Cómo lo resuelven las plataformas de referencia

- **Moodle Learning Analytics**: modelo "students at risk of dropping out" basado en
  indicadores de actividad reciente por ventana de tiempo — nuestra definición de 14 días
  es la versión piloto de ese patrón (umbral fijo en vez de modelo entrenado).
- **Canvas New Analytics**: participación + page views por alumno/curso, con drill-down
  semanal — equivalente a nuestra sección "interacción" via LoginEvent.
- **Coursera** (investigación publicada sobre MOOCs): el funnel de completitud por item
  ordenado es el estándar para "dónde abandonan"; la tasa se reporta sobre inscritos.
- **Khan Academy**: el coach ve "struggling" por skill — el equivalente v1 nuestro es el
  % de error por pregunta y los intentos hasta aprobar.
- **Duolingo**: streaks/días activos — nuestra "días activos por semana" es ese patrón.

## Capabilities

### New Capabilities
- `learning-analytics`: métricas de progreso, interacción, rendimiento y contenido para
  admin/profesor, con instrumentación de respuestas por pregunta.

## Impact

**Backend:** migración `quiz_attempt_answers` + escritura en el submit de quiz existente;
servicio de analítica (agregados SQL) + endpoints con `require_teacher_or_admin`; constante
de "sin actividad reciente" compartida. **Frontend:** sección de analítica en el panel
admin (y su recorte en la vista profesor de #26). Sin dependencias nuevas.

## Riesgo

Medio-bajo. Riesgos concretos: (1) el submit de quiz ahora escribe N filas más — cubrir con
test de que un submit inválido no deja filas huérfanas (transacción); (2) queries de
agregación lentas contra Supabase — mitigado por escala de piloto + índices existentes;
verificar con EXPLAIN si alguna supera ~300 ms; (3) tentación de mostrar números con n=1 —
bloqueada por el requirement de "datos insuficientes".
