# Endurecimiento P0 + P1 y visibilidad de contraseña

## Why

La revisión de las ramas `feature/7-backend-restructure` y `feature/3-urdf-viewer`
dejó nueve defectos verificados contra el código real. Tres son de prioridad P0
(uno anula por completo la ganancia del visor URDF, otro impide crear un entorno
nuevo, otro permite dejar la plataforma sin administrador) y seis son P1. Además
Mario pide que los campos de contraseña puedan mostrarse con un icono de ojo.

Todos los puntos de esta propuesta se comprobaron ejecutando el código, no
leyéndolo: el bundle se midió con `npm run build`, el 403 del IDOR y el borrado
de cuenta se probaron con peticiones reales, y el fallo de esquema se reprodujo
en la base local.

## What Changes

**P0**

1. **El simulador descarga Babylon sin usarlo.** En `SimulatorPanel.jsx` los dos
   visores están importados al revés: `BabylonViewer` es estático (línea 4) y
   `UrdfViewer` es `lazy` (línea 12). Medido en el build: `Ide-*.js` importa
   estáticamente `vendor-babylon` (1.430 kB gzip) mientras el visor que de verdad
   se renderiza pesa 184 kB gzip. El legacy solo aparece con `?viewer=babylon`,
   pero su coste lo paga toda visita a `/simulator`. Se difiere también Babylon.

2. **Las migraciones no pueden construir una base desde cero.** La baseline
   `9d56f0fed651` está vacía a propósito, como punto de `alembic stamp` para
   adoptar Alembic sobre la base que ya existía (documentado en
   `docs/DESPLIEGUE_MIGRACIONES.md`). Pero eso deja sin cubrir el caso de una base
   nueva: hoy solo funciona porque `init_db()` llama a `create_all()` al arrancar,
   y ese mismo `create_all` es lo que colisionó con Alembic en la base local. Se
   rellena la baseline con el esquema base y se retira `init_db()` del arranque.

3. **El último administrador puede borrar su propia cuenta.** La salvaguarda de
   lockout existe para la degradación de rol (`admin/routes.py:264`) pero no en
   `DELETE /api/users/me` (`auth/routes.py:283`), que borra sin comprobar nada.

**P1**

4. **Serif reintroducido** en los 6 archivos de `admin/tabs/` (viola la regla de
   tipografía). Cero ocurrencias en `feature/2`, así que entró en esta rama.
5. **Los errores de base de datos llegan al cliente con el SQL dentro** (10 sitios
   con `detail=result.get("error")` o `f"Internal error: {str(e)}"`).
6. **Bug de scope en la caché del cliente**: `api.js:20` usa `token.slice(0, 12)`,
   que es el header del JWT e idéntico para todos los usuarios.
7. **Sin límites de longitud** en los schemas Pydantic (la política de contraseña
   sí existe; lo que falta son `max_length` en los campos de texto).
8. **`payload.dict()`** en `units/routes.py:64`, eliminado en Pydantic 3.
9. **Desajuste de puerto**: `main.py` usa 8001, `.env.development.local` apunta a 8000.

**Petición de producto**

10. **Mostrar/ocultar contraseña** con un icono de ojo. Se introduce un
    `PasswordInput` compartido y se usa en los **cuatro** sitios con campos de
    contraseña, no solo dos: registro, login, restablecer contraseña y ajustes de
    perfil. Cubrir solo dos dejaría el gesto inconsistente.

## Capabilities

**New** — ninguna.

**Modified**
- `auth` — visibilidad de contraseña en los formularios.
- `admin-users` — la salvaguarda de lockout cubre también el borrado de cuenta propia.
- `security` — los errores no revelan interno; los campos de texto tienen tope.
- `engineering` — la cadena de migraciones construye una base vacía, y la CI lo verifica.
- `performance` — el simulador solo descarga el visor activo.

## Impact

**Backend** (`edurobotics_backend`)
- `backend/alembic/versions/9d56f0fed651_initial_schema.py` — rellenar baseline.
- `backend/app/main.py` — retirar `init_db()` del lifespan; unificar puerto.
- `backend/app/core/database.py` — retirar `init_db()`.
- `backend/app/features/auth/routes.py` — guard del último admin en el borrado.
- `backend/app/features/*/routes.py` — dejar de propagar `str(e)` (10 sitios).
- `backend/app/features/*/schemas.py` — `max_length` en campos de texto.
- `backend/app/features/units/routes.py` — `model_dump()`.
- `tests/` — casos nuevos: baseline desde cero, lockout por borrado, errores opacos.
- `.github/workflows/ci.yml` — paso que corre `alembic upgrade head` sobre base vacía.

**Frontend** (`edurobotics_frontend/frontend-react`)
- `src/features/simulator/components/SimulatorPanel.jsx` — `lazy` en BabylonViewer.
- `src/shared/components/PasswordInput.jsx` — componente nuevo.
- `src/features/auth/components/{LoginForm,RegisterForm}.jsx`,
  `src/features/auth/pages/ResetPasswordPage.jsx`,
  `src/features/profile/components/ProfileSettings.jsx` — usar `PasswordInput`.
- `src/features/admin/tabs/*.jsx` (6) — retirar el serif.
- `src/shared/services/api.js` — clave de caché por `user_id`.
- `.env.development.local` — alinear con el puerto acordado.

**Riesgo principal**: retirar `init_db()` implica que producción deja de
autocrear tablas. Requiere que el despliegue ejecute `alembic upgrade head`.
Se detalla en `design.md`.
