# Tasks — Endurecimiento P0 + P1 y visibilidad de contraseña

Orden pensado para que cada bloque sea un commit por tema (regla de commits
separados). Los bloques 1–3 son P0, 4–9 son P1, 10 es la petición de producto.

## P0

### 1. Diferir el visor Babylon
- [x] 1.1 En `SimulatorPanel.jsx`, pasar `BabylonViewer` a `lazy()` como ya está
      `UrdfViewer`, y envolver la rama del visor en el `Suspense` existente.
- [x] 1.2 Revisar `RobotComparePage.jsx`: muestra los dos a la vez, así que ahí
      Babylon sí se necesita — comprobar que sigue funcionando.
- [x] 1.3 `npm run build` y confirmar en la salida que `vendor-babylon` ya **no**
      es import estático de `Ide-*.js` (hoy sí lo es).

### 2. Baseline de Alembic ejecutable + retirar `create_all` del arranque
- [x] 2.1 Rellenar `upgrade()` de `9d56f0fed651` con las 12 tablas base, **sin**
      las columnas ni índices que añaden migraciones posteriores (tabla en
      `design.md` §1).
- [x] 2.2 Escribir `downgrade()` soltando las 12 en orden inverso de dependencia.
- [x] 2.3 Retirar `init_db()` de `main.py` (lifespan) y de `core/database.py`.
- [x] 2.4 Verificar en base vacía: `alembic upgrade head` desde cero, y comprobar
      que el esquema resultante coincide con los modelos.
- [x] 2.5 Verificar que **no** cambia nada en una base ya sellada: `alembic current`
      sobre la local sigue en head y `upgrade head` no aplica nada.
- [x] 2.6 Añadir a `ci.yml` un paso que cree una base vacía, corra
      `alembic upgrade head` y falle si el esquema no coincide con los modelos.
- [x] 2.7 Actualizar `docs/DESPLIEGUE_MIGRACIONES.md`: el despliegue ahora
      **debe** correr `alembic upgrade head`, y la baseline ya construye desde cero.

### 3. Guard del último administrador en el borrado de cuenta
- [x] 3.1 En `DELETE /api/users/me` (`auth/routes.py:283`), rechazar con 400 si
      quien borra es admin y `admin_count <= 1`, reutilizando la comprobación de
      `admin/routes.py:264`.
- [x] 3.2 Extraer esa comprobación a un helper compartido para que no queden dos
      copias divergentes.
- [x] 3.3 Test: el único admin recibe 400 al borrarse; con dos admins, 200.

## P1

### 4. Retirar el serif de las pestañas admin
- [x] 4.1 Quitar `'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif`
      de los 6 archivos: `AnalyticsTab`, `DashboardTab`, `LandingTab`,
      `SpecializationsTab`, `UsersTab`, `WorkshopTab`.
- [x] 4.2 Confirmar con grep que no queda ninguna ocurrencia en `src/`.

### 5. Dejar de propagar errores internos al cliente
- [x] 5.1 Sustituir los 10 `detail=result.get("error")` / `f"Internal error: {str(e)}"`
      por un mensaje fijo en español, dejando el detalle real solo en el log.
- [x] 5.2 Test: forzar un fallo de base y comprobar que la respuesta no contiene
      `SELECT`, `sqlite3`, `sqlalchemy` ni nombres de tabla.

### 6. Corregir la clave de caché del cliente
- [x] 6.1 En `api.js`, derivar el scope del `user_id` en vez de `token.slice(0, 12)`.
- [x] 6.2 Comprobar a mano: iniciar sesión con A, cerrar, entrar con B sin recargar,
      y verificar que B no ve datos de A.

### 7. Topes de longitud en los schemas
- [x] 7.1 Antes de fijar el tope de `content_value`, medir el máximo real en la
      base para no rechazar contenido existente.
- [x] 7.2 Añadir `max_length` según la tabla de `design.md` §4.
- [x] 7.3 Test: un campo por encima del tope devuelve 422.

### 8. `payload.dict()` → `model_dump()`
- [x] 8.1 Cambiar `units/routes.py:64`.
- [x] 8.2 Buscar `.dict(` en todo `app/` por si hay más.

### 9. Unificar el puerto en 8001
- [x] 9.1 Alinear `.env.development.local` a 8001.
- [x] 9.2 Corregir las 4 skills de `.claude/skills/`: ruta `proyecto` → `cirta`,
      puerto 8001, y `check-backend` a `/api/health` (hoy usa `/health`).

## Petición de producto

### 10. Mostrar/ocultar contraseña
- [x] 10.1 Crear `shared/components/PasswordInput.jsx` con los requisitos de
      `design.md` §6 (`type="button"`, arranca oculto, `aria-label` dinámico y
      `aria-pressed`, icono `aria-hidden`, `autoComplete` reenviado, padding).
- [x] 10.2 Usarlo en `LoginForm.jsx` (1 campo).
- [x] 10.3 Usarlo en `RegisterForm.jsx` (2 campos, con estado independiente).
- [x] 10.4 Usarlo en `ResetPasswordPage.jsx`.
- [x] 10.5 Usarlo en `ProfileSettings.jsx`.
- [x] 10.6 Comprobar a mano en registro: pulsar el ojo **no** envía el formulario,
      revelar un campo no revela el otro, y el gestor de contraseñas sigue
      ofreciendo guardar.
- [~] 10.7 Comprobar con teclado: se llega al botón con Tab y se activa con Enter
      y con Espacio.
      PARCIAL: el Tab llega al botón (verificado leyendo `document.activeElement`).
      La activación con Enter/Espacio NO se pudo observar: los eventos sintéticos
      del automatizador no producen la activación nativa. Lo que sí está
      verificado es que es un `<button type="button">` nativo sin `onKeyDown`
      propio, y el navegador activa esos botones con Enter y Espacio por
      especificación. Queda por confirmar a mano.

## Verificación final

- [x] 11.1 Backend: `pytest -q` verde (hoy 93 pasando; deben quedar más).
- [x] 11.2 Backend: `ruff check backend/app backend/tests` sin hallazgos.
- [x] 11.3 Frontend: `npm run lint` y `npm run build` sin errores.
- [x] 11.4 Frontend: confirmar en la salida del build que el chunk de Babylon ya no
      entra por import estático en la ruta del simulador.
- [x] 11.5 Levantar backend y frontend y recorrer a mano: registro con el ojo,
      login con el ojo, entrar a `/simulator` y ver el UR5e.
- [ ] 11.6 Incorporar los deltas a `specs/` y mover el change a
      `changes/archive/2026-09-03-p0-p1-hardening/`.
