# Purpose

The shared simulator machine is protected by a configurable concurrent session
cap with an honest "busy" state.

## Requirements

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

### Requirement: Capacity is queryable before connecting
The system SHALL expose the simulator's current capacity (active / max) so the client can show the
"busy" state before attempting a session.

#### Scenario: Capacity endpoint
- **WHEN** the client requests simulator capacity
- **THEN** it receives the active count, the max, and whether a slot is available

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

### Requirement: Stopping the shared machine is an administrative action
The system SHALL restrict stopping the simulator machine to administrators. The machine is
shared, so a stop affects every learner using it.

#### Scenario: A learner cannot stop the machine
- **WHEN** a student calls the stop endpoint
- **THEN** it is rejected with 403 and the machine keeps running

#### Scenario: An administrator can stop it
- **WHEN** an administrator calls the stop endpoint
- **THEN** the machine is stopped

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

### Requirement: Writing a program never waits
The system SHALL let any learner open the simulator and write code regardless of who is
executing. Only running a program requires the machine.

#### Scenario: The editor opens while someone else runs
- **WHEN** a learner opens the simulator while another is executing
- **THEN** the editor opens and they can write, and only pressing run makes them wait

### Requirement: The arm reaches the commanded pose and holds it
The system SHALL move the arm to the commanded joint positions and SHALL keep it there
until the next command. No other controller SHALL move the arm while it is idle.

#### Scenario: A move completes
- **WHEN** a program moves the arm to a pose
- **THEN** every joint ends within 0.01 rad of the commanded position

#### Scenario: The arm stays where it was sent
- **WHEN** a move has completed and the program waits
- **THEN** the arm stays at the commanded pose

#### Scenario: A command takes effect promptly
- **WHEN** a program issues a move
- **THEN** the arm starts moving within 50 ms

### Requirement: Motion respects the limits of a real UR5e
The system SHALL reject joint positions outside the UR5e's range, and SHALL not move a
joint faster than the UR5e can. A request that is too fast SHALL be slowed to the
fastest feasible duration, and the learner SHALL be told.

#### Scenario: A position out of range
- **WHEN** a program asks the elbow for a position beyond ±180°
- **THEN** the program fails with an error naming the limit, before the arm moves

#### Scenario: A move that is too fast
- **WHEN** a program asks for a move faster than 180°/s
- **THEN** the move takes the minimum feasible time and the terminal says so

### Requirement: A collision stops the arm
The system SHALL stop the arm where it is if, during a move, it touches itself or the
ground, and SHALL report the stop to the learner's program as an error.

#### Scenario: The arm hits itself
- **WHEN** a move brings two non-adjacent parts of the arm into contact
- **THEN** the arm stops and the program fails with a protective-stop error naming the parts

#### Scenario: Normal poses do not trigger a stop
- **WHEN** the arm moves between poses that do not bring parts into contact
- **THEN** no protective stop occurs

### Requirement: The animation shows what the physics did
The system SHALL animate only positions measured in the simulation, never positions
assumed to have been reached.

#### Scenario: The recorded movement
- **WHEN** a program's movement is played back
- **THEN** every frame comes from the simulation's measured joint positions
