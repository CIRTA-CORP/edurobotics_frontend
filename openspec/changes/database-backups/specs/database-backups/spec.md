## ADDED Requirements

### Requirement: A backup is created weekly without manual action

The system SHALL create a backup of the application's data (the `public` schema) once a
week, triggered by a scheduled workflow that calls the backend. Each backup SHALL be a
gzip-compressed plain SQL dump, named with its UTC creation time and its origin, and
stored in a private Storage bucket.

#### Scenario: Weekly run
- **WHEN** the weekly schedule fires
- **THEN** a file named `edurobotics-<date>-<time>-auto.sql.gz` appears in the private
  backups bucket

#### Scenario: Failed run is visible
- **WHEN** the backup fails at any step
- **THEN** the workflow run fails
- **AND THEN** nothing is uploaded and no existing backup is deleted

### Requirement: Every backup is verified before it is kept

A backup SHALL be uploaded only if `pg_dump` exited successfully, the compressed file
decompresses completely, and the SQL creates the expected tables.

#### Scenario: Truncated dump
- **WHEN** the dump is cut short and does not contain the expected tables
- **THEN** the backup is reported as failed and not uploaded

### Requirement: Only the newest eight backups are kept

After a new backup is uploaded and verified, the system SHALL delete the oldest backups
beyond the eight most recent. It SHALL NOT delete any backup when the new one failed.

#### Scenario: Ninth backup
- **WHEN** a ninth backup is uploaded successfully
- **THEN** the oldest one is deleted and eight remain

### Requirement: Administrators manage backups from the platform

Administrators SHALL be able to list backups (date, size, origin), download one, and
create one on demand from the admin panel. Downloads SHALL use a signed link valid for 60
seconds, and each download SHALL be logged with the administrator's id. Non-admin users
SHALL be rejected.

#### Scenario: Download
- **WHEN** an administrator presses «Descargar» on a backup
- **THEN** the browser downloads the file through a signed link that expires in 60 s

#### Scenario: Student tries the API
- **WHEN** a student calls any backups endpoint
- **THEN** the request is rejected with 403

#### Scenario: Create now while one is running
- **WHEN** an administrator presses «Crear respaldo ahora» while a backup is in progress
- **THEN** the request is rejected with 409 and the running backup continues

### Requirement: The scheduled trigger has a narrow credential

The scheduled workflow SHALL authenticate with a dedicated token that can only create a
backup, compared in constant time. The token SHALL NOT grant listing, downloading or
deleting backups.

#### Scenario: Token used to download
- **WHEN** a request to download a backup carries only the trigger token
- **THEN** it is rejected

### Requirement: Restoring is a documented manual procedure

The platform SHALL NOT offer restoring a backup from the web. A written procedure SHALL
describe how to restore a backup into a new database, and it SHALL have been rehearsed
with a real backup.

#### Scenario: Looking for a restore button
- **WHEN** an administrator opens the backups section
- **THEN** there is no action that replaces production data

### Requirement: A late backup is flagged

The backups section SHALL show how long ago the last backup was created and SHALL flag it
when it is older than eight days.

#### Scenario: Workflow stopped running
- **WHEN** the last backup is nine days old
- **THEN** the section shows a warning that backups are overdue
