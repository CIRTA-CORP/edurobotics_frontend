## ADDED Requirements

### Requirement: The simulator downloads only the viewer it renders
The system SHALL load each 3D viewer on demand, so opening the simulator downloads only the
viewer actually being rendered. The legacy viewer, reachable only via an explicit
`?viewer=babylon`, SHALL NOT be part of the simulator route's static import graph.

#### Scenario: Default visit does not download the legacy engine
- **WHEN** a learner opens `/simulator` without a viewer parameter
- **THEN** the URDF viewer's chunk is fetched and the legacy engine's chunk is not

#### Scenario: The legacy viewer still works when asked for
- **WHEN** a learner opens `/simulator?viewer=babylon`
- **THEN** the legacy engine's chunk is fetched on demand and renders

#### Scenario: The comparison page may load both
- **WHEN** the side-by-side comparison page is opened
- **THEN** both viewers load, since it renders them together by definition
