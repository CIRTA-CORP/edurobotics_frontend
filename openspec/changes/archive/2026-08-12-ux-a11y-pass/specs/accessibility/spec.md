## ADDED Requirements

### Requirement: User-facing text is in Spanish everywhere, including the public landing
The system SHALL render all user-facing text in Spanish, with the course level shown from a
single shared mapping (`beginner→Principiante`, etc.), so no view (including the public
landing) can display the raw English value.

#### Scenario: Course level on the landing
- **WHEN** a visitor views the course catalog on the public landing
- **THEN** each course shows "Principiante" (not "Beginner")

### Requirement: The quiz is operable by keyboard and exposed as a radio group
The system SHALL present each quiz question's options as an accessible radio group: a
container with `role="radiogroup"` labelled by the question, and options with `role="radio"`
and `aria-checked`, navigable by arrow keys and selectable with Space/Enter.

#### Scenario: Answer a question with the keyboard only
- **WHEN** a learner tabs to a question's options and presses the arrow keys
- **THEN** focus moves between options and the focused option becomes selected
- **AND WHEN** they press Space or Enter
- **THEN** that option is recorded as their answer

#### Scenario: Screen reader announces the choice
- **WHEN** a screen reader focuses an option
- **THEN** it announces the option as a radio and whether it is checked

### Requirement: Images have text alternatives and interactive elements show focus
The system SHALL provide a text alternative for informative images (and empty `alt` for
decorative ones), label inputs, and show a visible focus indicator on links, buttons and
options throughout the student flow.

#### Scenario: Keyboard focus is visible
- **WHEN** a user tabs through the student flow (login → dashboard → course → quiz)
- **THEN** the currently focused element shows a visible focus ring

### Requirement: Dimmed/locked states meet AA contrast
The system SHALL keep text and badges of dimmed/locked course cards at WCAG AA contrast
(≥ 4.5:1 for normal text), conveying "unavailable" via thumbnail opacity and a lock icon
rather than illegible text.

#### Scenario: Locked course card is legible
- **WHEN** a course is locked and shown dimmed in the roadmap or dashboard
- **THEN** its title and status text still meet AA contrast
