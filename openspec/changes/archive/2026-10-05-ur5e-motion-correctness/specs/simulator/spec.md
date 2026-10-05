## ADDED Requirements

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
