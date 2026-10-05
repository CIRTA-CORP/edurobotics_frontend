## ADDED Requirements

### Requirement: The editor is part of the measured bundle
The system SHALL include the code editor in its own build, loaded on demand with the
simulator route, so its weight is visible in the build output instead of hidden in a runtime
request to another server.

#### Scenario: The editor loads with the simulator, not before
- **WHEN** a learner visits a page other than the simulator
- **THEN** the editor's chunk is not fetched

#### Scenario: Its size is known
- **WHEN** the production bundle is built
- **THEN** the editor appears as a chunk with a measurable size
