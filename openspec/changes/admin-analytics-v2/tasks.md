# Tasks — Analítica del panel: datos correctos, rápida y con gráficos

Ramas: `feature/9-analytics` en los dos repositorios.

## 1. Datos correctos (fase 1)

- [ ] 1.1 `auth/roles.py`: `student_ids(db)`, la única definición de «alumno»
- [ ] 1.2 Analítica de curso solo con alumnos: matriculados, embudo, inactivos, contenidos,
      tiempo activo, evaluaciones y respuestas por pregunta
- [ ] 1.3 Interacción solo con alumnos; días activos entre quienes entraron en 4 semanas
- [ ] 1.4 Aprobación por alumno, por evaluación y en la tarjeta del curso
- [ ] 1.5 `core/clock.py`: día local y medianoche local (`APP_TIMEZONE`, `tzdata`);
      sesiones por día y «activos hoy» con ellas
- [ ] 1.6 Dashboard (`/api/admin/metrics`, `/courses/metrics`, `/sessions`): contadores solo
      de alumnos, aprobación por alumno, la lista reciente con el rol de cada cuenta
- [ ] 1.7 «Datos insuficientes» por sección, contando alumnos
- [ ] 1.8 Frontend: fechas locales en el gráfico, avisos por sección, etiquetas que dicen lo
      que se calcula
- [ ] 1.9 Tests: administradores y profesores no cuentan, aprobación por alumno, días
      locales cerca de medianoche, aviso por sección
- [ ] 1.10 Comparar en producción, antes y después, las cifras que cambian

## 2. Rápida (fase 2)

- [ ] 2.1 `GET /api/analytics/courses/{id}/overview` con la estructura del curso cargada
      una sola vez
- [ ] 2.2 Consultas agrupadas en vez de sueltas; test que falla si una pantalla pasa de 10
      consultas
- [ ] 2.3 Caché de 60 s en el servidor, con el permiso comprobado antes; `computed_at`
- [ ] 2.4 Frontend: una petición por pantalla de curso, precarga al entrar al panel,
      mantener lo anterior al cambiar de curso, «actualizado hace N min»
- [ ] 2.5 Medir en producción el tiempo de cada pantalla, antes y después
- [ ] 2.6 **Mario:** revisar la región del backend en Railway (US East es la más cercana a
      Supabase)

## 3. Gráficos (fase 3)

- [ ] 3.1 `@observablehq/plot` empaquetado; comprobar que funciona con la CSP publicada
- [ ] 3.2 Embudo por contenido con la mayor caída marcada
- [ ] 3.3 Distribución del avance de los alumnos
- [ ] 3.4 Distribución de puntajes por evaluación
- [ ] 3.5 Inicios de sesión de alumnos por semana
- [ ] 3.6 Dashboard como resumen con enlace a la Analítica
- [ ] 3.7 Revisión visual en escritorio y a 390 px; números accesibles fuera de la imagen

## 4. Cierre

- [ ] 4.1 Build, ESLint y tests sin hallazgos nuevos
- [ ] 4.2 Volcar el delta en `openspec/specs/` y archivar
