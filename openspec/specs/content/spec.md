# Purpose

Contenido de las unidades: bloques ordenables (contenidos + quizzes intercalados),
metadatos y validación por tipo. La jerarquía es Curso → Módulo → Unidad → Contenido.

## Requirements

### Requirement: A unit's blocks are an ordered mix of contents and quizzes
The system SHALL let a quiz occupy a position in a unit's flow, so contents and quizzes
render interleaved by `order_index`.

#### Scenario: Interleaved order is preserved
- **WHEN** an admin places a quiz between two contents (by order_index)
- **THEN** the course detail returns the unit's blocks ordered content → quiz → content

#### Scenario: Existing quizzes keep their place
- **WHEN** the quiz order_index backfill runs
- **THEN** each existing quiz is ordered after its unit's contents

### Requirement: Content carries metadata and is validated by type
The system SHALL store an optional title and duration for a content, and validate
`content_value` by `content_type`.

#### Scenario: Invalid content is rejected
- **WHEN** a video content is saved with a value that is not a valid URL
- **THEN** the request is rejected

#### Scenario: HTML is sanitized on the frontend only
- **WHEN** rich text is rendered
- **THEN** the frontend sanitizes it (sanitizeHtml.js); the backend does not duplicate sanitization

### Requirement: Nested content endpoints respect the parent course's visibility
The system SHALL hide a unit's contents/quizzes when the parent course is unpublished, for
non-admins.

#### Scenario: Contents of an unpublished course
- **WHEN** a non-admin requests the contents of a unit in an unpublished course
- **THEN** the response is 404
