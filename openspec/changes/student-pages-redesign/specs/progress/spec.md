## MODIFIED Requirements

### Requirement: The last visit carries enough context to resume
The last-accessed endpoint SHALL return, together with the content identifier, the course, module
and unit the content belongs to, including the unit's position within its module, so a client can
offer to resume without resolving the hierarchy itself.

#### Scenario: Context accompanies the last visit
- **WHEN** a student with progress requests their last visit
- **THEN** the response names the course, the module and the unit, with the unit's position

#### Scenario: No visit yet
- **WHEN** a student has no recorded visit
- **THEN** the response still reports no last visit, without error
