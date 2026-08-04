# OpenSpec workflow — EduRobotics

Este proyecto es **spec-driven**. Antes de escribir código para un cambio no
trivial, se crea una propuesta de cambio y se acuerda con Mario.

## Estructura
- `specs/<capacidad>/spec.md` — la verdad actual, ya acordada. `# Purpose` +
  `## Requirements` (frases **SHALL**) + `#### Scenario` (WHEN / THEN / AND THEN).
- `changes/<nombre>/` — un cambio propuesto, ANTES de codear:
  - `proposal.md` — Why / What Changes / Capabilities (New/Modified) / Impact
  - `design.md` — Context / Goals / **Non-Goals** / Decisions
  - `tasks.md` — checklist numerado, se marca `[x]` al implementar
  - `specs/<capacidad>/spec.md` — el delta (`## ADDED` / `## MODIFIED` /
    `## REMOVED Requirements`)
- `changes/archive/AAAA-MM-DD-<nombre>/` — cambios ya completados.

## Flujo
1. Escribir el change (proposal + design + tasks + delta). Obtener el OK de Mario.
2. Implementar siguiendo `tasks.md`, marcando cada tarea al terminarla.
3. Al cerrar: incorporar el delta a `specs/` y mover el change a `archive/` con la
   fecha de hoy.

## Convenciones del repo
- El código del frontend vive en la ruta anidada `edurobotics_frontend/frontend-react`.
- Commits en inglés, imperativo, sin prefijo y **sin coautor**. Nunca push sin permiso.
- El contenido no publicado (`is_published`) nunca es visible para estudiantes.
