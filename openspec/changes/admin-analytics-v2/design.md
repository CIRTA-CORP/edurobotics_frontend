# Design — Analítica del panel: datos correctos, rápida y con gráficos

## Context

- La analítica se calcula al momento, sin tablas resumen (`analytics/service.py`,
  `admin/routes.py`, `progress/metrics.py`). A escala de piloto eso basta; el problema no es
  el volumen sino la cantidad de viajes a la base.
- Las fechas se guardan en UTC sin zona (`core/clock.py`). Los usuarios están en Chile
  (UTC−3 / UTC−4 según el horario de verano).
- Producción el 2026-10-05: 47 alumnos, 5 administradores, 1 profesor; entre 3 y 18 alumnos
  por curso; 131 inicios de sesión desde julio.

## Goals

- Que cada número cuente lo que dice contar, y solo a alumnos.
- Que el Dashboard y la Analítica respondan en menos de 1 s en una visita normal, y al
  instante al volver a una pantalla ya vista.
- Gráficos que respondan las preguntas de la directora, no adorno.

## Non-Goals

- **Servicios externos de gráficos** (Datawrapper, Flourish, cuadernos de Observable): los
  datos se exportarían a mano, la CSP bloquea su contenido y habría que mandarles datos de
  alumnos.
- **Tablas resumen precalculadas o procesos programados.** Con caché de 60 s basta a esta
  escala; quedan para cuando el volumen lo pida.
- **Guardar la analítica en el navegador** (`localStorage`/`sessionStorage`): incluye
  nombres de alumnos, y la plataforma se usa en computadores compartidos.
- **Cambiar qué se registra.** Solo cambia cómo se cuenta lo que ya existe.
- **Tiempo real.** Un minuto de retraso es aceptable para un panel de seguimiento.

## Decisions

### Fase 1 — Datos correctos

#### 1. Una sola definición de «alumno»

`auth/roles.py` expone `student_ids(db)`: la consulta de los `User.id` con
`role = "student"`. Toda agregación de la analítica y del Dashboard filtra con ella:
matrículas, contenidos completados, tiempo activo, intentos de evaluación, respuestas por
pregunta, inicios de sesión. Se usa el rol **actual**: un alumno que pasa a profesor deja de
contar, que es lo esperable.

La lista «Sesiones recientes» del Dashboard sigue mostrando todas las cuentas (sirve para
ver quién entra), pero cada fila dice su rol, y los contadores de arriba son solo alumnos.

#### 2. Aprobación por alumno

Por evaluación: alumnos que la intentaron, alumnos que la aprobaron (en cualquier intento) y
`pass_rate` = aprobados / intentaron. El puntaje promedio sobre todos los intentos se
conserva, con su nombre. La tarjeta del curso pasa de «Aprobación media» (que era el
puntaje) a «Aprobación»: pares alumno–evaluación aprobados sobre intentados. El total del
Dashboard usa la misma regla.

#### 3. Días en la hora de Chile

`APP_TIMEZONE` (por defecto `America/Santiago`) y dos funciones en `core/clock.py`: el día
local de un instante UTC, y el instante UTC de la medianoche local de hoy. El gráfico por
día y «hoy» las usan. Hace falta `tzdata`: Python en Windows y las imágenes mínimas no traen
la base de zonas horarias.

En el frontend, una fecha `AAAA-MM-DD` se lee como fecha local (`new Date(a, m − 1, d)`),
no con `new Date("AAAA-MM-DD")`, que la interpreta como medianoche UTC: en Chile eso es el
día anterior.

#### 4. «Datos insuficientes» por sección y contando alumnos

Cada bloque decide por sí mismo, con menos de 3 **alumnos** como umbral: progreso
(matriculados), evaluaciones (alumnos que intentaron), contenidos (alumnos con actividad),
interacción (alumnos con inicios de sesión). Si un bloque no alcanza, ese bloque lo dice; los
demás muestran sus números.

#### 5. «Activos · hoy» desde la medianoche de Chile

No las últimas 24 h, que a las 9 de la mañana incluyen la tarde de ayer.

#### 6. «Días activos por semana» entre quienes entraron

Promedio sobre los alumnos con al menos un inicio de sesión en las últimas 4 semanas, y se
dice sobre cuántos. Promediar a quien no entra hace meses daba un número que no describe a
nadie.

### Fase 2 — Rápida

#### 7. Una petición por pantalla de curso, en lotes

`GET /api/analytics/courses/{id}/overview` devuelve progreso, rendimiento, contenidos y
opiniones del curso en una respuesta. Carga la estructura del curso **una vez** y la pasa a
cada cálculo; las consultas sueltas se reemplazan por consultas agrupadas. Meta: **10
consultas o menos** por pantalla, fijada con un test que cuenta las consultas, para que no
vuelva a crecer sin que nadie lo note. Los endpoints actuales se mantienen mientras algo los
use.

#### 8. Caché de 60 s en el servidor

Por endpoint y por curso, en la memoria del proceso (hay un solo worker, como la fila del
simulador; si se escala, se mueve a un almacén compartido). El permiso se comprueba
**antes** de mirar la caché, así un profesor nunca recibe datos de un curso ajeno. Cada
respuesta lleva `computed_at`, y la pantalla dice «actualizado hace N min».

#### 9. En el navegador: al instante al volver, sin guardar nada en disco

React Query mantiene los datos en memoria mientras la pestaña está abierta: volver a una
pantalla ya vista muestra lo último al instante y refresca por detrás. Al entrar al panel se
piden por adelantado el Dashboard y la Analítica del curso seleccionado. Al cambiar de curso
se mantiene lo anterior hasta que llega lo nuevo, en vez de vaciar la pantalla.

#### 10. La región de Railway

Railway no tiene región en Sudamérica; la más cercana a Supabase (São Paulo) es US East.
**Datos insuficientes** sobre la región actual del backend: si es US West, moverlo a US East
acorta cada viaje a la base. Lo revisa Mario en Railway → Settings.

### Fase 3 — Gráficos

#### 11. Observable Plot, empaquetado

`@observablehq/plot` dentro de la aplicación, como Monaco: nada se pide a un tercero y
funciona con la CSP. Cada gráfico tiene título que dice la conclusión, sus números
accesibles (no solo en la imagen) y los colores de la paleta del panel.

| Pregunta | Gráfico |
|---|---|
| ¿Dónde abandonan el curso? | embudo por contenido, con la mayor caída marcada |
| ¿Cuántos van al día y cuántos están atascados? | distribución del avance de los alumnos (0, 25, 50, 75, 100 %) |
| ¿La evaluación está bien calibrada? | distribución de puntajes por evaluación |
| ¿Se usa la plataforma? | inicios de sesión de alumnos por semana |

#### 12. El Dashboard como resumen

Tres o cuatro cifras de alumnos (activos esta semana, avance, evaluaciones aprobadas,
inactivos) y un enlace a la Analítica, en vez de repetir números que la Analítica ya
muestra mejor.
