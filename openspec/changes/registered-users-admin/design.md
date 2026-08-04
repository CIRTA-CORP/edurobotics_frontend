## Context

El modelo `User` ya tiene `role` (`'student'|'admin'`), `created_at`, `first_name`,
`last_name`, `username`, `email` y `password` (hash). El progreso vive en
`user_progress` (`content_id`, `completed`, ...). Ya existe la lógica de "completado
por curso" en el endpoint de métricas por curso (#35): un alumno completó un curso
cuando su cantidad de contenidos completados alcanza el total de contenidos del
curso. Acá se reutiliza esa definición, pero agrupando por usuario.

El auth es JWT propio con `require_admin`. No existen endpoints para listar usuarios
ni para cambiar roles (hoy se hace a mano en Supabase).

## Goals / Non-Goals

**Goals:**
- El admin ve la lista de usuarios registrados con su avance (cursos iniciados/completados).
- El admin puede promover a otro usuario a admin y revertirlo, desde la UI.
- Cálculos con pocos queries agregados (base de usuarios chica, ~decenas).

**Non-Goals:**
- No editar perfiles ni resetear contraseñas desde acá.
- No eliminar usuarios.
- No paginación ni búsqueda avanzada por ahora (base chica); se puede agregar después.
- No drill-down curso por curso por usuario en esta iteración (sólo los contadores).
- No invitaciones por email.

## Decisions

1. **Contadores calculados en runtime, no persistidos.** "Iniciados" = cursos
   distintos con al menos una fila de progreso del usuario. "Completados" = cursos
   donde sus contenidos completados == total de contenidos del curso. Se computa con
   agregados (`group by`), igual que #35, para no hacer N queries por usuario.

2. **Cambio de rol con salvaguardas.** `PATCH /api/admin/users/{id}/role` valida:
   (a) un admin no puede cambiar su propio rol; (b) no se puede degradar al último
   admin (siempre queda ≥1). Devuelve 400 con un mensaje claro si se viola.

3. **Nunca exponer el hash de contraseña.** El serializador de usuario devuelve sólo
   campos públicos: id, nombre, usuario, email, rol, fecha de registro y contadores.

4. **UI como pestaña admin nueva.** Se agrega "Usuarios" al panel admin (tab bar +
   sidebar), reutilizando el estilo de tabla de las métricas por curso. Promover/
   degradar pide confirmación y muestra un toast; la acción sobre uno mismo queda
   deshabilitada.

5. **Sólo admin.** Ambos endpoints con `require_admin`. Sin exposición pública.
