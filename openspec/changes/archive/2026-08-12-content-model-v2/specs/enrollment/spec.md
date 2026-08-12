## ADDED Requirements

### Requirement: Enrolling in a course is idempotent
The system SHALL record an enrollment the first time a user accesses a course, and a
repeated enroll SHALL NOT create a duplicate.

#### Scenario: First access enrolls
- **WHEN** a user opens a course for the first time
- **THEN** an enrollment for (user, course) is created with an enrolled_at timestamp

#### Scenario: Re-enroll is a no-op
- **WHEN** enroll is called again for the same user and course
- **THEN** no duplicate row is created

### Requirement: Enrolled, active and completed are distinguishable
The system SHALL let admin metrics distinguish enrolled (has an enrollment), active (has
any progress) and completed (per the completion definition).

#### Scenario: Enrolled without activity
- **WHEN** a user is enrolled but has no progress
- **THEN** metrics count them as enrolled and not active
