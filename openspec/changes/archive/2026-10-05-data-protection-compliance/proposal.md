## Why

Issue #44: cumplimiento de la **Ley 21.719** de Protección de Datos Personales (Chile), que
entra en plena vigencia el **1 de diciembre de 2026**. EduRobotics trata datos de estudiantes
(probablemente menores), docentes y administrativos: registro, progreso, intentos de quizzes,
inicios de sesión y feedback — además de operar con proveedores fuera de Chile (Supabase,
Railway, Vercel, Fly.io, Resend).

Hoy la plataforma no puede ejercer la mayoría de los derechos que la ley exige:

- **No hay consentimiento registrado**: el registro no pide aceptar términos ni política de
  privacidad, y no queda evidencia de cuándo/que versión se aceptó.
- **No hay supresión**: no existe forma de eliminar una cuenta ni sus datos.
- **No hay portabilidad**: el titular no puede descargar sus datos.
- **Rectificación**: parcial (solo nombre/apellido vía `PATCH /api/profile`).
- **Documentación**: las políticas legales tienen datos de CIRTA "por completar" y no
  describen derechos ARCO-P, retención ni tratamiento de menores.

## What Changes

### Backend
- Modelo `Consent` (user_id, tipo `terms`/`privacy`, versión, fecha) + migración aditiva.
- El registro exige `accept_terms` y `accept_privacy` (booleanos) y **guarda el
  consentimiento** en la misma transacción que crea el usuario. Backfill: los usuarios
  existentes se marcan como consentidos en la primera versión (decisión documentada).
- `GET /api/users/me/export` — portabilidad: JSON con perfil, consentimientos, matrículas,
  progreso, intentos de quiz (con respuestas), feedback y actividad de login. **Nunca** el
  hash de contraseña.
- `DELETE /api/users/me` — supresión: borra usuario y todos sus datos asociados (progreso,
  matrículas, intentos, respuestas, login events, feedback, asignaciones, tokens de reset,
  consentimientos) en una transacción. Explícito, sin depender de cascadas del motor.
- Rectificación: se conserva el `PATCH /api/profile` existente (verificado en el change).

### Frontend
- Registro: dos checkboxes requeridos (Términos / Privacidad) con enlaces a las páginas
  legales.
- Perfil: sección "Privacidad y datos" con **Descargar mis datos** (JSON) y **Eliminar mi
  cuenta** (confirmación, logout y redirección).
- Política de privacidad (editable en Landing): secciones de derechos ARCO-P (cómo
  ejercerlos), retención, datos de menores y transferencias internacionales. Los datos
  reales de CIRTA (razón social, RUT, domicilio, representante) quedan marcados "por
  completar" — los completa CIRTA.

### Diferido con nota (documental/legal, fuera del código)
- RAT (registro de actividades de tratamiento) como documento del proyecto.
- Protocolo de notificación de brechas + responsable designado (¿DPO?).
- Reglamentos pendientes de la ley (menores, transferencias): se adoptan cuando se
  publiquen.
- Revisión final de textos legales por abogado — este change prepara estructura y contenido
  base, no reemplaza asesoría legal.

## Capabilities

### New Capabilities
- `data-protection`: consentimiento registrado, portabilidad y supresión de datos
  personales, alineadas con la Ley 21.719.

## Impact

**Backend:** 1 tabla nueva + migración; 2 endpoints nuevos; registro extendido; tests.
**Frontend:** registro, perfil y textos de la política de privacidad. Sin dependencias nuevas.

## Riesgo

Bajo-medio. Riesgos concretos: (1) borrar mal (datos huérfanos) — mitigado con borrado
explícito y tests de integridad; (2) romper el registro existente — mitigado con backfill y
tests del flujo completo; (3) alcance legal — se declara explícitamente qué es código y qué
queda documental.
