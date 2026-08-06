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

### Requirement: CI runs on every push and pull request
The system SHALL run automated checks in CI for both repos (backend `pytest`; frontend lint
+ build).

### Requirement: Direct dependencies have no known CVEs
The system SHALL keep direct dependencies free of known vulnerabilities (e.g.
`python-multipart` >= 0.0.18).
