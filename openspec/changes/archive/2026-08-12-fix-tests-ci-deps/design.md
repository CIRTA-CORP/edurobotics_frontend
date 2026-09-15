## Context

`tests/conftest.py` arma un SQLite en memoria (StaticPool) y llama
`Base.metadata.create_all` tras importar a mano una lista de modelos (auth, contents,
courses, modules, progress, quizzes, units). **Faltan `specializations`
(tabla `specialization_courses`) y `landing`**, agregados después. Como `create_all`
corre en import-time del conftest —antes de que el fixture `client` importe
`app.main`— esas tablas nunca se crean → `OperationalError: no such table`.

Deps actuales: fastapi 0.104.1, pydantic 2.4.2, python-multipart 0.0.6, sqlalchemy
2.0.23. No hay `.github/` en ningún repo. `*.db` está en `.gitignore` pero
`edurobotics.db` quedó trackeado antes de esa regla; `test_output.txt` está trackeado
y sin ignorar. Existe estructura legacy muerta (`backend/api|models|services|schemas`)
que NO se toca acá.

## Goals / Non-Goals

**Goals:**
- Suite 100% verde, local y en CI, en ambos repos.
- Cerrar el CVE de python-multipart.
- Cubrir los caminos críticos de auth con tests.

**Non-Goals:**
- No refactorizar `app/` ni tocar la estructura legacy (eso es F7 / cleanup).
- No perseguir cobertura alta; sólo los caminos críticos + dejar verde lo existente.
- No scrubbear el historial de git (va junto con la rotación de credenciales, F1).
- No subir fastapi/pydantic si el upgrade introduce riesgo sin beneficio claro.

## Decisions

1. **Registrar todos los modelos vía `app.main`.** En vez de mantener una lista
   manual que se vuelve a quedar atrás, el conftest importará `app.main` (que importa
   todos los routers → todos los modelos) ANTES de `create_all`. Elimina la clase de
   bug de raíz.

2. **Upgrade de deps por riesgo, separado.** `python-multipart` es obligatorio (CVE).
   fastapi/pydantic se suben de forma conservadora y sólo si la suite sigue verde tras
   cada bump individual; si alguno rompe, se revierte y se documenta. El CVE se cierra
   sin depender de esos dos.

3. **Higiene sin reescribir historial.** `git rm --cached` saca los archivos del
   tracking futuro; el scrubbing del historial se hace aparte, con la rotación de
   credenciales.

4. **CI mínimo pero real.** Un workflow por repo, en push y PR. Backend corre
   `pytest`; frontend corre lint + build. Nada de matrices ni deploy todavía.
