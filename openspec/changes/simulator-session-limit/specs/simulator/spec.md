## ADDED Requirements

### Requirement: The simulator limits concurrent user sessions
The system SHALL cap the number of concurrent simulator users at a configurable maximum
(`SIM_MAX_CONCURRENT`). When the cap is reached, it SHALL reject new sessions with a "busy"
message instead of degrading the shared machine. It SHALL NOT implement a waitlist.

#### Scenario: Session allowed under the cap
- **WHEN** a user opens the simulator and active users are below the cap
- **THEN** the session is allowed

#### Scenario: Session rejected at the cap
- **WHEN** a user opens the simulator and active users are at the cap
- **THEN** the connection is refused with a "simulador ocupado, intenta más tarde" message

#### Scenario: One user does not consume two slots
- **WHEN** the same user opens the simulator in two tabs
- **THEN** they occupy a single slot

#### Scenario: Slot is released on disconnect
- **WHEN** an active user disconnects
- **THEN** their slot frees up for another user

### Requirement: Capacity is queryable before connecting
The system SHALL expose the simulator's current capacity (active / max) so the client can show the
"busy" state before attempting a session.

#### Scenario: Capacity endpoint
- **WHEN** the client requests simulator capacity
- **THEN** it receives the active count, the max, and whether a slot is available
