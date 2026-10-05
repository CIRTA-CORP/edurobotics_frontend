# Purpose

Perceived-performance invariants: compression and HTTP caching for public
catalog responses, seamless page navigation, and honest before/after
measurement on the real deploy.

## Requirements

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

### Requirement: A feature disabled by a flag is not downloaded
The system SHALL load flag-gated features on demand, so a feature turned off does not cost
the learner any bandwidth. Turning the flag on SHALL still load and run the feature.

#### Scenario: Disabled feature ships nothing
- **WHEN** the block editor is disabled and a learner opens the simulator
- **THEN** the block library's chunk is not fetched

#### Scenario: Enabling the flag restores the feature
- **WHEN** the block editor is enabled
- **THEN** its chunk is fetched on demand and the panel works

### Requirement: The simulator downloads only the viewer it renders
The system SHALL load each 3D viewer on demand, so opening the simulator downloads only the
viewer actually being rendered. The legacy viewer, reachable only via an explicit
`?viewer=babylon`, SHALL NOT be part of the simulator route's static import graph.

#### Scenario: Default visit does not download the legacy engine
- **WHEN** a learner opens `/simulator` without a viewer parameter
- **THEN** the URDF viewer's chunk is fetched and the legacy engine's chunk is not

#### Scenario: The legacy viewer still works when asked for
- **WHEN** a learner opens `/simulator?viewer=babylon`
- **THEN** the legacy engine's chunk is fetched on demand and renders

#### Scenario: The comparison page may load both
- **WHEN** the side-by-side comparison page is opened
- **THEN** both viewers load, since it renders them together by definition

### Requirement: Retired features ship nothing
The system SHALL NOT ship code for features it no longer offers. Retiring a capability
SHALL remove its dependencies, not just hide its entry point.

#### Scenario: Neither retired library is downloaded
- **WHEN** a learner opens the simulator
- **THEN** no chunk of the block-programming library or the legacy 3D engine is fetched

#### Scenario: They are not in the build either
- **WHEN** the production bundle is built
- **THEN** neither library appears in any chunk

### Requirement: The editor is part of the measured bundle
The system SHALL include the code editor in its own build, loaded on demand with the
simulator route, so its weight is visible in the build output instead of hidden in a runtime
request to another server.

#### Scenario: The editor loads with the simulator, not before
- **WHEN** a learner visits a page other than the simulator
- **THEN** the editor's chunk is not fetched

#### Scenario: Its size is known
- **WHEN** the production bundle is built
- **THEN** the editor appears as a chunk with a measurable size
