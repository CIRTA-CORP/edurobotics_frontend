## ADDED Requirements

### Requirement: The course index shows progress as a module timeline
The study view SHALL present the course index as a sequence of modules where the current module
is expanded with its units and module progress, completed modules are collapsed and marked done,
and upcoming modules are dimmed.

#### Scenario: Current module is expanded
- **WHEN** a student opens a unit
- **THEN** its module is expanded showing every unit of that module and the module's progress,
  with the current unit highlighted

#### Scenario: Completed module is collapsed and marked
- **WHEN** every unit of a module is completed
- **THEN** that module is collapsed and shown as done

### Requirement: A single primary action drives forward progress
The study view SHALL present exactly one primary action whose label reflects the current state:
mark the unit as read, complete the module, start the next module, go to the next unit, or
finish the course.

#### Scenario: Unread unit offers to mark as read
- **WHEN** a student is on a unit that is not completed
- **THEN** the primary action offers to mark it as read

#### Scenario: Last pending unit of a module completes the module
- **WHEN** the current unit is the only one still pending in its module
- **THEN** the primary action offers to complete that module

#### Scenario: Completed unit offers to move on
- **WHEN** the current unit is completed and another unit follows
- **THEN** the primary action offers to go to the next unit, or to start the next module when
  the following unit belongs to a different module

#### Scenario: Last unit finishes the course
- **WHEN** the current unit is completed and is the last of the course
- **THEN** the primary action finishes the course and opens the course feedback step

### Requirement: Navigation alone never records progress
The system SHALL record unit completion only from an explicit student action or from
demonstrated interaction; moving between units SHALL NOT mark anything as completed.

#### Scenario: Jumping from the index does not complete
- **WHEN** a student jumps to another unit from the index
- **THEN** no unit is marked as completed

#### Scenario: No forward link bypasses the primary action
- **WHEN** a student looks at the unit footer
- **THEN** the only forward control is the primary action, with the previous-unit link kept as
  the sole secondary navigation

### Requirement: Demonstrated interaction completes the unit
The system SHALL mark a unit as completed without asking for an extra confirmation when the
student passes its quiz or runs its simulator.

#### Scenario: Passing the quiz completes the unit
- **WHEN** a student passes the unit's quiz
- **THEN** the unit is marked as completed without requiring a separate "mark as read" click

### Requirement: Unit material renders as one consistent set of blocks
The study view SHALL render video, PDF, downloadable file, external link, simulator and
assessment with the same border, radius and density, so a long unit reads as one document
rather than a collection of unrelated boxes.

#### Scenario: Mixed unit reads as one document
- **WHEN** a unit contains text, a video, a PDF and a simulator
- **THEN** every block shares the same visual grammar

#### Scenario: Locked assessment is stated
- **WHEN** the unit's assessment is not yet available
- **THEN** it is shown in a locked state instead of being hidden

### Requirement: A section rail is offered only when it helps
The study view SHALL build a section rail from the lesson's own headings and SHALL omit it when
the unit has fewer than two headings.

#### Scenario: Short unit has no rail
- **WHEN** a unit's lesson has fewer than two headings
- **THEN** no section rail is displayed

### Requirement: The study view works at mobile width
The study view SHALL keep the same hierarchy and blocks at 390 px, with the module index
available from a bottom sheet.

#### Scenario: Index on mobile
- **WHEN** a student opens the index at 390 px
- **THEN** the module timeline opens as a bottom sheet over the lesson
