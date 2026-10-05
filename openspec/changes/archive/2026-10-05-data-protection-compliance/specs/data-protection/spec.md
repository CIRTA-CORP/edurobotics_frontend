## ADDED Requirements

### Requirement: Registration records consent
The system SHALL require explicit acceptance of the terms and privacy policy at registration
and SHALL record each consent (type, version, timestamp) atomically with the account.

#### Scenario: Register with consent
- **WHEN** a user registers accepting terms and privacy
- **THEN** the account is created with one consent row per type, versioned and dated

#### Scenario: Register without consent is rejected
- **WHEN** a user registers without accepting terms or privacy
- **THEN** the registration is rejected and no account is created

### Requirement: Users can export their personal data
The system SHALL let an authenticated user download their personal data (profile, consents,
enrollments, progress, quiz attempts and answers, feedback, login activity) as a JSON file,
never including the password hash.

#### Scenario: Export own data
- **WHEN** a user requests their data export
- **THEN** they receive a JSON containing their records and no credential material

### Requirement: Users can delete their account and data
The system SHALL let an authenticated user delete their account, removing their personal data
and all associated records in a single transaction.

#### Scenario: Account deletion removes everything
- **WHEN** a user deletes their account
- **THEN** the user and all their associated records (progress, enrollments, attempts,
  answers, login events, feedback, consents) are removed

### Requirement: Data rights require authentication
The system SHALL require a valid session to export or delete personal data.

#### Scenario: Unauthenticated request
- **WHEN** a request to export or delete is made without a valid token
- **THEN** the response is 401

### Requirement: Privacy policy describes data subjects' rights
The system SHALL publish a privacy policy describing the data subjects' rights (access,
rectification, deletion, portability, objection), retention, treatment of minors' data and
international transfers.

#### Scenario: Policy covers the rights
- **WHEN** a visitor opens the privacy policy
- **THEN** it explains how to exercise each right and where data is stored
