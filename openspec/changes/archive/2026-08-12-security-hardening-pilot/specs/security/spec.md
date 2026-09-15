## ADDED Requirements

### Requirement: Rate limiting cannot be bypassed by spoofing the client IP
The system SHALL derive the client IP for rate limiting from the trusted proxy's value,
so a client cannot evade limits by forging `X-Forwarded-For`.

#### Scenario: Forged X-Forwarded-For does not evade the limit
- **WHEN** a client sends many login attempts, each with a different `X-Forwarded-For`
- **THEN** the limiter still counts them against the same client
- **AND THEN** it returns 429 once the threshold is crossed

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
The system SHALL invalidate a user's existing tokens when their role changes, so a demoted
admin cannot keep admin access.

#### Scenario: Demoted admin is rejected
- **WHEN** an admin is demoted and then uses a token issued before the change
- **THEN** the next admin-only request returns 401 or 403
