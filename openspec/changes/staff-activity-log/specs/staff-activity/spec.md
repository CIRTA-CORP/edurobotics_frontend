## ADDED Requirements

### Requirement: Staff actions are recorded

Every successful create, update or delete made by an administrator or a teacher through a
staff route SHALL be recorded with who did it, their role at that moment, the action, the
resource type, id and name, the course it belongs to, and when. The resource name SHALL be
captured before the action runs, so a deleted resource keeps its name in the record.

#### Scenario: A teacher deletes a unit
- **WHEN** a teacher deletes the unit «Sensores» of their course
- **THEN** a record says that teacher deleted the unit «Sensores» of that course, and when

#### Scenario: A rejected attempt
- **WHEN** a teacher tries to edit a course that is not theirs and gets 403
- **THEN** nothing is recorded

### Requirement: Student activity is not recorded as staff activity

Progress, heartbeats, quiz submissions, enrolment, feedback, profile and password changes
SHALL NOT be recorded, whoever makes them.

#### Scenario: An administrator previews a course
- **WHEN** an administrator completes contents while previewing a course
- **THEN** no staff action is recorded

### Requirement: Every staff route is covered

Each route that requires a staff role and modifies data SHALL be either in the list of
recorded routes or in the list of deliberately excluded ones, enforced by a test.

#### Scenario: A new staff route
- **WHEN** a developer adds a staff route that modifies data without listing it
- **THEN** the test suite fails, naming the route

### Requirement: Administrators can review staff activity

Administrators SHALL be able to list staff actions, most recent first, filtered by person,
role, course and date range. Teachers and students SHALL NOT have access. Records older than
12 months SHALL be deleted.

#### Scenario: Who changed the landing page
- **WHEN** the director filters by the landing page in the last week
- **THEN** she sees who edited it and when

#### Scenario: A teacher asks for the log
- **WHEN** a teacher requests the staff activity
- **THEN** the request is rejected with 403
