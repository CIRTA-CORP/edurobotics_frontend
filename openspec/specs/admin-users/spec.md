# Purpose

Visibilidad y gestión de los usuarios registrados desde el panel admin: listado con
avance y cambio de rol con salvaguardas.

## Requirements

### Requirement: Admin can list registered users
The system SHALL let an administrator view all registered users with name, username,
email, role, registration date, and how many courses each started and completed.

#### Scenario: View users list
- **WHEN** an admin opens the "Usuarios" tab
- **THEN** each row shows name, email, role, courses started, courses completed and registration date
- **AND THEN** a non-admin requesting the endpoint receives 403

#### Scenario: Course counts per user
- **WHEN** the users list is built
- **THEN** "started" counts the distinct courses where the user has any progress
- **AND THEN** "completed" counts the courses where the user finished every content of the course
- **AND THEN** the counts are computed with aggregate queries (no per-user round-trip)

### Requirement: Admin can assign or revoke the admin role
The system SHALL let an administrator promote a user to admin or return them to student,
with safeguards against lockout.

#### Scenario: Promote a user to admin
- **WHEN** an admin clicks "Hacer admin" on a student row and confirms
- **THEN** the system calls `PATCH /api/admin/users/{id}/role` with role `admin`
- **AND THEN** the user's role badge updates to admin

#### Scenario: Cannot change your own role
- **WHEN** an admin tries to change their own role
- **THEN** the system rejects it with a clear message

#### Scenario: Cannot remove the last admin
- **WHEN** demoting a user would leave the system with zero admins
- **THEN** the system rejects it

### Requirement: User data never exposes credentials
The system SHALL never include password hashes in any admin users response.

#### Scenario: Serialized user is safe
- **WHEN** the users list is returned
- **THEN** each user object contains only id, name, username, email, role, registration date and course counts
