## 1. Backend — listar usuarios

- [ ] 1.1 En `app/features/admin/routes.py`, agregar `GET /api/admin/users`
      (`require_admin`) que devuelve todos los usuarios con id, nombre, username,
      email, rol y `created_at`.
- [ ] 1.2 Calcular por usuario "cursos iniciados" (cursos distintos con progreso) y
      "completados" (contenidos completados == total del curso) con queries
      agregadas, reutilizando la lógica de #35.
- [ ] 1.3 Serializar sin exponer el hash de contraseña.

## 2. Backend — cambiar rol

- [ ] 2.1 Agregar `PATCH /api/admin/users/{id}/role` (`require_admin`) con body
      `{ "role": "student" | "admin" }`.
- [ ] 2.2 Validar: no cambiar el propio rol; no degradar al último admin. Devolver
      400 con mensaje claro.
- [ ] 2.3 Loggear el cambio de rol (auditoría) con actor y objetivo.

## 3. Frontend — servicio

- [ ] 3.1 Agregar `getAdminUsers()` y `updateUserRole(userId, role)` en el service.

## 4. Frontend — pestaña Usuarios

- [ ] 4.1 Crear el componente de tabla `RegisteredUsers.jsx`: nombre, email, rol,
      iniciados/completados, fecha de registro.
- [ ] 4.2 Botón promover a admin / volver a estudiante, con confirmación y toast;
      deshabilitar la acción sobre uno mismo.
- [ ] 4.3 Agregar la pestaña "Usuarios" al tab bar / sidebar del admin y enrutarla.

## 5. Verificación

- [ ] 5.1 Probar con TestClient: listar usuarios (admin 200, no-admin 403),
      contadores correctos, y cambio de rol con las salvaguardas (propio rol,
      último admin).
- [ ] 5.2 Lint + build del frontend.
