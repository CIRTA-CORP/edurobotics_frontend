# Purpose

Endurecimiento de seguridad: rate limiting no evadible, autenticación del WebSocket fuera
de la URL, e invalidación de sesiones al cambiar de rol.

## Requirements

### Requirement: Rate limiting cannot be bypassed by spoofing the client IP
The system SHALL derive the client IP for rate limiting from the trusted proxy's value, so
a client cannot evade limits by forging `X-Forwarded-For`.

#### Scenario: Forged X-Forwarded-For does not evade the limit
- **WHEN** a client sends many login attempts, each with a different forged `X-Forwarded-For`
- **THEN** the limiter still counts them against the same client and returns 429 past the threshold

### Requirement: The simulator WebSocket authenticates off-URL
The system SHALL authenticate the simulator WebSocket via its first message after accept,
never via the query string.

#### Scenario: Missing or invalid token is closed
- **WHEN** a WebSocket connects without a valid token as its first message within 5s
- **THEN** the server closes the connection with code 1008

#### Scenario: Valid token proceeds
- **WHEN** a WebSocket sends a valid token as its first message
- **THEN** the connection is accepted and the session proceeds

### Requirement: Changing a user's role invalidates their live tokens
The system SHALL invalidate a user's existing tokens when their role changes (via
`token_version`), so a demoted admin cannot keep admin access.

#### Scenario: Demoted admin is rejected
- **WHEN** an admin is demoted and then uses a token issued before the change
- **THEN** the next admin-only request returns 401 or 403

### Requirement: Error responses never expose internals
The system SHALL keep database and runtime failure detail out of HTTP responses, returning a
generic message in Spanish while the real cause goes to the structured log.

#### Scenario: A database failure stays opaque
- **WHEN** an endpoint fails because of a database error
- **THEN** the response body contains no SQL, driver name, table or column names
- **AND THEN** the failure is recorded in the log with its real cause

#### Scenario: Validation errors are still useful
- **WHEN** a request is rejected for invalid input
- **THEN** the response still says which field is wrong, since that is not internal detail

### Requirement: Text input has an upper bound
The system SHALL bound the length of every text field it accepts, so an oversized payload is
rejected at validation instead of reaching the database.

#### Scenario: An oversized title is rejected
- **WHEN** a request sends a title longer than its limit
- **THEN** it is rejected with 422 and nothing is written

#### Scenario: Existing lesson content still fits
- **WHEN** the limit for rich lesson content is chosen
- **THEN** it is above the largest value already stored, so no existing content becomes
  unsaveable

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

### Requirement: Application links cannot be turned into off-site redirects
The system SHALL keep its routing free of known open-redirect advisories, so a crafted path
cannot send a learner to another site from a link that looks like the platform's own.

#### Scenario: The routing dependency carries no open-redirect advisory
- **WHEN** the production dependencies are audited
- **THEN** no open-redirect advisory is reported for the router

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
