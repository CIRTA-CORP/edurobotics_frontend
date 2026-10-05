# Proposal — Analítica del panel: datos correctos, rápida y con gráficos

## Why

Mario quiere saber si el Dashboard y la Analítica sirven, y por qué tardan 2–3 s en
mostrar algo. Revisados el código y producción (conteos agregados de solo lectura,
2026-10-05), hay tres problemas, y el orden importa: un gráfico de un número mal calculado
convence más y engaña más.

**Los números no dicen lo que parecen.**

1. **Los administradores cuentan como alumnos.** Las métricas de interacción cuentan los
   inicios de sesión de todas las cuentas: de 131 en total, **83 son de administradores**,
   41 de alumnos y 7 del profesor; en los últimos 28 días, **22 de administradores y 2 de
   alumnos**. Además hay 9 matrículas de administradores y profesores que suman en
   «inscritos», en el embudo y en la lista de inactivos, más 3 de los 22 intentos de
   evaluación y 20 contenidos completados.
2. **«Aprobación media» muestra el puntaje promedio**, no cuántos aprobaron.
3. **«Aprobación» se calcula por intento**, no por alumno: quien aprueba al tercer intento
   cuenta como 33 %.
4. **Los días están corridos.** El backend agrupa por día UTC (23 de 131 inicios de sesión
   caen de noche en Chile y se cuentan al día siguiente), y el frontend escribe cada
   etiqueta un día antes.
5. **«Datos insuficientes» tapa demasiado**: si una de tres consultas tiene pocos datos,
   oculta todos los números del curso; y en evaluaciones cuenta intentos, no alumnos.
6. **«Activos · hoy» son las últimas 24 h.**
7. **«Días activos por semana»** promedia también a quien no entra hace meses.

**Tarda porque hace demasiados viajes a la base.** Cada consulta va de Railway a Supabase
(São Paulo) y vuelve: `/api/courses`, con una sola consulta, tarda ~0,4–0,5 s más que
`/api/health`, que no toca la base. Las consultas van en serie: el progreso de un curso
hace **26**, la Analítica suma **52** y el Dashboard **23**, y cada endpoint vuelve a cargar
la estructura del curso por su cuenta. Nada se guarda entre visitas: cada vez se calcula
todo de cero.

**No hay gráficos que respondan preguntas.** El backend ya calcula el embudo por
contenido, su mayor caída y la distribución de puntajes, y la pantalla no los muestra. Con
47 alumnos (entre 3 y 18 por curso) y menos de un inicio de sesión de alumno por día, una
serie diaria es casi toda ceros: sirven más los gráficos de embudo, de distribución del
avance y de puntajes, y la actividad por semana.

## What Changes

**Fase 1 — Datos correctos**
- Toda la analítica cuenta **solo alumnos** (`role = student`), en un único lugar.
- «Aprobación» por alumno; el puntaje promedio se llama puntaje promedio.
- Los días se agrupan en la hora de Chile (`America/Santiago`), y el frontend lee las
  fechas como fechas locales.
- «Datos insuficientes» por sección y contando alumnos.
- «Activos · hoy» desde la medianoche de Chile.
- «Días activos por semana» entre los alumnos que entraron en esas 4 semanas.

**Fase 2 — Rápida**
- Una consulta por pantalla de curso (`/api/analytics/courses/{id}/overview`) que carga la
  estructura del curso una sola vez y hace lotes en vez de consultas sueltas.
- Caché en el servidor de 60 s, con la hora del cálculo visible («actualizado hace 1 min»).
- En el navegador, los últimos datos se muestran al instante mientras se refrescan.

**Fase 3 — Gráficos** (con Observable Plot empaquetado, no un servicio externo)
- Embudo por contenido con la mayor caída marcada, distribución del avance de los alumnos,
  distribución de puntajes por evaluación y actividad por semana.
- El Dashboard pasa a ser un resumen para la directora, con enlace a la Analítica.

## Capabilities

**Modified**
- `learning-analytics` — población (solo alumnos), aprobación por alumno, días locales,
  datos insuficientes por sección, rendimiento y gráficos.

## Impact

- **Backend**: `analytics/service.py`, `admin/routes.py`, `progress/metrics.py`,
  `core/clock.py`; dependencia nueva `tzdata` (la base oficial de zonas horarias, sin
  dependencias propias: en Windows y en imágenes mínimas no viene incluida).
- **Frontend**: `AnalyticsTab.jsx`, componentes del Dashboard; en la fase 3,
  `@observablehq/plot`.
- **Sin migraciones**: no cambia el esquema.
- **Los números van a bajar** al quitar a los administradores. No es que la plataforma se
  use menos: es que antes se contaban ustedes.
