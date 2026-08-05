## ADDED Requirements

### Requirement: The roadmap shows each specialization's progress
The system SHALL show, in the roadmap, how far the user has advanced in each
specialization (completed courses over its total).

#### Scenario: Progress on the chips
- **WHEN** the roadmap loads for a logged-in user
- **THEN** each specialization chip shows its completion percentage

#### Scenario: Header when a specialization is selected
- **WHEN** the user selects a specialization filter
- **THEN** a header shows "X de Y cursos · Z%" for that specialization

### Requirement: Course nodes have consistent thumbnails
The system SHALL render a branded fallback when a course has no image, so nodes look
consistent.

#### Scenario: Course without an image
- **WHEN** a course node has no image_url
- **THEN** it shows a branded gradient with an icon instead of an empty box

### Requirement: A course in several specializations is indicated
The system SHALL indicate when a course belongs to more than one specialization.

#### Scenario: Multi-specialization course
- **WHEN** a course belongs to two or more specializations
- **THEN** its node shows its primary specialization plus a "+N" indicator

### Requirement: Hovering a course highlights its prerequisites
The system SHALL highlight the prerequisite arrows connected to a course when the user
hovers it.

#### Scenario: Hover highlights the chain
- **WHEN** the user hovers a course node
- **THEN** the arrows connecting it to its prerequisites are highlighted
