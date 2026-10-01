# Proposal — Respaldos de la base de datos desde EduRobotics

## Why

La directora pidió (issue #41) poder sacar un respaldo de la base de datos **desde la
plataforma**, sin entrar a Supabase. Hoy:

- Desde la plataforma no hay ninguno. Existe un script manual (`scripts/backup_db.sh`, de
  agosto, para este mismo issue) que pide tener `pg_dump` instalado en el computador y la
  cadena de conexión a mano: no lo puede usar la directora, y nada lo ejecuta solo. El otro
  respaldo que hay es el de **un curso** en JSON (`courses/service.py`), que no cubre
  usuarios, matrículas ni progreso.
- Si la base se dañara o se borrara algo por error, no habría desde dónde recuperarla.
  Los respaldos automáticos de Supabase dependen del plan, y aun cuando los hay, solo se
  manejan desde el panel de Supabase, que la directora no usa.

Datos medidos el 2026-10-01 (lectura de metadatos, sin tocar datos): Postgres **17.6**,
base de **14 MB**, de los cuales **1,7 MB** son los datos de la aplicación (22 tablas en
`public`). La conexión configurada usa el pooler en modo transacción (puerto **6543**),
con el que `pg_dump` no funciona.

## What Changes

- **Respaldo automático semanal** de los datos de la aplicación (`public`), comprimido,
  guardado en un bucket **privado** de Supabase Storage. Se conservan los **8 más
  recientes** (unos dos meses).
- **Sección «Respaldos» en el panel de administración**: lista con fecha, tamaño y origen
  (automático o manual), **Descargar** y **Crear respaldo ahora**. Solo administradores.
- **Restaurar sigue siendo manual**, con un procedimiento escrito y probado. Ningún botón
  de la web reemplaza los datos de producción.
- **Política de privacidad**: dice cuánto tiempo viven los datos en los respaldos.

## Capabilities

**New**
- `database-backups` — crear, listar, descargar y rotar respaldos; disparo semanal con un
  token que solo sirve para eso.

## Impact

- **Backend** (`edurobotics_backend`): módulo `features/backups/`, `pg_dump` 17 en la
  imagen de Docker, workflow semanal en `.github/workflows/`, variables nuevas en Railway
  (`BACKUP_DB_URL`, `BACKUP_TRIGGER_TOKEN` y, si hace falta, la clave de servicio de
  Supabase).
- **Frontend**: pestaña «Respaldos» en `AdminDashboardPage`; texto de conservación en
  `landingContent.js`.
- **Supabase**: un bucket privado nuevo, `edurobotics-backups`.
- **Riesgo**: un respaldo contiene datos personales de menores y hashes de contraseñas.
  Por eso el bucket es privado, la descarga es por enlace firmado de 60 s y solo para
  administradores, y cada descarga queda registrada.
