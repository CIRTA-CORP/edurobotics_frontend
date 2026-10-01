## ADDED Requirements

### Requirement: The simulator opens with the lesson's code
The system SHALL let an author mark a code block in a lesson as code for the
simulator, and SHALL let a learner open the simulator from that block with its code
loaded in the editor instead of the default template. Only blocks the author marked
SHALL offer this.

#### Scenario: The learner opens the lesson's code
- **WHEN** a learner presses "Probar en el simulador" on a marked block
- **THEN** the simulator opens with that block's code in the editor

#### Scenario: Ordinary code blocks are left alone
- **WHEN** a lesson contains a code block that is not marked for the simulator
- **THEN** it is shown as code, with no button to open the simulator

#### Scenario: The button grants access
- **WHEN** a learner who has not entered the simulator before presses the button
- **THEN** the simulator opens, as it does from the "Simulador 3D" block

#### Scenario: The learner is told where the code came from
- **WHEN** the simulator opens with code from a lesson
- **THEN** it shows which lesson the code came from

### Requirement: A learner's work is kept per exercise
The system SHALL keep what a learner writes for each marked block separately, so that
returning to an exercise shows the learner's version and work on one exercise never
appears in another. The learner SHALL be able to restore the author's current code.

#### Scenario: Returning to an exercise
- **WHEN** a learner who modified an exercise opens it again from the lesson
- **THEN** the editor shows the learner's version, not the author's

#### Scenario: Exercises do not mix
- **WHEN** a learner opens a different exercise
- **THEN** the editor shows that exercise's code, not the previous one

#### Scenario: Accounts sharing a computer
- **WHEN** a learner modifies an exercise and signs out, and another learner signs in on the same browser and opens the same exercise
- **THEN** the second learner sees the author's code, not the first learner's version

#### Scenario: Restoring the lesson's code
- **WHEN** the learner presses "Restablecer el código de la clase"
- **THEN** the editor shows the author's current code for that exercise

#### Scenario: Entering without a lesson
- **WHEN** someone opens the simulator without coming from a marked block
- **THEN** it opens as it did before this change
