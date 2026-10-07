## ADDED Requirements

### Requirement: Analytics count only students

Every analytics aggregate and every dashboard counter SHALL include only accounts whose
current role is student. Enrollments, progress, active time, quiz attempts, per-question
answers and logins of administrators and teachers SHALL NOT be counted. The list of recent
logins MAY show every account, labelled with its role.

#### Scenario: An administrator previews a course
- **WHEN** an administrator enrols in a course and completes contents to preview it
- **THEN** the course's enrolled count, funnel, completion and inactivity list are unchanged

#### Scenario: Staff logins
- **WHEN** administrators log in more often than students
- **THEN** sessions per day, active days per week and active-student counters reflect only
  students

### Requirement: Days follow the platform's local time

Per-day aggregates and "today" SHALL use the platform time zone (`America/Santiago` by
default), and the UI SHALL read `YYYY-MM-DD` dates as local dates.

#### Scenario: A login late in the evening
- **WHEN** a student logs in at 22:30 in Chile, which is the next day in UTC
- **THEN** the login counts on the Chilean calendar day, under that day's label

### Requirement: Analytics load quickly

A course analytics screen SHALL be served by one request issuing at most 15 database
queries, a number that SHALL NOT grow with the size of the course, cached on the server for up to 60 s after the caller's permission is checked, and
SHALL tell how long ago it was computed. Returning to a screen already seen in the same tab
SHALL show the previous data immediately while it refreshes.

#### Scenario: Query budget
- **WHEN** the course overview is requested
- **THEN** it issues no more than 15 queries, the same for 3 contents as for 120, enforced
  by a test

#### Scenario: A teacher and the cache
- **WHEN** a teacher requests a course that is not theirs while it is cached for an admin
- **THEN** the request is rejected before the cache is read

### Requirement: Charts answer a stated question

Analytics charts SHALL be rendered with a library bundled in the application (no external
chart service), each titled with the question it answers, with its values available as text.
The course screen SHALL show the content funnel with the largest drop marked, the
distribution of student progress, the score distribution per quiz, and student logins per
week.

#### Scenario: Where students drop out
- **WHEN** an admin opens a course's analytics
- **THEN** the funnel highlights the content after which the most students stop

### Requirement: Platform usage is shown per role

Separately from learning analytics, the dashboard SHALL show platform usage for every role
(students, teachers, administrators), one row per role and never combined: number of
accounts, accounts active today and in the last 7 days, and logins in the last 7 days. The
user list SHALL show each account's last login.

#### Scenario: The director checks staff usage
- **WHEN** an administrator opens the dashboard
- **THEN** they see students, teachers and administrators in separate rows, and student
  learning metrics still exclude staff

## MODIFIED Requirements

### Requirement: Interaction metrics come from login events
The system SHALL report active days per week, time between sessions, and contents completed
per login, derived from students' `LoginEvent` and progress timestamps, documenting the
approximation. Active days per week SHALL be averaged over students with at least one login
in the 28-day window, and SHALL state how many students that is.

#### Scenario: Interaction summary for a student
- **WHEN** a teacher opens a student's interaction detail
- **THEN** they see active days/week, average time between logins and progress per login

#### Scenario: Long-inactive students do not dilute the average
- **WHEN** 10 students logged in during the window and 30 have not logged in for months
- **THEN** active days per week is averaged over the 10 and says so

### Requirement: Performance metrics include most-failed question
The system SHALL report, per quiz, the students who attempted it, the students who passed it
in any attempt, the pass rate as passed students over attempting students, the average score
over all attempts, attempts-until-pass and per-question error rate; per-question metrics
SHALL disclose the date instrumentation started.

#### Scenario: Most-failed question after instrumentation
- **WHEN** attempts exist after the instrumentation date
- **THEN** the per-question error ranking is shown with its data start date

#### Scenario: Passing on the third attempt
- **WHEN** a student fails a quiz twice and passes it on the third attempt
- **THEN** that student counts as one student who passed, not as one pass in three attempts

### Requirement: Insufficient data is stated, never faked
The system SHALL mark any aggregate computed over fewer than 3 students as insufficient
data, deciding per section (progress, quizzes, contents, interaction) by counting students,
not attempts or rows. The UI SHALL display that state in the affected section only, instead
of its numbers, and keep showing the sections that have enough data.

#### Scenario: Tiny cohort shows no averages
- **WHEN** a course has 2 students with activity
- **THEN** its analytics cards show "datos insuficientes" instead of averages

#### Scenario: One thin section does not hide the rest
- **WHEN** a course has 12 enrolled students but only 2 attempted its quiz
- **THEN** the quiz section says "datos insuficientes" and the progress and content sections
  show their numbers
