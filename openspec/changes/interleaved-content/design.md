## Contexto

`ContentViewer` recibe `unit` con `unit.contents` (cada uno con `order_index`,
`content_type`, `content_value`) y `unit.quizzes`. Hoy hace:

```
richContent      = contents.find(rich_text)      // hoisted arriba
simulatorContent = contents.find(simulator)      // renderizado al final
legacyContents   = contents.filter(no rich_text ni simulator)  // en medio
```

y pinta: `rich_text` → `legacy[]` → `simulator` → `quiz`. El `order_index` solo se usa
dentro de `legacy[]`, así que el orden autoral global se pierde.

## Decisión: una sola lista ordenada

Renderizar `contents` ordenados por `order_index` en un único `.map`, con un dispatcher
por `content_type`:

```jsx
const blocks = [...(unit?.contents || [])]
  .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))

blocks.map(block => <UnitBlock key={block.id} block={block} ... />)
```

`UnitBlock` despacha:
- `rich_text` → documento TipTap (ToC + `injectHeadingIds` + `sanitizeHtml`), igual que hoy
  pero por-bloque. La ToC se calcula sobre el/los bloque(s) rich_text presentes.
- `text`/`video`/`image`/`file`/`resource` → el `ContentBlock` actual (ya existe).
- `simulator` → la tarjeta de simulador actual (extraída a su propio bloque).

## Tabla de contenidos (ToC)

Hoy la ToC asume **un** `rich_text`. Con render en orden puede haber ≥1 documento rich.
Decisión pragmática: la ToC agrega los encabezados de **todos** los bloques `rich_text` de
la unidad, en orden, con ids únicos por bloque (`heading-<blockId>-<i>`) para no colisionar.
Se mantiene la regla actual de no mostrar ToC con < 2 encabezados. La ToC se pinta una vez,
al inicio de la tarjeta de contenido (comportamiento actual), no por-bloque.

## Qué NO cambia

- La compuerta del quiz al final (desbloqueo tras completar contenido) — es la pedagogía
  actual y la intención del producto; intercalar quizzes es otro change.
- El marcado de completitud, `updateAccess`, la navegación entre unidades, el modal de
  feedback: intactos.
- El backend: ninguna llamada nueva ni cambio de forma de datos.

## Riesgos y mitigación

- **Colisión de ids de encabezado** entre múltiples rich_text → ids namespaced por bloque.
- **Regresión visual del caso común** (un rich_text + quiz) → ese caso produce exactamente
  la misma salida (un bloque rich arriba, quiz abajo); se valida a ojo.
- **Estado vacío** → se conserva la condición actual (sin bloques ni quiz ni simulador).
