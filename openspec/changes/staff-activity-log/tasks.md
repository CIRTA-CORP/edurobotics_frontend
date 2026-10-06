# Tasks — Registro de acciones del equipo

## 1. Antes de fusionar (migración)

- [ ] 1.1 Respaldo de producción desde Respaldos, y comprobar que se descarga
- [ ] 1.2 Revisar `alembic upgrade head --sql` de la migración

## 2. Backend

- [x] 2.1 Modelo y migración `staff_actions` (`d0e1f2a3b4c5`); `check_migrations` en verde.
      `alembic/env.py` además importaba mal los modelos: le faltaba `enrollments`
- [x] 2.2 `features/staff_activity/registry.py`: 39 rutas registradas y 13 excluidas con su
      motivo (las 51 que modifican algo, más la descarga de respaldos)
- [x] 2.3 Middleware ASGI: resuelve el recurso antes, guarda solo si responde 2xx, nunca
      rompe la petición. Probado con uvicorn real: crear y borrar un módulo dejó «borró el
      módulo «…» del curso «…»» con su nombre
- [x] 2.4 `GET /api/admin/staff-activity` con filtros y paginación; borrado de lo que pase de
      12 meses
- [x] 2.5 Tests: 8 nuevos, más 1 del punto 2.6 (185 en total). Sin el middleware fallan los 4 de registro; el de
      cobertura nombra la ruta que falta si se quita una de la lista
- [x] 2.6 De paso: `POST /admin/promote` no impedía degradar al último administrador; ahora
      sí (test que falla con el código anterior)

## 3. Frontend

- [x] 3.1 Pestaña «Actividad del equipo» (solo administradores; un profesor que entra por la
      dirección vuelve a «Progreso»): lista, filtros por persona, rol, curso y fechas, «Ver más»
- [x] 3.2 Revisión en el navegador contra el backend local: las dos acciones reales y el
      filtro por rol

## 4. Cierre

- [ ] 4.1 Build, ESLint y tests sin hallazgos nuevos
- [ ] 4.2 Volcar el delta en `openspec/specs/` y archivar
