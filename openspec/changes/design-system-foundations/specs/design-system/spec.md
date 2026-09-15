## ADDED Requirements

### Requirement: One interactive colour across the application
The application SHALL use a single accent colour for interactive elements, green only for real
progress and amber only for locked states. The retired colours (`#2563eb`, `#0f172a`, and the
rose/orange, blue and slate fill gradients) SHALL NOT appear in application code.

#### Scenario: No competing primaries remain
- **WHEN** the codebase is searched for the retired colour values
- **THEN** no match remains outside the specialization palette

#### Scenario: Specialization palette is preserved
- **WHEN** specializations are displayed
- **THEN** their eight-colour palette still distinguishes one specialization from another

### Requirement: One primary action per view
Each view SHALL present a single primary action styled in the brand near-black, inverted to
white over the dark brand band, with a 44 px height that also satisfies the minimum touch target.

#### Scenario: Primary button on a light surface
- **WHEN** a primary action is shown on a light background
- **THEN** it is the brand near-black at 44 px height

#### Scenario: Primary button over the dark band
- **WHEN** a primary action sits on the dark brand band
- **THEN** it is inverted to white

### Requirement: Cards share one radius and border
Card surfaces SHALL use a single corner radius and the shared card border, instead of mixing
several radii across features.

#### Scenario: Cards across pages match
- **WHEN** cards are shown on the dashboard, the profile and a course page
- **THEN** they share the same radius and border

### Requirement: Countable values are set in monospace
Progress figures, durations, versions and counters SHALL be rendered in the monospace face so
numbers do not read as prose.

#### Scenario: Progress counter
- **WHEN** a unit counter such as "3/9" is displayed
- **THEN** it is rendered in monospace with tabular figures

### Requirement: The focus ring keeps AA contrast after the palette change
The keyboard focus indicator SHALL remain visible and meet AA contrast on both the light
background and the dark brand band.

#### Scenario: Focus ring over the dark band
- **WHEN** a control on the dark brand band receives keyboard focus
- **THEN** the focus ring is visible and meets AA contrast
