## ADDED Requirements

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
