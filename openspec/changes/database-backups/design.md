# Design — Respaldos de la base de datos

## Context

- Backend FastAPI en Railway, base Postgres 17.6 en Supabase, archivos en Supabase Storage
  (bucket público `edurobotics-content`, subido por la API REST de Storage con
  `SUPABASE_KEY`).
- La autenticación es propia de la aplicación (tablas en `public`, bcrypt, JWT): el esquema
  `auth` de Supabase no guarda los usuarios de EduRobotics.
- Ya hay un workflow programado en el repo del backend (`supabase-keepalive.yml`, cada 6
  días) que llama a la API desde GitHub Actions.
- `ADMIN_TOKEN` se exige en producción pero **ningún código lo usa**.
- Ya existe `scripts/backup_db.sh` (manual, toda la base, formato *custom*). Se conserva
  como copia extra; este change usa el mismo nombre de variable, `BACKUP_DB_URL`. Su regla
  `backups/` en `.gitignore` ignoraba cualquier carpeta con ese nombre, incluido el código
  nuevo: se ancla a la raíz (`/backups/`).

## Goals

- Un respaldo semanal sin que nadie tenga que acordarse.
- Que la directora descargue un respaldo desde la plataforma, sin entrar a Supabase.
- Que un respaldo se pueda restaurar de verdad: probado, no supuesto.
- Que no se pierda nunca el último respaldo bueno.

## Non-Goals

- **Restaurar desde la web.** Un clic equivocado reemplazaría los datos de producción.
- **Respaldar los archivos de Storage** (imágenes de los cursos). Ya viven en Storage, no en
  la base, y harían el respaldo mucho más pesado.
- **Respaldar los esquemas de Supabase** (`auth`, `storage`, `realtime`…): los crea y
  gestiona la plataforma.
- **Respaldos incrementales o a otro proveedor.** Con 1,7 MB de datos no compensa; queda
  abierto si la base crece.

## Decisions

### 1. El respaldo lo hace el backend; GitHub Actions solo lo dispara

Un endpoint del backend hace el volcado y lo sube. El respaldo semanal es un workflow de
GitHub Actions que llama a ese endpoint, igual que el keep-alive de Supabase. «Crear
respaldo ahora» llama al mismo código.

Alternativas descartadas:
- **`pg_dump` dentro de GitHub Actions**: la contraseña de la base viviría también en
  GitHub, y «Crear ahora» desde la web necesitaría un token de GitHub en el backend.
- **Programador dentro del proceso** (APScheduler): un despliegue o un reinicio a la hora
  señalada pierde la ejecución, y si Railway duerme el servicio, el reloj no corre.
- **Servicio cron de Railway**: otro servicio que configurar y pagar, para una tarea
  semanal de segundos.

### 2. El disparo automático usa un token propio

`POST /api/admin/backups` acepta un administrador (JWT) **o** la cabecera
`X-Backup-Token` con `BACKUP_TRIGGER_TOKEN`, comparada en tiempo constante
(`hmac.compare_digest`). Ese token solo sirve para crear un respaldo: no lista, no
descarga, no borra. No se reutiliza `ADMIN_TOKEN`: un token genérico, si se filtra, abre
más de lo necesario.

### 3. Qué se vuelca y en qué formato

`pg_dump --schema=public --no-owner --no-privileges` en SQL plano, comprimido con gzip:
`edurobotics-AAAAMMDD-HHMMSS-{auto|manual}.sql.gz` (hora UTC). SQL plano porque se
restaura con `psql` en cualquier Postgres 17 y se puede abrir para revisarlo; el formato
propio de `pg_dump` solo aporta restauraciones parciales, que aquí no se necesitan.

### 4. `pg_dump` 17 en la imagen y conexión de sesión

`pg_dump` tiene que ser de la versión mayor del servidor o más nueva. La imagen final
recibe `postgresql-client-17`; si la versión de Debian de `python:3.12-slim` no lo trae,
se añade el repositorio oficial de PostgreSQL. El respaldo comprueba
`pg_dump --version` y falla con un mensaje claro si no es 17 o superior.

`pg_dump` no funciona con el pooler en modo transacción (puerto 6543, el de
`DATABASE_URL`). Se usa una variable aparte, `BACKUP_DB_URL`, con el pooler en modo
sesión (puerto 5432) o la conexión directa. Nunca se escribe en el log.

### 5. Bucket privado, clave de servicio

Bucket nuevo y **privado**, `edurobotics-backups`, separado del de contenidos, que es
público. Escribir en un bucket privado requiere la clave de servicio de Supabase. **Datos
insuficientes** sobre si `SUPABASE_KEY` lo es: se comprueba al implementar; si es la
clave anónima, se añade `SUPABASE_SERVICE_KEY` solo para este módulo.

### 6. Rotación: 8 respaldos, y nunca a costa del último bueno

Tras subir uno nuevo **y comprobarlo**, se borran los que pasen de 8, empezando por los
más viejos. Si el respaldo nuevo falla, no se borra nada.

### 7. Cada respaldo se comprueba antes de darlo por bueno

Antes de subirlo: `pg_dump` terminó con código 0, el gzip se descomprime entero, y el SQL
contiene la creación de las tablas esperadas (al menos `users` y `alembic_version`). Si
algo falla, el endpoint responde con error, el workflow se marca en rojo (GitHub avisa por
correo a quien vigila el repo) y no se sube nada.

### 8. Descarga por enlace firmado de 60 segundos

`GET /api/admin/backups/{nombre}/download` devuelve un enlace firmado de Storage válido
60 s, y el navegador descarga desde ahí. No pasa por el backend (no carga su memoria) y un
enlace copiado deja de servir enseguida. Solo administradores; cada descarga queda en el
log con el id de quien descargó.

### 9. Uno a la vez, con límite y tiempo máximo

Un candado en el proceso impide dos respaldos simultáneos (409 si ya hay uno en curso).
«Crear ahora» admite uno cada 10 minutos. `pg_dump` tiene un tiempo máximo de 120 s.

### 10. Restaurar: procedimiento escrito y ensayado

`docs/restaurar-respaldo.md` en el backend: descargar, descomprimir y cargar con `psql` en
una base **nueva**, comprobar y solo entonces apuntar la aplicación a ella. El
procedimiento se ensaya restaurando un respaldo real en un Postgres 17 local antes de dar
el change por terminado.

**Cuentas eliminadas.** Una cuenta borrada después de la fecha del respaldo reaparecería
al restaurarlo. El procedimiento incluye volver a aplicar esas eliminaciones. **Datos
insuficientes** sobre si el borrado de cuenta (`DELETE /api/users/me`) deja hoy un
registro con el que saber cuáles fueron; se revisa al implementar.

### 11. La política de privacidad dice cuánto viven los datos en los respaldos

La sección «5. Conservación» añade que los respaldos se conservan un máximo de 8 semanas
y que los datos de una cuenta eliminada desaparecen de ellos cuando el respaldo se
descarta. El texto lo revisa Mario antes de publicarse.

### 12. La pantalla avisa si el respaldo se atrasa

La sección «Respaldos» muestra cuánto hace del último. Si pasan más de 8 días sin uno
nuevo, lo marca en amarillo: el workflow pudo fallar sin que nadie lo viera.
