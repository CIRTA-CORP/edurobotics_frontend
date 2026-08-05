# F7 — acotado a lo seguro: backfill de specs base. El refactor de código queda oportunista.

## 1. Specs base de capacidades núcleo (nuevas) ✅

- [x] 1.1 `specs/auth/spec.md`
- [x] 1.2 `specs/courses/spec.md`
- [x] 1.3 `specs/content/spec.md`
- [x] 1.4 `specs/progress/spec.md`
- [x] 1.5 `specs/specializations/spec.md`

## 2. Consolidar capacidades ya especificadas en F0–F4 ✅

- [x] 2.1 `specs/security` (F1), `specs/completion` + `specs/enrollment` (F3),
      `specs/admin-users` (F2), `specs/roadmap` (F4), `specs/engineering` (F0).

## 3. Diferido (anotado, oportunista — NO ahora)

- [ ] 3.1 `response_model` por endpoint (al tocar cada uno).
- [ ] 3.2 Excepciones tipadas en servicios.
- [ ] 3.3 Unificar prefijos de ruta con alias de compatibilidad.

## 4. Verificación

- [x] 4.1 `specs/` cubre 11 capacidades núcleo; los futuros changes ya tienen baseline.
