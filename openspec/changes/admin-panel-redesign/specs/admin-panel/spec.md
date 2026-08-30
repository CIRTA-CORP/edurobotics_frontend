## ADDED Requirements

### Requirement: The redesign removes no existing capability
Every function the admin panel performs today SHALL remain available after the redesign. Where a
function changes location, the new location SHALL be recorded in the coverage map before the
change is implemented.

#### Scenario: A function has no place in the new design
- **WHEN** a function from the coverage map has no home in the redesigned screen
- **THEN** implementation stops and the gap is raised, rather than the function being dropped

### Requirement: Course content is edited from a single tree
The panel SHALL present a course's modules and units as one tree, where selecting a node both
selects it and navigates to its editor. The separate "Gestionar" step and the chained
Módulos → Unidades → Contenido → Evaluaciones tabs SHALL NOT remain.

#### Scenario: Selecting a unit opens its editor
- **WHEN** an administrator clicks a unit in the tree
- **THEN** the right panel shows that unit's Contenido, Evaluación and Ajustes tabs

#### Scenario: The tree states the position
- **WHEN** an administrator is editing a unit
- **THEN** the tree shows which course, module and unit are selected, and the editor carries a
  context line rather than a separate breadcrumb bar

### Requirement: The rich text editor is relocated, not rewritten
The lesson editor SHALL keep every one of its current controls and behaviours when it moves into
the unit's Contenido tab.

#### Scenario: Editor controls survive the move
- **WHEN** an administrator opens the Contenido tab
- **THEN** formatting, headings, lists, links, image, YouTube, attachments, alignment, undo/redo
  and drag-to-resize all work as before

#### Scenario: Saving is explicit
- **WHEN** an administrator edits lesson content
- **THEN** the editor header offers Guardar, reports when it last saved, and states that changes
  are not published until saved

### Requirement: Destructive course actions are separated from editing
Deleting a course SHALL live in its own clearly marked area, apart from the edit form, and SHALL
remind the administrator to download the backup first.

#### Scenario: Deleting a course
- **WHEN** an administrator opens the course detail screen
- **THEN** deletion appears in a distinct "sensitive" area with its confirmation and a reminder
  to download the backup

### Requirement: The user table can be searched and filtered
The users screen SHALL offer search and a role filter, and SHALL state the role-change safeguards
alongside the table rather than only on failure.

#### Scenario: Finding a user
- **WHEN** an administrator types a name, username or email
- **THEN** the table narrows to matching users

#### Scenario: Safeguards are visible
- **WHEN** an administrator views the users table
- **THEN** the rules "you cannot change your own role" and "the last admin cannot be demoted" are
  stated on screen

### Requirement: Analytics live on one screen, ordered by question
Platform figures SHALL be presented together on the analytics screen instead of being split
across the dashboard, the courses tab and analytics.

#### Scenario: One place for the numbers
- **WHEN** an administrator opens Analítica
- **THEN** sessions, global figures, time per module, content open-vs-complete, assessment
  performance, most-failed questions and inactive students are all present

#### Scenario: Colour never carries meaning alone
- **WHEN** a status is shown in green or amber
- **THEN** it is accompanied by a text label

### Requirement: The landing is edited as an ordered list of blocks
The site screen SHALL present the landing sections in the order they appear on the page, each
with its own visibility switch and its fields revealed on expand.

#### Scenario: Toggling a section
- **WHEN** an administrator switches a landing block off
- **THEN** that section stops rendering on the public page, as it does today
