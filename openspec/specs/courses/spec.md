# Purpose

Cursos: creación/edición, publicación y visibilidad, prerequisitos, y los datos que
alimentan la malla.

## Requirements

### Requirement: Admins manage courses
The system SHALL let admins create, edit and delete courses (title, description, image,
level, publish state) and set prerequisites.

#### Scenario: Save a course with its prerequisites
- **WHEN** an admin saves a course in edit mode
- **THEN** the course and its prerequisites are persisted together

### Requirement: Unpublished courses are hidden from non-admins
The system SHALL only expose published courses to students and visitors; unpublished
courses are 404 for non-admins.

#### Scenario: Direct access to an unpublished course
- **WHEN** a non-admin requests an unpublished course by id
- **THEN** the response is 404
- **AND WHEN** an admin requests it
- **THEN** it is returned

### Requirement: Course listings are stably ordered
The system SHALL return courses in a stable order (by id) so editing a course does not
move it in the listing or the roadmap.

#### Scenario: Editing does not reorder
- **WHEN** a course is edited (e.g. its image changes)
- **THEN** its position in the listing and the roadmap is unchanged

### Requirement: Prerequisites gate course access
The system SHALL report whether a user meets a course's prerequisites, and the study view
SHALL block a course whose prerequisites are unmet (non-admins).

#### Scenario: Locked course
- **WHEN** a student opens a course whose prerequisites are not completed
- **THEN** they are sent to the course preview, not the study view
