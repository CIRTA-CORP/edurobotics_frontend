# learning-analytics (#25) — decisiones de diseño

## Instrumentar primero, visualizar después

La tabla `quiz_attempt_answers` solo captura datos desde su deploy. Por eso el change se
ordena así: la migración + escritura en el submit va en el PRIMER commit desplegable,
aunque la UI de analítica llegue después. Cada semana de piloto sin la tabla es data
perdida e irrecuperable.

## Modelo de datos (solo una tabla nueva)

```
quiz_attempt_answers
  id          PK
  attempt_id  FK quiz_attempts.id  ON DELETE CASCADE, index
  question_id FK quiz_questions.id ON DELETE CASCADE, index
  answer_id   FK quiz_answers.id   ON DELETE CASCADE
  is_correct  Bool (denormalizado a propósito: si el admin edita la pregunta después,
              el histórico conserva lo que era correcto EN ese intento)
  created_at  DateTime
```

Escritura dentro de la MISMA transacción del submit del intento: o se guarda el intento
con todas sus respuestas, o nada.

## Cálculo on-demand, sin ETL

Con ~20–100 alumnos de piloto, todos los agregados son queries directas (patrón ya usado
en las métricas admin: conditional counts en pocas queries). NO se crean tablas de
resumen, ni jobs, ni cache más allá del `Cache-Control`/staleTime existentes. Si alguna
query supera ~300 ms en producción (medir con logs), se optimiza ESA query con un índice —
no se precalcula por si acaso.

## Funnel de abandono (definición operativa)

Para un curso: tomar los contenidos en su orden canónico (módulo.order → unidad.order →
contenido.order). Para cada posición i: `pct_i = alumnos que completaron el contenido i /
alumnos inscritos en el curso`. El "punto de abandono" reportado es el mayor
`pct_i − pct_{i+1}`. Simple, explicable a la directora en una frase, y es el mismo funnel
por item que usa la literatura de MOOCs. No intentamos pathing individual (los alumnos
pueden saltarse contenidos; el funnel agregado lo absorbe).

## "Sin actividad reciente" — una sola constante

`INACTIVITY_DAYS = 14` vive junto al servicio de completitud (`progress/`), documentada.
La consumen: analítica (#25), vista profesor (#26) y cualquier métrica futura. Cambiarla
es tocar UN archivo. Señales que cuentan como actividad: heartbeat, cualquier escritura de
progreso, login. 14 días ≈ dos semanas de clases; es umbral de piloto, no verdad
científica — queda anotado así en la UI (tooltip).

## Sesiones desde LoginEvent (aproximación honesta)

"Tiempo entre sesiones" = delta entre logins consecutivos del alumno. "Avance por login" =
contenidos con `completed_at` entre un login y el siguiente. Limitación conocida y
documentada en el endpoint: si el alumno mantiene la pestaña abierta días, un "login" no
equivale a una sesión real. Para el piloto alcanza; sesionización real (por gaps de
heartbeats) queda diferida con nota.

## Guard y recorte por rol

Endpoints bajo `/api/analytics/*` con `require_teacher_or_admin` (#26). El profesor ve
exactamente lo mismo que el admin en esta sección (son métricas de alumnos, no de
plataforma); las métricas de plataforma (usuarios totales, feedback) siguen admin-only
donde ya están.

## Qué NO hacemos (y por qué)

- **Video tracking real**: los videos viven como iframes de YouTube dentro del HTML
  sanitizado de la lección; medir % reproducido exige reescribir el render para montar la
  YouTube IFrame API por video. Costo alto, valor marginal en piloto (el proxy
  `active_seconds` del contenido ya ordena "más visto / menos visto"). Diferido con nota.
- **Predicción de riesgo**: sin volumen de datos, un modelo sería teatro. El umbral fijo
  de 14 días es defendible y explicable.
- **Export CSV / cohortes**: nadie lo pidió aún; se difiere.

## Verificación

- Test: submit de quiz crea attempt + N answers en una transacción; submit inválido no
  deja filas.
- Test: funnel con datos sintéticos conocidos (5 alumnos, abandono plantado en el
  contenido 3) devuelve el punto correcto.
- Test: "sin actividad reciente" respeta las tres señales y el umbral.
- Test: con n < 3 la API marca `insufficient_data: true` y la UI lo muestra.
- `pytest` verde; `npm run build` verde.
