# Purpose

Especializaciones: agrupaciones ordenadas de cursos, gestionadas por admin y mostradas
públicamente (tarjetas, chips y color en la malla).

## Requirements

### Requirement: Admins manage specializations and their courses
The system SHALL let admins create, edit and delete specializations and set their ordered
list of courses.

### Requirement: Only published specializations and their published courses are public
The system SHALL hide unpublished specializations and unpublished courses from students
and visitors, both in the listing and the detail.

#### Scenario: Unpublished specialization
- **WHEN** a non-admin requests an unpublished specialization by id
- **THEN** the response is 404

#### Scenario: Unpublished course inside a specialization
- **WHEN** a non-admin views a published specialization that contains an unpublished course
- **THEN** the unpublished course is not listed

### Requirement: Specializations are visible in the roadmap
The system SHALL colour-code each course by its specialization in the roadmap and show the
specialization's progress (see the `roadmap` capability).
