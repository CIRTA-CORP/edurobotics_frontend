## ADDED Requirements

### Requirement: The viewer reproduces the robot's real movement
The system SHALL record, with each captured joint position, the moment at which it was
captured, and SHALL reproduce those positions in the viewer at the intervals that actually
elapsed between them. The arm SHALL pass through every captured position rather than
approaching them.

#### Scenario: The playback lasts what the execution lasted
- **WHEN** a learner runs a program whose movement takes two seconds
- **THEN** the arm's movement on screen takes two seconds, not noticeably more or less

#### Scenario: The arm reaches the positions the code asks for
- **WHEN** a program moves the arm to a joint configuration
- **THEN** the arm on screen reaches that configuration, rather than stopping short of it

#### Scenario: A pause is reproduced as a pause
- **WHEN** a program moves, waits, and moves again
- **THEN** the arm on screen moves, stays still for the length of the wait, and moves again

#### Scenario: Repeated frames do not stutter the movement
- **WHEN** the robot's position is unchanged between two captures
- **THEN** no duplicate frame is produced, and the movement shows no pause that the robot did not make

#### Scenario: The same program produces the same playback
- **WHEN** a learner runs the same program twice
- **THEN** both runs produce the same number of frames and the same duration

### Requirement: Movement is smooth regardless of the capture rate
The system SHALL interpolate the arm's position between consecutive captured frames, so
that movement is continuous on screen even though frames arrive at a lower rate than the
display refreshes.

#### Scenario: Frames arrive slower than the screen refreshes
- **WHEN** captured positions arrive ten times a second
- **THEN** the arm moves continuously rather than jumping between positions

#### Scenario: A frame is delayed
- **WHEN** the next captured position does not arrive when expected
- **THEN** the arm holds the last known position instead of continuing to move

### Requirement: The learner is told the animation is playing
The system SHALL indicate that the movement being shown is a replay of the finished
program, so that the arm moving after the program reports completion is explained rather
than appearing to be a fault.

#### Scenario: The program finishes before the arm stops moving
- **WHEN** the program completes and the recorded movement is still being played
- **THEN** the terminal says the animation is playing

### Requirement: Viewer diagnostics stay out of the learner's way
The system SHALL NOT show the viewer's load diagnostics — robot name, joint count, mesh
count — to learners in any environment; they SHALL be available on demand through an
explicit debug flag. Load failures SHALL always be shown, in every environment, because a
viewer that failed to load is otherwise indistinguishable from an empty scene.

#### Scenario: A learner does not see load diagnostics
- **WHEN** a learner opens the simulator
- **THEN** no robot name, joint count or mesh count is shown over the viewer

#### Scenario: Diagnostics are available when asked for
- **WHEN** the simulator is opened with the viewer debug flag
- **THEN** the robot name, joint count and mesh count are shown

#### Scenario: A load failure is always visible
- **WHEN** the robot description fails to load
- **THEN** the reason is shown over the viewer, regardless of environment or flag
