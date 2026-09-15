## ADDED Requirements

### Requirement: No third-party code is fetched at runtime
The system SHALL ship the code it executes, rather than fetching it from a third party when a
page loads. A dependency that arrives at runtime cannot be reviewed, pinned or contained by
the content policy, and it executes with full access to the session.

#### Scenario: The editor comes from the application
- **WHEN** a learner opens the simulator
- **THEN** no request is made to an external code CDN, and the editor still works

#### Scenario: The content policy needs no exception for it
- **WHEN** the content policy is applied
- **THEN** scripts, styles and fonts are restricted to the application's own origin

#### Scenario: No undeclared transfer of visitor data
- **WHEN** a learner uses the platform
- **THEN** their browser contacts only the providers named in the privacy policy
