## ADDED Requirements

### Requirement: A unit's blocks are an ordered mix of contents and quizzes
The system SHALL let a quiz occupy a position in a unit's flow, so contents and quizzes
render interleaved by order.

#### Scenario: Interleaved order is preserved
- **WHEN** an admin places a quiz between two contents (by order_index)
- **THEN** the course detail returns the unit's blocks ordered content → quiz → content
- **AND THEN** the student sees them in that order

#### Scenario: Existing quizzes keep their place
- **WHEN** the order_index backfill runs
- **THEN** each existing quiz is ordered after its unit's contents (its current position)

### Requirement: Content carries metadata and is validated by type
The system SHALL store an optional title and duration for a content, and validate
content_value according to content_type.

#### Scenario: Invalid content is rejected
- **WHEN** a video content is saved with a value that is not a valid URL
- **THEN** the request is rejected with a clear error

#### Scenario: HTML is sanitized on the frontend only
- **WHEN** rich text is rendered
- **THEN** the frontend sanitizes it (sanitizeHtml.js) before insertion
- **AND THEN** the backend does not duplicate sanitization
