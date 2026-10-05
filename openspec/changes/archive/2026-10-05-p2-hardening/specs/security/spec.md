## ADDED Requirements

### Requirement: Responses carry hardening headers
The system SHALL send security headers on the frontend responses, so the browser adds a
second layer over the sanitization already applied to lesson HTML.

#### Scenario: Baseline headers are present
- **WHEN** a visitor loads any page
- **THEN** the response carries `X-Content-Type-Options: nosniff`, a `Referrer-Policy`, a
  restrictive `Permissions-Policy`, and a `frame-ancestors` directive

#### Scenario: A content policy does not break the simulator
- **WHEN** a content security policy is applied
- **THEN** the simulator still runs, including the editor's web workers and the 3D viewer
- **AND THEN** a lesson written in the rich-text editor still renders

### Requirement: The API only answers its own front ends
The system SHALL restrict cross-origin requests to a configured list of origins instead of
allowing any, and SHALL NOT publish its interactive documentation in production.

#### Scenario: An unknown origin is refused
- **WHEN** a request arrives from an origin that is not configured
- **THEN** it is not granted cross-origin access

#### Scenario: Docs are not public in production
- **WHEN** the API runs in production
- **THEN** the interactive documentation and the schema are not served

### Requirement: Uploads are bounded while being read
The system SHALL stop reading an upload as soon as it exceeds the size limit, rather than
buffering the whole file and checking afterwards.

#### Scenario: An oversized upload is cut short
- **WHEN** a file larger than the limit is uploaded
- **THEN** it is rejected without the whole file being held in memory
