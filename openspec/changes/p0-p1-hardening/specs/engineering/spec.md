## ADDED Requirements

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
