## ADDED Requirements

### Requirement: Enrolled students can ask course questions
The system SHALL let a student enrolled in a course post a plain-text question visible to
that course's students and staff, subject to rate limiting.

#### Scenario: Enrolled student asks
- **WHEN** an enrolled student submits a question
- **THEN** it appears in the course's Consultas tab for everyone in the course

#### Scenario: Non-enrolled student cannot ask
- **WHEN** a student not enrolled in the course tries to post
- **THEN** the request is rejected

### Requirement: Staff replies are highlighted
The system SHALL mark replies authored by a teacher or admin as team answers, visually
distinct from student replies.

#### Scenario: Teacher reply is badged
- **WHEN** a teacher replies to a question
- **THEN** the reply shows the "respuesta del equipo" badge

### Requirement: Minimal moderation via hiding
The system SHALL let teachers and admins hide a question or reply; hidden items SHALL NOT
be visible to students but SHALL remain visible (marked) to staff.

#### Scenario: Hidden question disappears for students
- **WHEN** a teacher hides a question
- **THEN** students no longer see it and staff see it marked as hidden

### Requirement: Question content is plain text, always escaped
The system SHALL store questions and replies as plain text and render them escaped; no
user-provided HTML is interpreted.

#### Scenario: HTML in a question is inert
- **WHEN** a student posts a question containing `<script>` or HTML tags
- **THEN** the text renders literally and no markup is interpreted

### Requirement: Teachers see unanswered questions count
The system SHALL show teachers a count of questions without any staff reply.

#### Scenario: Unanswered counter
- **WHEN** a teacher opens their view and 3 questions lack staff replies
- **THEN** the counter shows 3
