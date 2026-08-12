## ADDED Requirements

### Requirement: Per-question quiz answers are recorded
The system SHALL persist, for every quiz attempt, which answer the student chose for each
question and whether it was correct at submission time, atomically with the attempt.

#### Scenario: Submit stores answers atomically
- **WHEN** a student submits a quiz
- **THEN** the attempt and one answer row per question are stored in a single transaction

#### Scenario: Failed submit leaves no partial data
- **WHEN** a quiz submission fails validation or errors out
- **THEN** no attempt and no answer rows are persisted

### Requirement: Progress metrics are derived from existing signals
The system SHALL report, per course/module/unit: total/average/min/max active time (from
`active_seconds`), completion rate (completed over enrolled), and a per-content funnel
identifying the ordered content with the largest drop between consecutive steps.

#### Scenario: Funnel identifies the drop-off point
- **WHEN** an admin or teacher requests a course funnel
- **THEN** they receive completion percentage per ordered content and the position with the
  largest drop

### Requirement: Interaction metrics come from login events
The system SHALL report active days per week, time between sessions, and contents completed
per login, derived from `LoginEvent` and progress timestamps, documenting the approximation.

#### Scenario: Interaction summary for a student
- **WHEN** a teacher opens a student's interaction detail
- **THEN** they see active days/week, average time between logins and progress per login

### Requirement: Performance metrics include most-failed question
The system SHALL report average quiz scores, attempts-until-pass, and per-question error
rate; per-question metrics SHALL disclose the date instrumentation started.

#### Scenario: Most-failed question after instrumentation
- **WHEN** attempts exist after the instrumentation date
- **THEN** the per-question error ranking is shown with its data start date

### Requirement: A single inactivity definition is shared
The system SHALL define "no recent activity" as an enrolled, non-completed student with no
heartbeat, progress write or login within 14 days, in one named constant consumed by both
analytics and the teacher view.

#### Scenario: Recently active student is not flagged
- **WHEN** a student sent a heartbeat 3 days ago
- **THEN** they are not flagged as inactive anywhere in the platform

### Requirement: Insufficient data is stated, never faked
The system SHALL mark any aggregate computed over fewer than 3 students as insufficient
data, and the UI SHALL display that state instead of the number.

#### Scenario: Tiny cohort shows no averages
- **WHEN** a course has 2 students with activity
- **THEN** its analytics cards show "datos insuficientes" instead of averages
