# Design — Endurecimiento P0 + P1 y visibilidad de contraseña

## Context

Diez puntos heterogéneos que comparten una cosa: son todos correcciones sobre
código ya escrito y verificado, no funcionalidad nueva. Nueve salieron de la
revisión de las dos ramas; el décimo es una petición de producto.

Dos de ellos tienen consecuencias de despliegue y merecen decisión explícita:
la baseline de Alembic y la retirada de `init_db()`. El resto son locales.

## Goals

- Recuperar la ganancia real del visor URDF (7,8×) que hoy se anula en runtime.
- Dejar la cadena de migraciones capaz de construir una base vacía, sin cambiar
  nada para las bases ya sembradas (producción y local).
- Cerrar el lockout por borrado de cuenta.
- Que ningún error de base de datos llegue al cliente con estructura interna.
- Un solo gesto de mostrar/ocultar contraseña, accesible, en los cuatro formularios.

## Non-Goals

- **No** se toca el aislamiento del simulador (máquina Fly compartida, ejecución
  como root, `/stop` accesible a cualquier estudiante). Es P2 y necesita su propio
  change con decisión de arquitectura.
- **No** se cambia la familia tipográfica del proyecto. Se retira el serif que se
  coló; la letra de producción se queda como está.
- **No** se unifican las dos capas de caché (React Query + el `Map` de `api.js`).
  Aquí solo se corrige la clave; elegir una sola capa es P2.
- **No** se reescribe el patrón «excepción convertida en dict» de los services.
  Se corta la fuga en la frontera HTTP; el refactor del patrón es aparte.
- **No** se cambia el motor 3D ni se retira `BabylonViewer`. Sigue disponible en
  `?viewer=babylon`; solo deja de descargarse cuando no se usa.
- **No** se corrigen los 9 textos «UR5» sin la «e» ni las vulnerabilidades de
  `markdown-it`. Son P3/P2.

## Decisions

### 1. La baseline se rellena; no se hace squash de la cadena

`9d56f0fed651` está vacía deliberadamente: es el punto de `alembic stamp` con el
que se adoptó Alembic sobre una base preexistente, y así lo documenta
`docs/DESPLIEGUE_MIGRACIONES.md`. El problema no es el sellado, es que **no hay
camino alternativo para una base vacía**.

Se rellena `upgrade()` con las 12 tablas base. Es seguro porque toda base ya
sellada está por delante de esa revisión y **nunca la reejecuta**; solo la corre
una base nueva. La alternativa (squash de las 16 migraciones en una sola
baseline nueva) obligaría a re-sellar producción sin ganar nada.

**Requisito de exactitud histórica.** La baseline debe crear las tablas *como
eran en esa revisión*, sin las columnas que añaden migraciones posteriores, o
esas migraciones fallarán con «duplicate column». Excluir explícitamente:

| Añadido después | Por |
|---|---|
| `courses.image_url` | `cd9cdee073fd` |
| `user_progress.started_at` | `428f70c2a297` |
| `users.token_version` | `b2c3d4e5f6a7` |
| `unit_contents.title`, `.duration_minutes` | `c3d4e5f6a7b8` |
| `quizzes.order_index` | `d4e5f6a7b8c9` |
| `user_progress.active_seconds`, `.last_heartbeat` | `f6a7b8c9d0e1` |
| índices de `user_progress` y `quiz_attempts` | `8cf316c376f2` |

Tablas de la baseline (12): `users`, `courses`, `course_prerequisites`,
`course_feedback`, `modules`, `units`, `unit_contents`, `quizzes`,
`quiz_questions`, `quiz_answers`, `quiz_attempts`, `user_progress`.

Las creadas después (`landing_content`, `specializations`,
`specialization_courses`, `password_reset_tokens`, `login_events`,
`enrollments`, `quiz_attempt_answers`, `course_teachers`, `consents`) **no** van
en la baseline: ya tienen su propia migración.

`downgrade()` suelta las 12 en orden inverso de dependencia.

