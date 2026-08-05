# Purpose

Progreso del alumno: marcar contenido completado, registrar el acceso a una unidad, y
computar los estados del roadmap.

## Requirements

### Requirement: Track content completion and unit access
The system SHALL record when a user completes a content and when they open a unit (so
time-spent metrics can measure from opening to completing, not just the completion instant).

#### Scenario: Completion is idempotent
- **WHEN** a content is marked complete more than once
- **THEN** it stays completed with a single progress row

### Requirement: The roadmap reports per-scope state
The system SHALL compute `not_started` / `in_progress` / `completed` per unit, module and
course, using the single completion definition (see the `completion` capability).

#### Scenario: Roadmap for a course
- **WHEN** a user's roadmap is requested for a course
- **THEN** each unit, module and the course report their state and percentage
