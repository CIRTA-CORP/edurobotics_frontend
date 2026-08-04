## 1. Reparar la suite

- [x] 1.1 En `tests/conftest.py`, registrar todos los modelos (importar `app.main`)
      ANTES de `Base.metadata.create_all`.
- [x] 1.2 Correr `pytest tests/` y dejar verde lo que hoy son 17 failed + 22 errors.
      (Los 4 restantes eran tests viejos sin token → se agregó `auth_headers`.)

## 2. Dependencia con CVE

- [x] 2.1 `python-multipart` → >=0.0.18 en `requirements.txt` (instalado 0.0.32). CVE cerrado.
- [x] 2.2 Bump conservador verde: `fastapi` 0.104.1→0.115.14, `pydantic` 2.4.2→2.13.4;
      suite sigue verde.

## 3. Higiene de repo

- [x] 3.1 `git rm --cached test_output.txt` (`edurobotics.db` ya estaba ignorado por `*.db`).
- [x] 3.2 `test_output.txt` agregado al `.gitignore`.

## 4. Tests de auth faltantes

- [x] 4.1 login credenciales inválidas (401) + register duplicado (400).
- [x] 4.2 reset-password con token inválido → 400.
- [x] 4.3 `ensure_self_or_admin` bloquea datos de otro usuario (IDOR) → 403.
- [x] 4.4 `require_admin` responde 403 a un student.

## 5. CI

- [x] 5.1 `.github/workflows/ci.yml` backend: setup Python 3.12, deps, `pytest tests/`.
- [x] 5.2 `.github/workflows/ci.yml` frontend: Node 20, `npm ci`, `build` (gate) +
      `lint` no bloqueante (57 issues preexistentes → limpieza en F6).

## 6. Verificación

- [x] 6.1 `pytest tests/` 100% verde local (29 passed).
- [ ] 6.2 CI verde en ambos repos (tras push, con permiso de Mario). ← pendiente de push.
