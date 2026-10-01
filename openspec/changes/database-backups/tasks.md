# Tasks — Respaldos de la base de datos

Ramas: una por repositorio, a pedido de Mario, para un solo PR a `main` en cada uno —
backend `feature/7-backend-restructure`, frontend `feature/6-simulator-editor-redesign`.

## 1. Preparación (necesita a Mario en Railway y Supabase)

- [x] 1.1 Comprobar si `SUPABASE_KEY` es la clave de servicio; si no, crear
      `SUPABASE_SERVICE_KEY` en Railway — Mario comparó con Supabase: es la `service_role`.
      No hace falta `SUPABASE_SERVICE_KEY`
- [x] 1.2 Crear el bucket privado `edurobotics-backups` en Supabase Storage (Mario)
- [x] 1.3 Crear `BACKUP_DB_URL` (pooler en modo sesión, puerto 5432) en Railway (Mario;
      el valor se comprueba en el primer respaldo: con 6543 el backend lo rechaza con un
      mensaje claro)
- [x] 1.4 Generar `BACKUP_TRIGGER_TOKEN` y guardarlo en Railway y como secreto del repo
      del backend en GitHub (Mario)

## 2. Backend

- [x] 2.1 `postgresql-client-17` en la imagen final; comprobar `pg_dump --version` en el
      build. Comprobado en producción: Railway construyó la imagen y el primer respaldo
      (2026-10-01, manual, 85 KB) pasó la comprobación de versión y de volcado completo
- [x] 2.2 `features/backups/service.py`: volcado, compresión, comprobación, subida,
      rotación a 8. La rotación nunca borra el respaldo recién creado (encontrado al
      probar: con el reloj desfasado lo habría borrado)
- [x] 2.3 Rutas: `POST /api/admin/backups` (admin o token), `GET /api/admin/backups`,
      `GET /api/admin/backups/{nombre}/download` (enlace firmado de 60 s)
- [x] 2.4 Candado de un respaldo a la vez, límite de uno cada 10 min para «Crear ahora»,
      tiempo máximo de 120 s
- [x] 2.5 Tests: 17 nuevos, 162 en total, todos en verde; ruff sin hallazgos en lo nuevo.
      Probado también contra el backend local: 401 sin sesión, 401 con token falso,
      respuesta «sin configurar» como administrador
- [x] 2.6 Revisado: el borrado de cuenta solo deja la línea `user_account_deleted` en el
      log de Railway; no hay registro permanente. Queda dicho en el procedimiento de
      restauración
- [x] 2.7 `.gitignore`: la regla `backups/` ignoraba también `features/backups/`; anclada a
      la raíz. `scripts/BACKUP.md` apunta al sistema nuevo

## 3. Disparo semanal

- [x] 3.1 `.github/workflows/database-backup.yml`: domingos 04:23 UTC y a mano; falla si la
      API no responde 201. Sin reintentos automáticos, para no crear dos respaldos

## 4. Frontend

- [x] 4.1 Pestaña «Respaldos» en el panel de administración: lista, Descargar, Crear
      respaldo ahora (verificada en el navegador: sin configurar, con lista simulada, y
      error de descarga en español; en producción, Mario creó el primer respaldo). La nota
      sobre datos de menores se quitó a pedido de Mario: hoy no hay alumnos menores en la
      plataforma y los administradores ya lo saben
- [x] 4.2 Aviso en amarillo si el último respaldo tiene más de 8 días (verificado)
- [ ] 4.3 Texto de conservación en la política de privacidad — escrito; **lo revisa Mario**

## 5. Restauración

- [x] 5.1 `docs/restaurar-respaldo.md` — escrito como **borrador sin ensayar**
- [ ] 5.2 Ensayo: restaurar un respaldo real en un Postgres 17 local y comprobar que la
      aplicación arranca contra él — bloqueado por Docker

## 6. Verificación

- [x] 6.1 Build y ESLint sin hallazgos nuevos (frontend); tests y migraciones (backend)
- [ ] 6.2 Primer respaldo automático visto en la lista — el manual ya funcionó en
      producción; falta lanzar el workflow (Actions → Run workflow) para probar el token
- [ ] 6.3 **A mano:** la directora descarga un respaldo desde la plataforma
