# Purpose

La malla curricular: cursos por profundidad (prerequisitos) con estado y progreso, color y
avance por especialización.

## Requirements

### Requirement: Courses are laid out by prerequisite depth with their state
The system SHALL lay out courses in rows by topological depth and show each course's state
(completed / in progress / available / locked).

### Requirement: The roadmap shows each specialization's progress
The system SHALL colour-code courses by specialization and show, per specialization, how
far the user has advanced (completed courses over its total).

#### Scenario: Progress on the chips and header
- **WHEN** the roadmap loads for a logged-in user
- **THEN** each specialization chip shows its completion percentage
- **AND WHEN** a specialization is selected
- **THEN** a header shows "X de Y cursos · Z%"

### Requirement: Nodes are consistent and indicate multi-specialization
The system SHALL render a branded fallback when a course has no image, and indicate with
"+N" when a course belongs to more than one specialization.

### Requirement: Hovering a course highlights its prerequisites
The system SHALL highlight the prerequisite arrows connected to a course on hover.
