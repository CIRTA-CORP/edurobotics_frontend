## MODIFIED Requirements

### Requirement: A unit's blocks are an ordered mix of contents and quizzes
The system SHALL let a quiz occupy a position in a unit's flow, so contents and quizzes
render interleaved by `order_index`. The student viewer SHALL render every content block
in its authored `order_index` position (rich_text, text, video, image, file, resource,
simulator), without hoisting any type; the unit's quiz remains the end-of-unit gate.

#### Scenario: Interleaved order is preserved
- **WHEN** an admin places a quiz between two contents (by order_index)
- **THEN** the course detail returns the unit's blocks ordered content → quiz → content

#### Scenario: Existing quizzes keep their place
- **WHEN** the quiz order_index backfill runs
- **THEN** each existing quiz is ordered after its unit's contents

#### Scenario: The viewer renders content in authored order
- **WHEN** a unit's contents are authored as image → text → video
- **THEN** the student viewer renders them in that same order, not with rich text hoisted to the top
