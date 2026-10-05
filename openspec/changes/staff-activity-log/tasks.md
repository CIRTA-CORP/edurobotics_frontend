# Tasks — Registro de acciones del equipo

## 1. Antes de fusionar (migración)

- [ ] 1.1 Respaldo de producción desde Respaldos, y comprobar que se descarga
- [ ] 1.2 Revisar `alembic upgrade head --sql` de la migración

## 2. Backend

- [ ] 2.1 Modelo y migración `staff_actions`
- [ ] 2.2 `core/staff_activity.py`: lista de rutas del equipo con verbo y tipo de recurso
- [ ] 2.3 Middleware: resolver el recurso antes, guardar solo si responde 2xx
- [ ] 2.4 `GET /api/admin/staff-activity` con filtros y paginación; borrado de lo que pase de
      12 meses
- [ ] 2.5 Tests: se registra crear, editar y borrar (con el nombre aunque se haya borrado);
      un 403 no se registra; lo de alumnos no se registra; un alumno no puede consultar;
      **test que falla si una ruta del equipo no está en la lista**

## 3. Frontend

- [ ] 3.1 Pestaña «Actividad del equipo» (solo administradores): lista y filtros
- [ ] 3.2 Revisión en el navegador

## 4. Cierre

- [ ] 4.1 Build, ESLint y tests sin hallazgos nuevos
- [ ] 4.2 Volcar el delta en `openspec/specs/` y archivar
