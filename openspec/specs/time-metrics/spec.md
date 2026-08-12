# Purpose

Real active time-on-task for courses, modules and units: measured via client
heartbeats, never inferred from calendar spans, and reported honestly.

## Requirements

### Requirement: Active time is measured, not inferred from calendar span
The system SHALL accumulate real active time per (user, content) via client heartbeats, and
SHALL NOT infer per-unit time from the calendar span between first start and last completion.

#### Scenario: Heartbeat accrues bounded active time
- **WHEN** a learner has a unit open and its tab is visible
- **THEN** the client sends a heartbeat about every 15 seconds
- **AND THEN** the server adds at most ~20 seconds of active time per heartbeat to that content

#### Scenario: Backgrounded tab does not accrue time
- **WHEN** the learner switches to another tab or window (page hidden / blurred)
- **THEN** heartbeats pause and no active time is accrued until the tab is visible again

#### Scenario: Rapid heartbeats cannot inflate time
- **WHEN** heartbeats for the same content arrive faster than ~10 seconds apart
- **THEN** the server discards the excess so time cannot be inflated

### Requirement: Scope time is the sum of active time, aggregated by median across learners
The system SHALL compute a unit/module/course's time as the sum of its contents' active
seconds per learner, and report the median across learners (with min–max range and
started/completed counts).

#### Scenario: A single-content unit shows real time
- **WHEN** learners spend real active time on a single-content unit
- **THEN** the unit shows that active time, not ~0 / "1 s"

### Requirement: Missing time is shown as insufficient data, never as a fake number
The system SHALL display "datos insuficientes" (or equivalent) when a scope has no accrued
active time, and SHALL NOT display "1 s" or any invented value.

#### Scenario: Historical course without heartbeat data
- **WHEN** a course had activity before active-time tracking existed
- **THEN** its per-unit time reads "datos insuficientes" until new activity accrues
