## MODIFIED Requirements

### Requirement: The simulator limits concurrent user sessions
The system SHALL cap the number of concurrent simulator executions at a configurable
maximum (`SIM_MAX_CONCURRENT`), defaulting to one because a single machine hosts a single
robot and two programs would otherwise move the same arm. When the cap is reached, it SHALL
place further users in a first-in-first-out queue rather than refusing them.

#### Scenario: Execution allowed under the cap
- **WHEN** a learner runs their program and no one else is executing
- **THEN** it runs immediately

#### Scenario: A second learner waits their turn
- **WHEN** a learner runs their program while someone else is executing
- **THEN** they are told their position in the queue instead of being refused

#### Scenario: The turn is granted without asking again
- **WHEN** the running execution finishes
- **THEN** the first waiting learner's program runs without them pressing anything

#### Scenario: Position updates while waiting
- **WHEN** someone ahead in the queue finishes or leaves
- **THEN** the waiting learner sees their new position

#### Scenario: Leaving the queue frees it
- **WHEN** a waiting learner closes the simulator
- **THEN** they are removed from the queue and the next one moves up

#### Scenario: One user does not take two places
- **WHEN** the same learner opens the simulator in two tabs
- **THEN** they occupy a single place

#### Scenario: Waiting does not last forever
- **WHEN** a learner has waited beyond the maximum
- **THEN** they are told they could not get in, rather than left hanging

### Requirement: Writing a program never waits
The system SHALL let any learner open the simulator and write code regardless of who is
executing. Only running a program requires the machine.

#### Scenario: The editor opens while someone else runs
- **WHEN** a learner opens the simulator while another is executing
- **THEN** the editor opens and they can write, and only pressing run makes them wait
