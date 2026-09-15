## ADDED Requirements

### Requirement: The public landing only promises what the product delivers
The system SHALL describe on the public landing only capabilities that a visitor can
actually use after signing up. When a capability is withdrawn or disabled, the landing
SHALL stop advertising it.

#### Scenario: A disabled capability is not advertised
- **WHEN** block-based programming is disabled in the simulator
- **THEN** no text, control or illustration on the landing offers programming with blocks

#### Scenario: The hero demo shows code that runs
- **WHEN** the hero shows a code sample
- **THEN** it uses the real robot API a learner would type, not an invented one

### Requirement: Landing claims are verifiable
The system SHALL back the landing's headline technical claims with something checkable in
the repository, so marketing copy cannot drift away from the product.

#### Scenario: The precision figure is backed by a check
- **WHEN** the landing states the simulator's accuracy against the real robot
- **THEN** that figure is the one the kinematics verification script asserts

### Requirement: Landing defaults never overwrite edited content
The system SHALL treat the landing texts in code as defaults only. Changing a default
SHALL NOT modify content an administrator has already saved.

#### Scenario: Edited section keeps its text
- **WHEN** an administrator has saved a custom hero subtitle and the code default changes
- **THEN** the saved text is still what visitors see, and the new default applies only to
  sections never edited
