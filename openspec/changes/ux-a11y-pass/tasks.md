# ux-a11y-pass (F6) — accesibilidad e idioma del flujo del alumno

## 1. Nivel unificado (arregla "Beginner" + duplicación)

- [x] 1.1 Crear `shared/lib/courseLevel.js` (`COURSE_LEVELS` + `levelOf`).
- [x] 1.2 `LandingPage` deja de pintar `{level}` crudo → usa `levelOf().label`.
- [x] 1.3 Migrar consumidores: `student/CourseGrid`, `roadmap/RoadmapGraph`,
      `courses/CoursePage`, `courses/CoursePreviewPage`. (`CourseForm` es admin, label ya
      correcto y shape distinto → se dejó.)
- [x] 1.4 Verificar cero "Beginner"/inglés en el flujo público.

## 2. Quiz accesible (QuizView)

- [x] 2.1 Contenedor `role="radiogroup"` + `aria-labelledby` al enunciado.
- [x] 2.2 Cada opción `role="radio"` + `aria-checked` + roving `tabIndex`.
- [x] 2.3 Teclado: flechas ↑/↓/←/→ (con wrap) + Espacio/Enter selecciona (nativo del button).
- [ ] 2.4 Probar el quiz completo **solo con teclado** (pendiente prueba manual de Mario).

## 3. Barrido alt / labels / foco

- [x] 3.1 `alt` en imágenes de curso (ya presentes en CourseGrid/RoadmapGraph/Landing; verificado).
- [x] 3.3 Anillo de foco visible consistente y global (`:focus-visible` en `index.css`).
- [ ] 3.2 Auditoría fina de `label`/`aria-label` en inputs (login ya etiquetado; resto opcional).

## 4. Contraste de tarjetas atenuadas

- [x] 4.1 Malla: `dimmed` de `opacity-30`→`opacity-60`; estado/título bloqueado a `text-gray-600`;
      descripción a `text-gray-500` (cumplen AA ≥ 4.5:1).
- [x] 4.2 Se mantiene la señal "no disponible" (grayscale del thumbnail + candado + opacidad).

## 5. Verificación

- [x] 5.1 `npm run build` verde.
- [ ] 5.2 Prueba manual de teclado del quiz (Mario) + verificación visual del contraste.
