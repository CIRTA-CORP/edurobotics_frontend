## ADDED Requirements

### Requirement: The container image runs unprivileged and reports its health
The system SHALL build the backend image in stages so build-only tooling stays out of the
final image, SHALL run the application as a non-root user, and SHALL expose a health check.

#### Scenario: The application does not run as root
- **WHEN** the container starts
- **THEN** the process runs as an unprivileged user

#### Scenario: Build tooling is not shipped
- **WHEN** the final image is built
- **THEN** the compiler used to build dependencies is not present in it

### Requirement: Production dependencies carry no known vulnerabilities
The system SHALL keep the dependencies that reach the browser free of known advisories,
and SHALL treat the sanitizer and the rich-text editor as security-relevant.

#### Scenario: The audit is clean for what ships
- **WHEN** the production dependency tree is audited
- **THEN** no advisory is reported
