## Why

Issue #27: la directora pidió "espacios de comunidad, foros, personas que respondan
consultas". Es el más grande y más autónomo de los tres pedidos, y el único donde la
recomendación honesta es **NO construir la versión que sugiere la palabra "foro"**.

## Evaluación honesta (leer antes del What)

Tres razones para no hacer un foro clásico en el piloto:

1. **Moderación con menores.** Los usuarios son escolares. Un espacio de texto libre entre
   menores exige moderación activa (quién revisa, con qué SLA, qué pasa con acoso o datos
   personales publicados). El colegio no tiene un moderador asignado; nosotros tampoco.
   Este es un riesgo de safeguarding, no técnico, y es el argumento decisivo.
2. **Arranque en frío.** Un foro con ~20 alumnos y sin masa crítica se ve vacío. Un foro
   vacío comunica "plataforma muerta" — daña más que no tener foro. Discourse (el estándar
   del rubro) documenta esto como el problema #1 de comunidades nuevas.
3. **Costo real.** Hilos, respuestas anidadas, notificaciones, menciones, edición,
   reportes… es un producto entero. Todo eso compite contra métricas y profesores, que sí
   tienen demanda concreta de la directora HOY.

**Lo que la directora describe** ("personas que respondan consultas") se satisface con algo
mucho más chico: **Consultas por curso** — el alumno pregunta, el profesor/admin responde,
todos los del curso ven la respuesta. Es el patrón Q&A contextual de Piazza y de los
comentarios por lección de Khan Academy, no el foro general de Moodle.

## What Changes (MVP "Consultas" — SOLO si se aprueba para el piloto)

### Backend
- Tabla `course_questions` (user_id, course_id, body Text, created_at, `hidden` Bool) y
  `question_replies` (question_id, user_id, body, created_at, `hidden`). Migraciones
  aditivas y reversibles. **Texto plano** (sin HTML) en v1 — se renderiza escapado, cero
  superficie XSS nueva.
- Endpoints: crear pregunta (alumno inscrito en el curso, rate-limited reusando
  `RateLimiter`), listar por curso, responder (cualquier usuario del curso; la respuesta de
  `teacher`/`admin` se marca como **"respuesta del equipo"** — patrón Piazza de
  instructor answer), ocultar (solo admin/teacher: moderación mínima).
- Sin notificaciones en v1: el profesor ve un contador de "consultas sin responder" en su
  vista (#26).

### Frontend
- Pestaña "Consultas" dentro de la página del curso: lista de preguntas con sus
  respuestas, form de nueva pregunta, badge "respuesta del equipo". Botón ocultar para
  teacher/admin.

### Alcance v1 vs diferido — explícito
**v1**: preguntas y respuestas planas por curso, ocultar, contador para el profesor.
**Diferido con nota**: hilos anidados, votos, menciones, notificaciones por email,
adjuntos, editar/borrar propio, foro general fuera de cursos, y cualquier espacio
alumno↔alumno sin contexto de curso.

## Cómo lo resuelven las plataformas de referencia

- **Piazza**: Q&A por curso con "respuesta del instructor" destacada y separada de las de
  alumnos — el modelo que copiamos, reducido.
- **Khan Academy**: preguntas por lección/video (contextuales, no foro general), con
  moderación y voting a escala — el contexto-por-contenido es v2 natural nuestro.
- **Moodle**: foros por curso con varios tipos (Q&A, estándar); su tipo "Q&A forum"
  confirma que el caso "consulta→respuesta" merece un modelo propio más simple que un foro.
- **Canvas Discussions**: hilos por curso; anidamiento configurable — más de lo que el
  piloto necesita.
- **Discourse**: referencia de por qué NO empezar por foro general (masa crítica,
  moderación, trust levels).

## Capabilities

### New Capabilities
- `course-questions`: consultas por curso con respuesta destacada del equipo y moderación
  mínima (ocultar).

## Impact

**Backend:** 2 tablas nuevas, ~5 endpoints, reuso de `RateLimiter` y guards existentes.
**Frontend:** pestaña en la página del curso + contador en vista profesor. Sin
dependencias nuevas.

## Riesgo

**El riesgo dominante es humano, no técnico**: si nadie responde consultas, la sección
transmite abandono. Condición de salida al piloto (bloqueante, decisión de la directora):
**una persona comprometida a responder con SLA de ~48 h hábiles**. Si no existe, este
change completo se difiere a post-piloto — y eso es mejor producto que un buzón muerto.
Riesgos técnicos: contenido inapropiado (mitigado: texto plano escapado, rate limit,
ocultar, y visibilidad limitada al curso); suplantación no aplica (auth existente).

## Recomendación del orquestador

**Post-piloto, salvo que la directora confirme el responsable de respuestas.** Presentarle
las dos opciones con este trade-off explícito; no construirlo "porque se pidió foro".