### 2. `init_db()` sale del arranque, y la CI verifica la baseline

Mientras `create_all()` corra al arrancar, seguirá creando por adelantado tablas
que una migración posterior quiere crear — exactamente la colisión que rompió la
base local (`table enrollments already exists`).

Se retira de `main.py` y de `database.py`. Consecuencia: **el despliegue debe
ejecutar `alembic upgrade head`**. Producción ya está sellada y al día, así que
el primer despliegue tras este cambio no aplica nada; el requisito es para los
siguientes.

La red de seguridad es un paso de CI que crea una base vacía, corre
`alembic upgrade head` y comprueba que el esquema resultante coincide con los
modelos. Eso es lo que habría detectado este hueco, y lo que evita que vuelva.

Los tests siguen usando su propia creación de tablas desde los modelos
(`tests/conftest.py`), que es independiente de `init_db()` y no se toca.

### 3. Los errores se cortan en la frontera HTTP

No se reescriben los services. En las rutas, `detail` deja de recibir
`result.get("error")` / `str(e)`: pasa a un mensaje en español fijo y el detalle
real va al log con `logger.error(..., error=str(e))`, que ya se hace. El handler
global de `main.py` cubre lo que se escape.

Motivo de no ir más lejos: son 10 sitios en 6 features; convertir el patrón
dict→excepción es un refactor transversal que merece su propio change.

### 4. Topes de longitud por tipo de campo, no globales

`max_length` en los campos de texto según su uso real, para que un título de
10 MB no llegue a la base:

| Campo | Tope |
|---|---|
| `username` | 50 |
| `email` | 254 (RFC 5321) |
| `first_name`, `last_name` | 100 |
| títulos (`title`) | 200 |
| descripciones (`description`) | 2.000 |
| `content_value` (HTML de lección) | 500.000 |

`content_value` va holgado a propósito: es el cuerpo de una lección de Tiptap y
un tope corto rompería contenido existente. Verificar el máximo real en la base
antes de fijarlo.

### 5. El puerto canónico es 8001

`main.py` lo usa en su docstring, en el bloque `__main__` y en la URL de `/docs`,
y es el default de producción (`${PORT:-8001}`). El único sitio que dice 8000 es
`.env.development.local`, que está en `.gitignore` y es local de cada persona.
Se alinea el `.env` a 8001 y se corrigen las skills del proyecto, que hoy además
apuntan a la ruta vieja `Escritorio\proyecto\`.

### 6. `PasswordInput` compartido, no un toggle por formulario

Componente nuevo en `shared/components/`, que envuelve el `Input` de shadcn y
añade el botón. Sustituye `type="password"` en los cuatro formularios sin más
cambios, porque los cuatro ya usan el `Input` compartido con la misma forma.

Detalles que no son negociables para que no rompa nada:

- `type="button"` en el botón. Sin eso, dentro de un `<form>` **envía el
  formulario** al pulsarlo.
- Arranca siempre oculto. El estado no se comparte entre campos: en el registro,
  «Contraseña» y «Confirmar contraseña» se revelan por separado.
- `aria-label` que cambia con el estado («Mostrar contraseña» / «Ocultar
  contraseña») y `aria-pressed`. El icono va `aria-hidden`.
- Se conserva el `autoComplete` que ya pasa cada formulario
  (`current-password` en login, `new-password` en registro y restablecer), porque
  de él dependen los gestores de contraseñas.
- Padding derecho en el input para que el texto no pase por debajo del icono.
- El botón queda en el orden natural de tabulación, después del campo.

Iconos `Eye` / `EyeOff` de `lucide-react`, que ya se usan en `CourseForm.jsx`.

### 7. La clave de caché se deriva del `user_id`

`api.js` usa `token.slice(0, 12)` como scope, y esos 12 caracteres son el header
del JWT — igual para todos. Pasa a usar el `user_id` del payload ya decodificado
(`getStoredUser()`), con fallback a `'public'` si no hay sesión.
