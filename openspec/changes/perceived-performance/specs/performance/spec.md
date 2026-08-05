## ADDED Requirements

### Requirement: Text responses are compressed
The system SHALL compress HTTP responses above ~1 KB (e.g. gzip), so lesson HTML and course
lists travel compressed from the backend.

#### Scenario: A lesson response is gzipped
- **WHEN** a client requests course/lesson content with `Accept-Encoding: gzip`
- **THEN** the response over ~1 KB comes back with `content-encoding: gzip`

### Requirement: Public read-only catalog responses are cacheable
The system SHALL send a short `Cache-Control` on public read-only catalog endpoints
(courses, roadmap, specializations, landing), and SHALL NOT cache authenticated, per-user,
or mutated responses.

#### Scenario: Public course list is cacheable
- **WHEN** a visitor requests the public course catalog
- **THEN** the response includes `Cache-Control: public, max-age=30`

#### Scenario: Per-user data is never cached
- **WHEN** a request returns per-user data (progress, admin) or follows a write
- **THEN** the response is not marked publicly cacheable

### Requirement: Navigating between pages does not flash a full-screen loader
The system SHALL keep the previous page (and the student shell/header) visible while the next
page's code and data load, instead of replacing the whole screen with a spinner.

#### Scenario: Warm-cache navigation is seamless
- **WHEN** a learner hovers a course card and then clicks it
- **THEN** the page's chunk and data are already prefetched and no full-screen spinner appears

#### Scenario: The student header persists across navigation
- **WHEN** a learner navigates between student pages
- **THEN** the header/nav stays mounted and only the content area changes

### Requirement: Performance is measured before and after on the real deploy
The system SHALL document a before/after comparison (Lighthouse mobile + API TTFB) on the
Vercel/Railway deploy, and SHALL treat sustained API TTFB > ~400 ms as a region/latency issue
to resolve before further frontend optimization.

#### Scenario: Change records the comparison
- **WHEN** the performance change is completed
- **THEN** the change includes the before/after measurements from the real deploy
