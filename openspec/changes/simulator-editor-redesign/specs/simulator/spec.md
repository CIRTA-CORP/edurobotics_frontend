## ADDED Requirements

### Requirement: The starter program always shows motion

The editor SHALL open, when there is no saved code and no lesson code, with a starter
program that moves the arm to a known pose before anything else, so that running it shows
motion wherever the arm was left. The program SHALL run on the simulator without protective
stops or warnings and within the 40 s program limit.

#### Scenario: First visit
- **WHEN** a student opens the simulator for the first time
- **THEN** the editor shows the starter program
- **AND THEN** running it moves the arm to the vertical pose, rotates the wrist, takes a
  work pose, pans the base, closes and opens the gripper, and returns to vertical

#### Scenario: Arm already in the target pose
- **WHEN** the arm was left in any pose by a previous run
- **AND** the student runs the starter program
- **THEN** the viewer shows the arm moving

### Requirement: The guide is a verified reference of robot_api

The Guide tab SHALL document how a run works, every public element of `robot_api`
(`Robot`, `move_joints`, `get_joint_states`, `open_gripper`, `close_gripper`, `home`,
`RobotCollisionError`), the six joints with their ranges, the simulator limits and the
common errors. Every example program in the guide SHALL have been run on the simulator
machine without protective stops or warnings, except the one that demonstrates a
protective stop. Code SHALL be highlighted with the editor's own tokenizer and theme, and
each block SHALL offer copying.

#### Scenario: Output arrives after the run
- **WHEN** a student reads how a run works
- **THEN** the guide says the program runs to completion first, and the output and the
  replayed motion appear afterwards

#### Scenario: Opening an example
- **WHEN** a student presses «Abrir en el editor» on an example
- **THEN** the editor content is replaced by the example and the Editor tab is shown
  with the editor focused
- **AND THEN** `Ctrl+Z` restores the previous program

### Requirement: Ctrl+Enter runs the program

The editor SHALL run the program when `Ctrl+Enter` (or `Cmd+Enter`) is pressed, exactly as
the Run button does.

#### Scenario: Shortcut
- **WHEN** the editor has focus and the student presses `Ctrl+Enter`
- **THEN** the program is sent to the simulator

### Requirement: The terminal classifies lines by message type

The terminal SHALL classify each line from the type of the message that carried it, not
by searching its text, and SHALL label it as output, system, warning, protective stop,
error or success. Error and protective-stop lines SHALL have a tinted background. Messages
the backend sends in English SHALL be shown in Spanish. The wrapper line
`[sim] Simulacion lista` SHALL be hidden.

#### Scenario: A student prints the word "error"
- **WHEN** the program runs `print("sin errores")`
- **THEN** the line is shown as plain output, not as an error

#### Scenario: Protective stop
- **WHEN** the run ends with `RobotCollisionError`
- **THEN** the terminal shows the stop with the `PARADA` label

#### Scenario: Simulator not started
- **WHEN** the backend answers that the simulator is not running
- **THEN** the terminal tells the student to press «Iniciar simulador»

### Requirement: Adding a pose from the preview appends a runnable call

«Añadir al editor», in the pose preview, SHALL append a `move_joints` call with the
preview's angles at the end of the program, without removing existing code. It SHALL add
`from robot_api import Robot` at the top when no import of `Robot` exists, and a robot
instance before the call when none exists; when one exists, the call SHALL use its name.
The insertion SHALL be undoable with `Ctrl+Z`.

#### Scenario: Empty editor
- **WHEN** the editor is empty and the student adds a pose
- **THEN** the program contains the import, `robot = Robot()` and the call, and runs
  without `NameError`

#### Scenario: Custom instance name
- **WHEN** the program already has `brazo = Robot()`
- **THEN** the appended call is `brazo.move_joints(...)`

### Requirement: Code uses Cascadia Code

The editor, the terminal and the code in the guide SHALL use Cascadia Code, bundled with
the application. The rest of the page SHALL keep its typography. The editor SHALL remeasure
its fonts once Cascadia Code has loaded.

#### Scenario: Content Security Policy
- **WHEN** the simulator page loads in production
- **THEN** the font is served from the application's own origin

### Requirement: The pose sliders are a preview

The joint sliders SHALL be presented as a pose preview that moves the view and not the
robot. Opening them SHALL start from the arm's current pose; closing them SHALL return the
view to the real pose. The «Posición de inicio» button SHALL be removed, since it only
moved the view.

#### Scenario: Closing the preview
- **WHEN** the student moves the sliders and closes the preview
- **THEN** the viewer shows the robot's real pose again

### Requirement: Download and upload keep the program safe

Download SHALL save the editor content as `programa.py`. Upload SHALL replace the program
as an undoable edit and SHALL accept the same file twice in a row.

#### Scenario: Undo an upload
- **WHEN** the student uploads a file by mistake
- **THEN** `Ctrl+Z` restores the previous program
