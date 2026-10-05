## ADDED Requirements

### Requirement: Stopping the shared machine is an administrative action
The system SHALL restrict stopping the simulator machine to administrators. The machine is
shared, so a stop affects every learner using it.

#### Scenario: A learner cannot stop the machine
- **WHEN** a student calls the stop endpoint
- **THEN** it is rejected with 403 and the machine keeps running

#### Scenario: An administrator can stop it
- **WHEN** an administrator calls the stop endpoint
- **THEN** the machine is stopped
