## Why

La suite de tests está rota (17 failed / 22 errors / 7 passed): `tests/conftest.py`
llama a `Base.metadata.create_all` habiendo importado sólo algunos modelos, así que
faltan tablas (`specialization_courses`, `landing`) y todo lo que las toca falla con
`OperationalError`. En la práctica nadie corre los tests → no protegen nada, y no hay
CI que lo detecte. Además `python-multipart==0.0.6` arrastra CVE-2024-24762 (ReDoS →
DoS del servidor). Sin esta red de seguridad, cada fase posterior se degrada en
silencio (F0 del ROADMAP).

## What Changes

- **conftest:** registrar TODOS los modelos antes de `create_all` (importar
  `app.main`, que importa todos los routers → todos los modelos, incluyendo
  specializations y landing), para que la BD de test en memoria tenga todas las tablas.
- **Dependencia con CVE (obligatorio):** `python-multipart` 0.0.6 → >=0.0.18.
- **Upgrades conservadores (opcional, uno por uno, tras suite verde):** fastapi y
  pydantic a una versión reciente compatible; revertir cualquiera que rompa.
- **Higiene de repo:** `git rm --cached` de `edurobotics.db` (trackeado pese a `*.db`)
  y `test_output.txt`; agregar `test_output.txt` al `.gitignore`.
- **Tests de auth que faltan:** login ok/fallo, register duplicado, reset expirado,
  `ensure_self_or_admin` bloquea IDOR, `require_admin` bloquea a un student.
- **CI (GitHub Actions) en ambos repos:** backend `pytest`; frontend
  `npm ci && npm run lint && npm run build`, en push y PR.

## Capabilities

### New Capabilities
- `engineering`: red de seguridad de tests + CI + gestión de dependencias.

### Modified Capabilities
- _(none)_

## Impact

- Backend: `tests/conftest.py`, `requirements.txt`, nuevos tests en `tests/`,
  `.gitignore`, nuevo `.github/workflows/ci.yml`. Sin cambios en `app/` salvo que un
  upgrade de dependencia exija un ajuste puntual.
- Frontend: nuevo `.github/workflows/ci.yml`. Sin cambios de código.
- **Sin migraciones de Alembic. Sin cambios de producto** (no requiere a la directora).
- Fuera de alcance: la estructura legacy muerta (`backend/api|models|services|schemas`)
  y el scrubbing de historial de git.
