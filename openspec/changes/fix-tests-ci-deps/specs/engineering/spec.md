## ADDED Requirements

### Requirement: The backend test suite passes
The system SHALL keep the backend test suite green, with a test database that
registers every model before creating tables.

#### Scenario: Full suite runs green
- **WHEN** `pytest tests/` runs against the in-memory test database
- **THEN** all tests pass with zero errors
- **AND THEN** every table (including `specialization_courses` and landing) exists in the test DB

### Requirement: Critical auth paths are tested
The system SHALL cover authentication and authorization edge cases with tests.

#### Scenario: Authorization is enforced in tests
- **WHEN** the suite runs
- **THEN** a test asserts `require_admin` rejects a student with 403
- **AND THEN** a test asserts `ensure_self_or_admin` blocks access to another user's data

### Requirement: CI runs on every push and pull request
The system SHALL run automated checks in CI for both repos.

#### Scenario: CI gate
- **WHEN** a commit is pushed or a pull request is opened
- **THEN** the backend CI runs `pytest` and the frontend CI runs lint + build
- **AND THEN** a failing check blocks merging

### Requirement: Direct dependencies have no known CVEs
The system SHALL keep direct dependencies free of known vulnerabilities.

#### Scenario: Vulnerable multipart is patched
- **WHEN** dependencies are audited
- **THEN** `python-multipart` is >= 0.0.18 (CVE-2024-24762 closed)
