## ADDED Requirements

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
