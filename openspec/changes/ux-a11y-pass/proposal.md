## Why

EduRobotics es una plataforma para **colegios**, pero la accesibilidad es casi nula (solo
~32 atributos `aria`/`alt` en 128 archivos) y queda una fuga de idioma en la página pública.
Revisión con capturas del flujo del alumno (2026-08-05) confirmó 4 problemas de **código**
(los de contenido —portadas de prueba, typos, doble numeración— los corrige el admin, fuera
de alcance):

1. **"Beginner" en inglés en la landing pública.** `LandingPage` pinta el nivel crudo
   (`{level}` con `capitalize`), mientras el resto de la app mapea `beginner→Principiante`.
   Es lo primero que ve un visitante. Además el mapa nivel→etiqueta está **duplicado en 5+
   archivos** (`LandingPage`, `CourseGrid`, `RoadmapGraph`, `CoursePage`, `CoursePreviewPage`,
   `CourseForm`) → misma corrección de raíz + limpieza.
2. **El quiz no es accesible.** Las opciones son `<button>` planos (`QuizView`): sin
   `role="radiogroup"`/`radio`, sin `aria-checked`, sin navegación por flechas. Un lector de
   pantalla no anuncia que son alternativas ni cuál está elegida.
3. **Falta `alt`/labels/foco visible** en el flujo del alumno (login → dashboard → curso →
   quiz). El login ya tiene foco visible; el resto no está garantizado.
4. **Contraste insuficiente** en las tarjetas atenuadas (cursos bloqueados en la malla y el
   dashboard): texto gris muy claro que probablemente no cumple WCAG AA.

## What Changes

- **Nivel unificado (idioma):** una única fuente `shared/lib/courseLevel.js` con el mapa
  `beginner→Principiante / intermediate→Intermedio / advanced→Avanzado` (label + icono +
  color). Todos los consumidores la usan; se elimina el `{level}` crudo de la landing y las
  5+ copias del mapa.
- **Quiz accesible:** el grupo de opciones pasa a `role="radiogroup"` con `aria-labelledby`
  apuntando al enunciado; cada opción es un `role="radio"` con `aria-checked`, tabindulado
  (roving tabindex) y navegable con **flechas ↑/↓/←/→** y seleccionable con **Espacio/Enter**.
- **Barrido a11y del flujo del alumno:** `alt` significativo en imágenes de curso (o
  `alt=""` decorativo cuando corresponda), `label`/`aria-label` en inputs sin etiqueta, y un
  anillo de **foco visible** consistente (`focus-visible:ring`) en enlaces/botones/opciones.
- **Contraste:** subir los tonos del estado atenuado/bloqueado (texto y badges) hasta cumplir
  **AA (≥ 4.5:1** texto normal**)**, sin perder la señal visual de "no disponible".

## Capabilities

### New Capabilities
- `accessibility`: requisitos de accesibilidad e idioma del flujo de cara al usuario.

## Impact

**Frontend (solo):**
- Nuevo `shared/lib/courseLevel.js`; refactor de `LandingPage`, `student/CourseGrid`,
  `roadmap/RoadmapGraph`, `courses/CoursePage`, `courses/CoursePreviewPage`,
  `admin/.../CourseForm` para consumirlo.
- `courses/components/QuizView.jsx`: radiogroup accesible + teclado.
- Barrido de `alt`/labels/foco en las vistas del alumno (landing, dashboard, malla, curso,
  lección, quiz).
- Ajustes de clases Tailwind de contraste en tarjetas atenuadas (`CourseGrid`, `RoadmapGraph`).

**Sin backend, sin migraciones.** Riesgo bajo: cambios de marcado/estilo y una constante
compartida; se valida con `npm run build` y prueba de teclado del quiz.

## Out of scope (checklist de contenido para el admin)
- Reemplazar las portadas de prueba (banderas), corregir el typo "robotica aplicaada" y quitar
  el "1." escrito dentro de la lista numerada de la unidad "¿Qué es un robot?".
- Auditoría de rutas del panel admin (Inicio/atrás) — se revisa como tarea aparte.
