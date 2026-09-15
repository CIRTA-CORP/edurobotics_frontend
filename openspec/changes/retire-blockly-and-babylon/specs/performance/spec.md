## ADDED Requirements

### Requirement: Retired features ship nothing
The system SHALL NOT ship code for features it no longer offers. Retiring a capability
SHALL remove its dependencies, not just hide its entry point.

#### Scenario: Neither retired library is downloaded
- **WHEN** a learner opens the simulator
- **THEN** no chunk of the block-programming library or the legacy 3D engine is fetched

#### Scenario: They are not in the build either
- **WHEN** the production bundle is built
- **THEN** neither library appears in any chunk
