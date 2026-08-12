## ADDED Requirements

### Requirement: The content editor supports code blocks and inline code
The system SHALL let an author insert code blocks and inline code in a unit's content, and SHALL
render them as code (monospaced, with a code style) — never as italic or plain prose — both in the
editor and in the student viewer.

#### Scenario: Author writes a code block
- **WHEN** an author uses the code-block button and types code
- **THEN** it renders monospaced with a code background, not italic

#### Scenario: Student sees the code
- **WHEN** a student opens a lesson containing a code block
- **THEN** the code renders as a code block, preserving formatting

#### Scenario: Code rendering stays safe
- **WHEN** rich content containing code is sanitized and rendered
- **THEN** `<pre>`/`<code>` are allowed but scripts and event handlers remain stripped
