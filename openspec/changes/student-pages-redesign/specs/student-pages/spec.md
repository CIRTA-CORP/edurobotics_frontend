## ADDED Requirements

### Requirement: The course preview shows the same programme the student will study
The course preview SHALL present the course programme using the same module index as study mode,
including each unit's material type and duration, so what is promised before entering matches
what is found inside.

#### Scenario: Programme matches study mode
- **WHEN** a student opens a course preview
- **THEN** the modules and units listed are the same ones, in the same order, that study mode
  will show

#### Scenario: Modules can be folded
- **WHEN** a student collapses a module in the preview
- **THEN** its units are hidden without leaving the page

### Requirement: The preview states the course's position in the roadmap
The course preview SHALL show where the course sits in the roadmap, marking the current course
and stating its prerequisites and the courses it unlocks.

#### Scenario: Current course is marked
- **WHEN** the roadmap section is shown
- **THEN** the course being previewed is marked as the student's current position

### Requirement: The dashboard offers to resume the last unit visited
The dashboard SHALL offer a card that resumes the student's last visited unit, naming the course,
the module and the unit. When the student has no recorded visit, the card SHALL NOT be shown.

#### Scenario: Student with history
- **WHEN** a student who visited a unit opens the dashboard
- **THEN** a card names that course, module and unit and links back to it

#### Scenario: Student with no history
- **WHEN** a student who never opened a unit opens the dashboard
- **THEN** no resume card is shown, and no placeholder course is invented

### Requirement: Specialization cards keep their cover image
Specializations SHALL keep being presented with their cover image (with the existing dark
fallback when none is set), adopting only the shared radius, border, monospace counters and
progress bar.

#### Scenario: Specialization with a photo
- **WHEN** a specialization has a cover image
- **THEN** the card shows the photo alongside its progress

#### Scenario: Specialization without a photo
- **WHEN** a specialization has no cover image
- **THEN** the card shows the existing dark patterned fallback rather than an empty frame

### Requirement: Course cards read the same wherever they appear
Course cards SHALL keep their cover photo with its legibility gradient and SHALL use the same
markup and styling on the dashboard and on the profile.

#### Scenario: Same card on two pages
- **WHEN** the same course appears on the dashboard and on the profile
- **THEN** both cards look identical

### Requirement: The profile shows account data and its two real forms
The profile SHALL present a summary tab with enrolment counts and course cards grouped by state,
and a settings tab with the personal-data and password-change forms, including their error states
in Spanish.

#### Scenario: Password mismatch is stated
- **WHEN** the two new password fields do not match
- **THEN** the form shows the mismatch error in Spanish without submitting
