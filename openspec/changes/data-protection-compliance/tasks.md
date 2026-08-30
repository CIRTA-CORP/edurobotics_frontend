# data-protection-compliance (#44) — Ley 21.719

## 1. Backend: consentimiento

- [x] 1.1 Modelo `Consent` + migración aditiva `c9d0e1f2a3b4_add_consents`.
      Verificado: `alembic heads` devuelve un único head, la migración es aditiva.
- [x] 1.2 Registro exige `accept_terms`/`accept_privacy` y guarda el consentimiento en la
      misma transacción. Verificado contra el backend local: sin los campos → 422; con
      ellos → 201 y dos filas de consentimiento con versión `2026-08-30`.
- [x] 1.3 Script one-off `scripts/backfill_consents.py` (usuarios existentes; no corre solo).
      PENDIENTE DE EJECUCIÓN en producción: los usuarios actuales no tienen fila de
      consentimiento hasta que se corra.

## 2. Backend: derechos del titular

- [x] 2.1 `GET /api/users/me/export` — JSON de portabilidad (perfil, consents, matrículas,
      progreso, intentos+respuestas, feedback, actividad de login; sin `password_hash`).
      Verificado en vivo: 7 claves presentes, `password_hash` ausente, 401 sin token.
- [x] 2.2 `DELETE /api/users/me` — supresión con borrado explícito por tabla en una
      transacción. Verificado: mapeadas las 8 clases con columna `user_id`
      (`LoginEvent`, `PasswordResetToken`, `Consent`, `CourseFeedback`, `CourseTeacher`,
      `Enrollment`, `UserProgress`, `QuizAttempt`) y las cubre todas, más
      `QuizAttemptAnswer` vía `attempt_id`. Sin huérfanos. Login posterior → 401.
- [x] 2.3 Rectificación: conservar `PATCH /api/profile` existente (verificado en
      `features/auth/routes.py:180`, no se cambió).

## 3. Frontend

- [x] 3.1 Registro: checkboxes requeridos de Términos y Privacidad (con enlaces).
      Los enlaces abren en pestaña nueva a propósito: en el modal de la landing, navegar
      a los textos legales descartaría lo ya escrito.
- [x] 3.2 Perfil: sección "Privacidad y datos" — Descargar mis datos + Eliminar mi cuenta
      (confirmación → logout → inicio).
- [x] 3.3 Política de privacidad (landingContent): secciones ARCO-P, retención, menores y
      transferencias; datos reales de CIRTA marcados "por completar".

## 4. Verificación

- [x] 4.1 `tests/test_data_protection.py`: flujo completo (ver design.md). 7 tests.
- [x] 4.2 `pytest` verde (93 passed); `npm run build` verde; `npm run lint` sin hallazgos
      nuevos en los archivos tocados (los 43 errores que reporta son preexistentes en
      otros archivos, ajenos a este change).

## Pendiente detectado durante la revisión

- [ ] 5.1 `DELETE /api/users/me` no impide que un admin borre su propia cuenta. Si es el
      único administrador, la plataforma queda sin acceso de administración y no hay
      vuelta atrás. Falta un guard que bloquee el borrado del último admin.

## Diferido (documental/legal)
- RAT del proyecto; protocolo de brechas + responsable/DPO; reglamentos pendientes de la
  ley; revisión legal final de textos por CIRTA.
