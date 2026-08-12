## ADDED Requirements

### Requirement: An admin assigns courses to a teacher
The system SHALL let an administrator assign a course to a teacher (and remove the assignment),
recorded as a course↔teacher membership. Global course actions remain admin-only.

#### Scenario: Assign a course
- **WHEN** an admin assigns a course to a teacher
- **THEN** that teacher can manage the course's content and see its students

### Requirement: A teacher manages only their assigned courses
The system SHALL let a teacher create and edit modules, units, content and quizzes ONLY for courses
they are assigned to, and SHALL reject edits to courses they are not assigned to.

#### Scenario: Edit an assigned course
- **WHEN** an assigned teacher edits a unit of their course
- **THEN** the change is accepted

#### Scenario: Edit a non-assigned course
- **WHEN** a teacher tries to edit content of a course they are not assigned to
- **THEN** the response is 403

### Requirement: Teachers cannot perform global admin actions
The system SHALL keep global actions (publish/delete a course, change roles, manage specializations
and landing) admin-only, regardless of course assignment.

#### Scenario: Teacher attempts a global action
- **WHEN** a teacher tries to publish/delete a course or change a user's role
- **THEN** the response is 403

### Requirement: A teacher sees the progress of their courses' students
The system SHALL scope the teacher's student-progress view to the students of the courses they are
assigned to.

#### Scenario: Progress is scoped
- **WHEN** a teacher opens the progress view
- **THEN** it shows students of their assigned courses only
