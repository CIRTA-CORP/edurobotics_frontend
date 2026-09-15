## ADDED Requirements

### Requirement: On-screen help describes only the available tools
The system SHALL keep the simulator's in-product documentation aligned with the tools the
learner actually has. When an editing mode is disabled, the help SHALL stop instructing
learners to use it.

#### Scenario: Help matches the interface
- **WHEN** a learner opens the simulator's documentation panel
- **THEN** every tab, panel and control it names is present in the interface

#### Scenario: A disabled mode is not explained
- **WHEN** block-based programming is disabled
- **THEN** the help does not mention a "Bloques" tab nor tell the learner to drag blocks
