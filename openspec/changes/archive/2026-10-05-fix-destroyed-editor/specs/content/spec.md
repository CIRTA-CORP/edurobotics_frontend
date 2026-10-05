## ADDED Requirements

### Requirement: The content editor tolerates being remounted
The system SHALL keep the content editor usable when its underlying editor
instance is destroyed and replaced, which happens during normal mounting. No
code path that runs without a direct user action SHALL use a destroyed editor
instance, and saving SHALL never discard the content the author sees.

#### Scenario: Opening a course while data is still loading
- **WHEN** an author opens a course in the workshop and the content arrives after the editor has mounted
- **THEN** the editor shows the content and the page does not fail

#### Scenario: Saving while the editor instance is being replaced
- **WHEN** the author saves at the moment the editor instance is being replaced
- **THEN** the last content the author saw is saved, rather than nothing
