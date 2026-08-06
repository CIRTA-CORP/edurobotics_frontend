## Why

`openspec/specs/` está vacío: solo los cambios nuevos (F0–F4) tienen spec, pero el ~95%
del sistema existente no tiene una "verdad" base contra la cual diffear los cambios
futuros. Sin ese baseline, OpenSpec pierde la mitad de su valor. (F7 del ROADMAP.)

Además, la revisión de código señaló contratos de API débiles (endpoints que devuelven
dicts a mano en vez de `response_model`, servicios que devuelven `{"success": bool}` en
vez de excepciones tipadas, y prefijos de ruta inconsistentes).

## What Changes

**Ahora (seguro, alto valor):**
- **Backfill de `openspec/specs/`** con las capacidades núcleo: `auth`, `courses`,
  `content`, `progress`, `specializations`, más consolidar las capacidades ya
  especificadas en los changes F0–F4 (`security`, `completion`, `enrollment`,
  `admin-users`, `roadmap`, `engineering`). Documentación, sin tocar código.

**Diferido (oportunista, post-piloto — NO ahora):**
- `response_model` Pydantic en los endpoints: es un big-bang que puede romper
  serialización si un modelo no calza con el dict; mejor hacerlo al tocar cada endpoint.
- Servicios que lanzan excepciones tipadas en vez de `{"success": bool, "error": str}`.
- Unificar prefijos (`/register`, `/admin/promote` → `/api/...`) con alias de
  compatibilidad hasta desplegar front y back juntos.

## Capabilities

### New Capabilities
- _(ninguna — este change documenta las existentes)_

## Impact

- Solo `openspec/specs/` (documentación). **Sin cambios de código, sin migraciones,
  sin riesgo.** El refactor de código queda anotado como trabajo oportunista.
