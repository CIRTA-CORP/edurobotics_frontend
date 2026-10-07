# Tasks — Analítica del panel: datos correctos, rápida y con gráficos

Ramas: `feature/9-analytics` en los dos repositorios.

## 1. Datos correctos (fase 1)

- [x] 1.1 `auth/roles.py`: `student_ids()`, la única definición de «alumno»
- [x] 1.2 Analítica de curso solo con alumnos: matriculados, embudo, inactivos, contenidos,
      tiempo activo, evaluaciones y respuestas por pregunta
- [x] 1.3 Interacción solo con alumnos; días activos entre quienes entraron en 4 semanas
- [x] 1.4 Aprobación por alumno, por evaluación y en la tarjeta del curso
- [x] 1.5 `core/clock.py`: día local y medianoche local (`APP_TIMEZONE`, `tzdata`);
      sesiones por día y «activos hoy» con ellas
- [x] 1.6 Dashboard (`/api/admin/metrics`, `/courses/metrics`, `/sessions`): contadores solo
      de alumnos, aprobación por alumno, la lista reciente con el rol de cada cuenta. Las
      claves `*_24h` quedan como alias de las de «hoy» hasta publicar el frontend nuevo
- [x] 1.7 «Datos insuficientes» por sección, contando alumnos
- [x] 1.8 Frontend: fechas locales en el gráfico, avisos por sección, etiquetas que dicen lo
      que se calcula (verificado en el navegador contra el backend local)
- [x] 1.9 Tests: 7 nuevos (169 en total); **los 7 fallan con el código anterior**
- [x] 1.10 Comparación en producción, conexión de solo lectura, código anterior frente al
      nuevo: activos 7 días 5 → 1, ingresos 7 días 10 → 1, ingresos 28 días 27 → 2,
      aprobación 81,8 % (por intento) → 100 % (los 12 alumnos que rindieron aprobaron),
      curso 14 matriculados 22 → 18, cursos 21 y 23 solo tenían al equipo (3 y 1 → 0)

## 2. Rápida (fase 2)

- [x] 2.1 `GET /api/analytics/courses/{id}/overview` con la estructura del curso cargada
      una sola vez (`analytics/course_data.py`)
- [x] 2.2 Consultas agrupadas en vez de sueltas: 7 a 13 por curso en producción (antes ~48
      entre las tres secciones); test que falla si pasa de 15 o si crece de 3 a 120
      contenidos. Comprobado en producción, solo lectura: **cero diferencias** con la versión
      anterior en los 10 cursos
- [x] 2.3 Caché de 60 s en el servidor (`core/cache.py`), con el permiso comprobado antes;
      `computed_at`. También para los tres endpoints del Dashboard
- [x] 2.4 Frontend: una petición por pantalla de curso, precarga al entrar al panel,
      mantener lo anterior al cambiar de curso, «actualizado hace N min». Verificado: curso
      precargado en 5 ms, volver a un curso visto no hace peticiones
- [x] 2.4b CORS: el navegador recuerda la comprobación previa 2 h en vez de 10 min (cada una
      era otro viaje completo a Railway)
- [ ] 2.5 Medir en producción el tiempo de cada pantalla, antes y después (tras desplegar)
- [ ] 2.6 **Mario:** revisar la región del backend en Railway (US East es la más cercana a
      Supabase)

## 2b. Uso de la plataforma por rol

- [x] 2b.1 `/api/admin/sessions`: `by_role` con cuentas, activos hoy, activos en 7 días e
      ingresos en 7 días por rol, en una consulta agrupada
- [x] 2b.2 `/api/admin/users`: último ingreso de cada cuenta, en una consulta
- [x] 2b.3 Dashboard: «Uso de la plataforma por rol»; Usuarios: columna «Último ingreso»
      (verificado en el navegador)
- [x] 2b.4 Tests: 2 nuevos (176 en total)

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
