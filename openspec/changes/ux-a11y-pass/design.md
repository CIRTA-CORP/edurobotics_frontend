## 1. Constante de nivel compartida

Hoy el mapa nivel→{label, icon, color} está copiado en ≥6 lugares y la landing ni siquiera
lo usa (pinta `{level}` crudo → "Beginner"). Se crea:

```js
// shared/lib/courseLevel.js
import { GraduationCap, Zap, Trophy } from 'lucide-react'
export const COURSE_LEVELS = {
  beginner:     { label: 'Principiante', icon: GraduationCap, color: '…' },
  intermediate: { label: 'Intermedio',   icon: Zap,           color: '…' },
  advanced:     { label: 'Avanzado',      icon: Trophy,        color: '…' },
}
export const levelOf = (lvl) => COURSE_LEVELS[lvl] || COURSE_LEVELS.beginner
```

Cada vista importa `levelOf(course.level)` en vez de redefinir el mapa. Los colores se
mantienen por-vista si difieren (badge vs dot vs pill) exponiendo variantes, pero el **label
es único** — así "Beginner" desaparece de raíz y no puede volver a divergir.

## 2. Quiz accesible (QuizView)

El contenedor de opciones pasa a:

```jsx
<div role="radiogroup" aria-labelledby={`q-${question.id}`}>
  {answers.map((a, i) => (
    <button role="radio" aria-checked={isSelected}
            tabIndex={isSelected || (nothingSelected && i === 0) ? 0 : -1}
            onKeyDown={handleRoving} onClick={...}>
      …
    </button>
  ))}
</div>
```

- **Roving tabindex:** solo la opción activa (o la primera si nada elegido) es tabbable; el
  resto `tabIndex=-1`. Tab entra/sale del grupo; las **flechas** mueven entre opciones.
- **Teclado:** ↑/← anterior, ↓/→ siguiente (con wrap), **Espacio/Enter** selecciona. Al mover
  con flecha se enfoca y (patrón estándar de radiogroup) se selecciona la opción.
- El enunciado recibe `id="q-<id>"` para el `aria-labelledby`.
- Se conserva el look actual (el círculo relleno sigue siendo la señal visual); solo se agrega
  semántica y teclado. Nada de backend.

## 3. Barrido de alt / labels / foco

- **Imágenes de curso:** `alt={course.title}` donde la imagen aporta info; `alt=""` cuando es
  puramente decorativa (evita ruido en lectores de pantalla).
- **Inputs sin label visible** (ej. búsqueda/toggles): agregar `<label>` asociado o `aria-label`.
- **Foco visible:** clase utilitaria consistente `focus-visible:outline-none
  focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2` en enlaces,
  botones y opciones del flujo del alumno. El login ya lo tiene; se extiende al resto.

## 4. Contraste de tarjetas atenuadas

Los estados "bloqueado/dimmed" usan grises muy claros (`text-gray-300/400`, opacidades bajas)
sobre fondo claro → por debajo de AA. Se sube a tonos que cumplan **≥ 4.5:1** (p. ej.
`text-gray-500/600` para texto, badges con fondo suficiente), manteniendo la diferencia
visual con las tarjetas activas mediante **opacidad del thumbnail + candado**, no mediante
texto ilegible. Se verifica con un checker de contraste sobre las combinaciones finales.

## Qué NO cambia
- La estética general, el layout, los flujos, el copy (salvo el "Beginner").
- El backend, rutas, datos.
- La lógica del quiz (evaluación, guardado): solo su marcado/teclado.

## Verificación
- Quiz operable **solo con teclado** (Tab al grupo, flechas, Espacio/Enter, y seguir a
  Siguiente) — criterio de aceptación de F6.
- `npm run build` verde.
- Cero "Beginner"/inglés en el flujo público.
- Contraste AA en los textos de estado de las tarjetas.
