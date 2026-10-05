## Contexto

Ley 21.719 (Chile), vigencia plena el 1 de diciembre de 2026. EduRobotics es el
**responsable del tratamiento** (CIRTA) con datos de menores, y terceros fuera de Chile
como encargados. Este change cubre lo que se puede resolver con código ahora; lo
documental (RAT, brechas, DPO, reglamentos) queda anotado como diferido.

## Goals

- Consentimiento explícito y **registrado** (tipo + versión + fecha) en el registro.
- El titular puede **descargar** sus datos (portabilidad) y **eliminar** su cuenta
  (supresión), sin intervención de soporte.
- Nada de esto rompe el registro ni los flujos existentes; la suite queda verde.

## Non-Goals

- Validación de identidad extra para ejercer derechos (el JWT de sesión es suficiente en
  el piloto; la ley no exige mecanismo específico).
- Anonimización parcial o retención diferida (borrado duro y directo — lo más simple y
  defendible).
- Flujo de consentimiento parental (<14): requiere definir la edad del colegio y el
  reglamento pendiente. Anotado como decisión pendiente, NO implementado.
- Encriptar reposo / migrar proveedores: no es el alcance de este change.
- Reemplazar asesoría legal: los textos los aprueba CIRTA.

## Decisions

### 1. Consentimiento como tabla, no como booleano en users
`consents(user_id, consent_type, version, granted_at, UNIQUE(user_id, consent_type))`:
permite registrar re-consentimientos futuros (nueva versión de políticas) sin migrar
usuarios. El registro exige ambos checkboxes; se insertan en la MISMA transacción que
crea el usuario (o ambos o nada).

### 2. Backfill de usuarios existentes
Los usuarios previos al change nunca marcaron consentimiento. Se crea un script one-off
(`scripts/backfill_consents.py`) que inserta `terms`/`privacy` con la versión actual y
fecha de ejecución, documentando que es un consentimiento implícito por uso (base
transitoria del piloto). No se ejecuta automáticamente en deploy.

### 3. Export: JSON plano, sin hash, sin datos de otros
`GET /api/users/me/export` devuelve todo lo que el backend guarda DEL titular:
perfil, consents, enrollments, user_progress, quiz_attempts (+ answers), feedback,
login_events (recuento + último). Se excluye `password_hash` explícitamente (test).

### 4. Supresión: borrado explícito en una transacción
`DELETE /api/users/me` borra por tabla (login_events, password_reset_tokens, consents,
enrollments, quiz_attempts, quiz_attempt_answers via attempts, course_feedback,
course_teachers, user_progress) y luego el usuario. Explícito en vez de depender de
`ON DELETE CASCADE` del motor, para que el test de integridad sea determinista.

### 5. Endpoints bajo `/api/users/me/*` con el guard de sesión
Solo el titular puede exportar/borrar (admin NO puede borrar otros por esta vía; la
gestión de usuarios sigue aparte). `get_current_user_from_token` como dependencia.

## Verificación

- Registro sin checkboxes → 400; con checkboxes → filas en `consents`.
- Export contiene progreso/attempts/consents y NO contiene `password_hash`.
- Delete elimina usuario y TODAS las filas asociadas (progreso, matrícula, intento,
  respuesta, login event, feedback, consent, token de reset).
- Sin token → 401 en export/delete.
- `pytest` verde; `npm run build && npm run lint` verdes.
