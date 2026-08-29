# community-forum (#27) — consultas por curso (MVP)

> **Gate previo (bloqueante):** confirmación de la directora de (a) que el MVP entra al
> piloto y (b) quién responde consultas con SLA ~48 h hábiles. Sin (b), el change se
> difiere a post-piloto y NO se implementa.

## 1. Backend

- [ ] 1.1 Migraciones aditivas `course_questions` y `question_replies` (con `hidden`),
      reversibles, probadas contra copia del dump.
- [ ] 1.2 POST pregunta (alumno inscrito, texto plano, rate limit reusando `RateLimiter`).
- [ ] 1.3 GET preguntas+respuestas por curso (oculta `hidden` salvo admin/teacher).
- [ ] 1.4 POST respuesta (usuarios del curso; marca "respuesta del equipo" si rol
      teacher/admin).
- [ ] 1.5 PATCH ocultar/mostrar (solo teacher/admin).
- [ ] 1.6 Contador de consultas sin responder para la vista profesor (#26).

## 2. Frontend

- [ ] 2.1 Pestaña "Consultas" en la página del curso: lista + form. Texto SIEMPRE
      escapado (sin dangerouslySetInnerHTML — es texto plano, no rich text).
- [ ] 2.2 Badge "respuesta del equipo"; estado vacío que invita a preguntar.
- [ ] 2.3 Ocultar (teacher/admin) con confirmación; contador en vista profesor.

## 3. Verificación

- [ ] 3.1 Tests: alumno no inscrito no puede preguntar; rate limit actúa; `hidden` no se
      filtra a alumnos; solo teacher/admin ocultan; respuesta de teacher queda marcada.
- [ ] 3.2 `pytest` verde; `npm run build && npm run lint` verdes.

## Diferido (anotado)
- Hilos anidados, votos, menciones, notificaciones email, adjuntos, edición/borrado
  propio, foro general, espacios alumno↔alumno sin contexto de curso.
