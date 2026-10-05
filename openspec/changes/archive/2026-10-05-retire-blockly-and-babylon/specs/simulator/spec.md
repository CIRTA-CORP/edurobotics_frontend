## ADDED Requirements

### Requirement: The simulator has one editor and one viewer
The system SHALL offer a single way to write a program — a Python editor — and a single 3D
viewer, the URDF-driven one. Block programming and the legacy engine SHALL NOT be present.

#### Scenario: Only the editor is offered
- **WHEN** a learner opens the simulator
- **THEN** there is no block-programming tab, and the program is written in the Python editor

#### Scenario: A stored preference for the removed tab does not break the panel
- **WHEN** a learner's saved panel preference names the removed block tab
- **THEN** the simulator opens on the editor instead of on a blank panel

#### Scenario: The legacy viewer is gone
- **WHEN** the simulator is opened with any viewer parameter
- **THEN** the URDF viewer renders, because it is the only one
