## ADDED Requirements

### Requirement: A single authoritative completion definition
The system SHALL define scope completion in one place: a unit, module or course is
completed when all its contents are completed AND all its quizzes are passed.

#### Scenario: Roadmap, metrics and profile agree
- **WHEN** completion is computed for the same user and course by the roadmap, the admin
  metrics and the profile
- **THEN** all three report the same completed count

#### Scenario: Skipping a quiz is not "completed"
- **WHEN** a user finishes every content of a unit but has not passed its quiz
- **THEN** the unit is reported as in progress, not completed, everywhere
