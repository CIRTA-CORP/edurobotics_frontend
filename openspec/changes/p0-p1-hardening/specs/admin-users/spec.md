## MODIFIED Requirements

### Requirement: Admin can assign or revoke the admin role
The system SHALL let an administrator promote a user to admin or return them to student,
with safeguards against lockout. The lockout safeguard SHALL cover every path that can
reduce the number of administrators, including an administrator deleting their own account.

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

#### Scenario: The last admin cannot delete their own account
- **WHEN** the only remaining administrator requests deletion of their own account
- **THEN** the request is rejected with a clear message and the account is kept
- **AND WHEN** another administrator exists
- **THEN** the deletion proceeds
