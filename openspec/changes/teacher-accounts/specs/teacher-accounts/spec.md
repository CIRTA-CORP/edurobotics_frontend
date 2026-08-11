## ADDED Requirements

### Requirement: A teacher role exists with read-only access to student progress
The system SHALL support a `teacher` role that can view students' progress but SHALL NOT grant
any write/administration capability. Content, courses, and role management remain admin-only.

#### Scenario: Teacher views student progress
- **WHEN** a teacher opens the teacher view
- **THEN** they see students with their started/completed courses, quiz pass rate and last activity

#### Scenario: Teacher cannot perform admin actions
- **WHEN** a teacher calls an admin write endpoint (edit course, change role, delete)
- **THEN** the response is 403

#### Scenario: Student cannot access the teacher view
- **WHEN** a student requests a teacher endpoint or route
- **THEN** access is denied

### Requirement: Admin can assign the teacher role
The system SHALL let an administrator set a user's role to teacher (and back), keeping the
"cannot remove the last admin" safeguard.

#### Scenario: Promote a user to teacher
- **WHEN** an admin sets a user's role to `teacher`
- **THEN** that user gains read-only access to student progress on next login

### Requirement: Teacher responses never expose sensitive data
The system SHALL exclude password hashes and unnecessary PII from teacher-facing responses,
and SHALL NOT expose role-management controls to teachers.

#### Scenario: Teacher student list is minimal
- **WHEN** a teacher fetches the student list
- **THEN** the response contains progress fields but no password hashes or role-editing affordances
