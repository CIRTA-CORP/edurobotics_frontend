## 1. Backend — listar usuarios

- [x] 1.1 `GET /api/admin/users` (`require_admin`) con id, nombre, username, email,
      rol y `created_at`.
- [x] 1.2 "Iniciados" (cursos distintos con progreso) y "completados" (contenidos
      completados == total del curso) con queries agregadas (misma lógica de #35).
- [x] 1.3 Serializado sin el hash de contraseña (test lo verifica).

## 2. Backend — cambiar rol

- [x] 2.1 `PATCH /api/admin/users/{id}/role` con body `{ "role": ... }`.
- [x] 2.2 Salvaguardas: no cambiar el propio rol; no dejar el sistema sin admins.
- [x] 2.3 Incrementa `token_version` al cambiar el rol (invalida tokens vivos, F1) + log.

## 3. Frontend — servicio

- [x] 3.1 `getAdminUsers()` y `updateUserRole(userId, role)` en el service.

## 4. Frontend — pestaña Usuarios

- [x] 4.1 `UsersTab.jsx`: tabla con nombre, email, rol, iniciados/completados, registro.
- [x] 4.2 Botón promover/degradar con confirmación y toast; deshabilitado sobre uno mismo.
- [x] 4.3 Pestaña "Usuarios" en el sidebar del admin + render en `AdminDashboardPage`.

## 5. Verificación

- [x] 5.1 TestClient: listar (admin 200 / no-admin 403), contadores, y cambio de rol
      con salvaguardas. **39 passed** (6 tests nuevos de F2).
- [x] 5.2 Lint (archivos nuevos limpios) + build del frontend OK.
