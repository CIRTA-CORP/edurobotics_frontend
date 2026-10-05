# Purpose

Red de seguridad de ingeniería: suite de tests verde, CI en ambos repos y dependencias sin
CVEs conocidos.

## Requirements

### Requirement: The backend test suite passes
The system SHALL keep the backend test suite green, with a test database that registers
every model before creating tables.

#### Scenario: Full suite runs green
- **WHEN** `pytest tests/` runs against the in-memory test database
- **THEN** all tests pass with zero errors

### Requirement: Critical auth paths are tested
The system SHALL cover authentication and authorization edge cases with tests (e.g.
`require_admin` rejects a student; `ensure_self_or_admin` blocks IDOR).

#### Scenario: Authorization is enforced in tests
- **WHEN** the suite runs
- **THEN** a test asserts `require_admin` rejects a student with 403
- **AND THEN** a test asserts `ensure_self_or_admin` blocks access to another user's data

### Requirement: CI runs on every push and pull request
The system SHALL run automated checks in CI for both repos (backend `pytest`; frontend lint
+ build).

#### Scenario: CI gate
- **WHEN** a commit is pushed or a pull request is opened
- **THEN** the backend CI runs `pytest` and the frontend CI runs lint + build
- **AND THEN** a failing check blocks merging

### Requirement: Direct dependencies have no known CVEs
The system SHALL keep direct dependencies free of known vulnerabilities (e.g.
`python-multipart` >= 0.0.18).

#### Scenario: Vulnerable multipart is patched
- **WHEN** dependencies are audited
- **THEN** `python-multipart` is >= 0.0.18 (CVE-2024-24762 closed)

### Requirement: The migration chain can build a database from nothing
The system SHALL be able to create its full schema on an empty database by running the
migrations alone, without relying on the application creating tables at startup. The
baseline revision SHALL therefore create the base tables, in the shape they had at that
revision, so that later migrations still apply cleanly on top.

#### Scenario: A fresh environment is built by migrations
- **WHEN** `alembic upgrade head` runs against an empty database
- **THEN** every table and column defined by the models exists afterwards

#### Scenario: An already-stamped database is unaffected
- **WHEN** `alembic upgrade head` runs against a database already stamped at or past the
  baseline
- **THEN** the baseline is not re-executed and no existing table is touched

#### Scenario: The application does not create tables at startup
- **WHEN** the backend boots
- **THEN** it does not call `create_all`, so it can never create a table ahead of the
  migration that owns it

### Requirement: CI proves the migration chain from scratch
The system SHALL verify in CI that the migrations build a complete schema on an empty
database and that the result matches the models.

#### Scenario: A missing migration fails the build
- **WHEN** a model gains a column with no accompanying migration
- **THEN** CI fails on the mismatch between the migrated schema and the models

### Requirement: The container image runs unprivileged and reports its health
The system SHALL build the backend image in stages so build-only tooling stays out of the
final image, SHALL run the application as a non-root user, and SHALL expose a health check.

#### Scenario: The application does not run as root
- **WHEN** the container starts
- **THEN** the process runs as an unprivileged user

#### Scenario: Build tooling is not shipped
- **WHEN** the final image is built
- **THEN** the compiler used to build dependencies is not present in it

### Requirement: Production dependencies carry no known vulnerabilities
The system SHALL keep the dependencies that reach the browser free of known advisories,
and SHALL treat the sanitizer and the rich-text editor as security-relevant.

#### Scenario: The audit is clean for what ships
- **WHEN** the production dependency tree is audited
- **THEN** no advisory is reported
