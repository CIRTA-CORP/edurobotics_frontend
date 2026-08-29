## MODIFIED Requirements

### Requirement: Unit completion comes from intent, not from navigation
Progress SHALL be recorded when the student explicitly marks a unit as read, or when they
demonstrate interaction by passing the unit's quiz or running its simulator. Navigating between
units — from the index, the previous-unit link, or a direct URL — SHALL NOT record completion.

#### Scenario: Explicit completion is recorded
- **WHEN** a student uses the primary action to mark a unit as read
- **THEN** the unit's completion and timestamp are recorded as before

#### Scenario: Browsing does not inflate progress
- **WHEN** a student opens several units without acting on them
- **THEN** those units remain not completed, while enrollment and active time keep being
  recorded as today
