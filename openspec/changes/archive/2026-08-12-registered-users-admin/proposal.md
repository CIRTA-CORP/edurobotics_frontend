## Why

Hoy el admin no puede ver quiénes se registraron ni medir su avance: sólo hay un
contador global ("Estudiantes Registrados: N") en el dashboard. La directora
necesita ver la lista de estudiantes, cuántos cursos tomó y completó cada uno, y
poder delegar administración a otras personas sin cambiar roles a mano en la base
de datos (issue #36).

## What Changes

- **GET /api/admin/users** (admin): lista de usuarios (estudiantes y admins) con
  nombre, usuario, email, rol, fecha de registro, y cuántos cursos ha iniciado y
  completado cada uno. Contadores calculados con agregados (misma definición de
  "completado" que las métricas por curso del #35).
- **PATCH /api/admin/users/{id}/role** (admin): cambia el rol de un usuario entre
  `student` y `admin`. Un admin no puede cambiar su propio rol, y no se puede
  degradar al último admin (evita quedar sin administradores).
- Nueva pestaña de admin **"Usuarios"**: tabla con la lista, badge de rol, cursos
  iniciados/completados y fecha de registro, con acción para promover a admin /
  volver a estudiante (con confirmación).

## Capabilities

### New Capabilities
- `admin-users`: visibilidad y gestión de los usuarios registrados desde el panel admin.

### Modified Capabilities
- _(none)_

## Impact

- Backend: `app/features/admin/routes.py` (2 endpoints nuevos). Reutiliza el modelo
  `User` y `user_progress`; **sin cambios de modelo ni migración de Alembic**.
- Frontend: nueva pestaña + componente de tabla, entrada en el tab bar / sidebar del
  admin, y funciones de servicio (`getAdminUsers`, `updateUserRole`).
- Sin cambios en la lógica de cursos/progreso existente. Sin nuevas dependencias.
