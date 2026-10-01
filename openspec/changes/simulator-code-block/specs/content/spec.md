## ADDED Requirements

### Requirement: Code blocks can be marked for the simulator
The content editor SHALL let an author mark a code block as code for the simulator,
and unmark it again, without rewriting the block's content. A marked block SHALL be
stored as Python and SHALL be visually distinguishable from an ordinary code block
wherever the lesson is shown.

#### Scenario: Marking a block
- **WHEN** an author marks a code block for the simulator and saves the lesson
- **THEN** the block is still marked when the lesson is opened again

#### Scenario: Unmarking a block
- **WHEN** an author unmarks a block
- **THEN** it becomes an ordinary code block with the same content

#### Scenario: Older content is unaffected
- **WHEN** a lesson saved before this change is opened
- **THEN** its code blocks are shown as ordinary code blocks
