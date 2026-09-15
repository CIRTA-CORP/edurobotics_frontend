## ADDED Requirements

### Requirement: A feature disabled by a flag is not downloaded
The system SHALL load flag-gated features on demand, so a feature turned off does not cost
the learner any bandwidth. Turning the flag on SHALL still load and run the feature.

#### Scenario: Disabled feature ships nothing
- **WHEN** the block editor is disabled and a learner opens the simulator
- **THEN** the block library's chunk is not fetched

#### Scenario: Enabling the flag restores the feature
- **WHEN** the block editor is enabled
- **THEN** its chunk is fetched on demand and the panel works
