# Purpose

Autenticación y autorización: registro, login con JWT propio, recuperación de
contraseña, perfil y roles.

## Requirements

### Requirement: Users register and log in
The system SHALL let a person register with username, email, name and a strong password,
and log in to receive a JWT.

#### Scenario: Register
- **WHEN** a new user posts valid registration data
- **THEN** the account is created and a JWT is returned (201)

#### Scenario: Duplicate registration
- **WHEN** the username or email is already taken
- **THEN** registration is rejected (400)

#### Scenario: Login
- **WHEN** valid credentials are posted
- **THEN** a JWT is returned (200)
- **AND WHEN** the password is wrong
- **THEN** it is rejected (401)

### Requirement: Passwords are stored securely and can be reset
The system SHALL hash passwords with bcrypt and support a self-service reset via an
emailed single-use, time-limited token (only the token hash is stored).

#### Scenario: Reset with a valid token
- **WHEN** a user submits a valid, unexpired reset token with a new strong password
- **THEN** the password is changed

#### Scenario: Invalid or expired token
- **WHEN** the reset token is invalid or expired
- **THEN** it is rejected (400)

#### Scenario: Anti-enumeration on forgot-password
- **WHEN** a forgot-password request is made for any email
- **THEN** the response is generic and does not reveal whether the email exists

### Requirement: Endpoints enforce authentication and authorization
The system SHALL protect user data and admin actions.

#### Scenario: IDOR guard
- **WHEN** a user requests another user's data
- **THEN** it is rejected (403) unless they are an admin

#### Scenario: Admin-only
- **WHEN** a non-admin calls an admin endpoint
- **THEN** it is rejected (403)

### Requirement: Password fields can be revealed
The system SHALL let a person reveal the password they are typing, in every form with a
password field (login, registration, password reset and profile settings), via a control
inside the field that toggles between hidden and visible. Each field SHALL start hidden and
SHALL toggle independently of any other password field in the same form.

#### Scenario: Reveal and hide while logging in
- **WHEN** a person types their password on the login form and activates the reveal control
- **THEN** the password is shown as readable text and the control offers to hide it again
- **AND WHEN** they activate it again
- **THEN** the password goes back to being masked

#### Scenario: Confirmation field toggles independently
- **WHEN** a person on the registration form reveals "Contraseña"
- **THEN** "Confirmar contraseña" stays masked

#### Scenario: The control never submits the form
- **WHEN** a person activates the reveal control inside a form
- **THEN** the form is not submitted and no request is made

#### Scenario: Password managers still work
- **WHEN** a form with a revealable password field is rendered
- **THEN** each field keeps its autocomplete role (`current-password` when signing in,
  `new-password` when creating or resetting one)
