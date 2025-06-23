---
title: Project Name
author: Your Name
date: YYYY-MM-DD
status: Draft
ticket: TICKET-ID
---

# Project Name

## Problem Statement

<!-- 
Clearly articulate the high-level problem this project solves. Include:
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

<!-- List specific, measurable goals this project will achieve -->
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
Break down the implementation into sub-PRDs and phases. Each phase should:
- Have clear dependencies and concurrent development opportunities
- Include its own technical design
- Have comprehensive tests
- Have clear success criteria
-->

### Phase 1: Foundation ⏳ (In Progress)

#### Technical Design

```mermaid
graph TD
    A[Component A] --> B[Component B]
    B --> C[Component C]
    // Add your architecture diagram
```

#### Sub-PRDs
1. [Foundation Component](link_to_foundation_prd.md)
   - Purpose: [Describe purpose]
   - Dependencies: None
   - Required for: All other PRDs
   - Status: 🆕 Not Started
   - Testing Requirements:
     - Unit Tests:
       - Test case 1
       - Test case 2
     - Integration Tests:
       - Scenario 1
       - Scenario 2

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
- [ ] Foundation component implemented
- [ ] All tests passing
- [ ] Documentation complete

### Phase 2: Parallel Component Development 🔜 (Not Started)

#### Sub-PRDs
1. [Component A](link_to_component_a_prd.md)
   - Dependencies: Foundation Component
   - Can be developed concurrently with: Components B and C
   - Testing Requirements:
     - Unit Tests:
       - Test case 1
       - Test case 2
     - Integration Tests:
       - Scenario 1
       - Scenario 2

2. [Component B](link_to_component_b_prd.md)
   - Dependencies: Foundation Component
   - Can be developed concurrently with: Components A and C
   - Testing Requirements:
     - Unit Tests:
       - Test case 1
       - Test case 2
     - Integration Tests:
       - Scenario 1
       - Scenario 2

[Similar structure for other components]

#### Concurrent Development Strategy

1. **Clear Component Boundaries**
   - Interface definitions
   - Data isolation
   - Test data separation

2. **Integration Testing**
   - Component interaction tests
   - System-wide integration tests
   - Performance tests

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
