---
title: Component Name
author: Your Name
date: YYYY-MM-DD
status: Draft
ticket: TICKET-ID
---

# Component Name

## Problem Statement

<!-- 
Clearly articulate the problem you're solving. Include:
- Current state and behavior
- Expected behavior
- Pain points
- Impact on users/system
- Why it needs to be solved now
- Any relevant metrics or data
-->

Current behavior:
- [Current behavior 1]
- [Current behavior 2]
- [Current behavior 3]

Expected behavior:
- [Expected behavior 1]
- [Expected behavior 2]
- [Expected behavior 3]

## Goals

<!-- List specific, measurable goals this change will achieve -->
1. 
2. 
3. 

## Non-Goals

<!-- List what is explicitly out of scope -->
1. 
2. 
3. 

## Implementation Plan

<!-- 
Break down the implementation into phases. Each phase should:
- Be independently deployable
- Include its own technical design
- Have clear success criteria
- Include comprehensive tests
-->

### Phase 1: [Name] ⏳ (In Progress)

#### Technical Design
<!-- Include technical details specific to this phase -->

```rust
// Include actual code structures/types
struct ComponentName {
    field1: Type1,    // Purpose of field1
    field2: Type2,    // Purpose of field2
}
```

#### Database Changes
<!-- If applicable -->
```sql
-- Include actual SQL
CREATE TABLE new_table (
    id UUID PRIMARY KEY,
    field1 TYPE1  -- Purpose
);
```

#### Implementation Steps
1. [ ] Step 1
   - Technical details
   - Edge cases to handle
   - Testing requirements

2. [ ] Step 2
   - Technical details
   - Edge cases to handle
   - Testing requirements

#### Tests

##### Unit Tests
```rust
#[cfg(test)]
mod tests {
    #[test]
    fn test_normal_case() {
        // Test implementation
    }

    #[test]
    fn test_edge_case_1() {
        // Test implementation
    }
}
```

##### Integration Tests
- Test Scenario: [Description]
  - Setup:
    - Required data
    - System state
  - Steps:
    1. Action 1
    2. Action 2
  - Assertions:
    - Expected state
    - Error cases
  - Edge Cases:
    - Case 1
    - Case 2

#### Success Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] All tests passing

### Phase 2: [Name] 🔜 (Not Started)

[Similar structure to Phase 1]

## Security Considerations

<!-- List security implications and how they're addressed -->
- Consideration 1
  - Risk:
  - Mitigation:
  - Testing:

## Dependencies

<!-- List external dependencies and affected components -->
1. Component 1
   - Interface changes:
   - Testing requirements:

## References

<!-- Include links to relevant documentation -->
- [Link to design docs]
- [Link to related PRDs] 