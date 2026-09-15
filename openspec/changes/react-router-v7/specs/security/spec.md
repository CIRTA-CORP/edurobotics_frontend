## ADDED Requirements

### Requirement: Application links cannot be turned into off-site redirects
The system SHALL keep its routing free of known open-redirect advisories, so a crafted path
cannot send a learner to another site from a link that looks like the platform's own.

#### Scenario: The routing dependency carries no open-redirect advisory
- **WHEN** the production dependencies are audited
- **THEN** no open-redirect advisory is reported for the router
