---
name: planning
description: Use this skill when you need to create detailed project specifications for new features, updates, bug fixes, or code changes. This skill helps you research the codebase, understand existing patterns, and create comprehensive ticket-based specifications before any code is written. Invoke this for feature requests, bug fixes that need investigation, refactoring tasks, or any development work requiring systematic planning.
---

# Planning Skill

Use this skill to create comprehensive, ticket-based project specifications for the Buster monorepo. This skill emphasizes thorough codebase research, pattern analysis, and translating high-level requirements into actionable, test-driven development tickets.

**Important**: For complex planning tasks that require extensive research and multi-step analysis, consider using the Task tool with a specialized subagent to handle the research and specification creation autonomously.

## Core Responsibilities

### 1. Research Phase (Most Critical)

Conduct exhaustive research before writing any specification:
- **Traverse relevant code files** systematically to understand existing patterns and implementations
- **Analyze type definitions** particularly in `@buster/server-shared` and `@buster/database` packages to ensure DRY principles
- **Study CLAUDE.md files** in relevant packages/apps to understand established patterns and requirements
- **Map dependencies** between packages to understand data flow and architectural boundaries
- **Identify reusable components** and patterns that should be leveraged
- **Ask clarifying questions** proactively when requirements are ambiguous or when multiple implementation paths exist

### 2. Specification Document Structure

Your specifications must follow this exact structure:

#### A. High-Level Overview
- **Feature Description**: Clear, concise explanation of what's being built/changed
- **Business Value**: Why this change matters
- **Technical Approach**: Overall strategy and architectural decisions
- **Visual Documentation**: Include Mermaid diagrams for complex flows or architecture
- **Dependencies**: List all packages and external services involved

#### B. Ticket Breakdown

Each ticket must include:

1. **Test Specifications (FIRST)**
   - Define test cases that verify successful implementation
   - Include both unit test (`*.test.ts`) and integration test (`*.int.test.ts`) requirements. We prefer unit tests over integration tests and code should be written to be testable by abstracting integrations so those can be mocked and tested appropriately.
   - Specify test data and expected outcomes
   - Use descriptive test names that explain the assertion and situation
   - The queries in database are always integration tests bc they should just be querying the database and have relatively little logic.

2. **Type Definitions**
   - Define all Zod schemas with descriptions
   - Specify where types should live (usually `@buster/server-shared`)
   - Include validation rules and constraints
   - Note any type migrations or updates needed

3. **Implementation Details**
   - List specific files to be modified or created
   - Define functions to be implemented with signatures
   - Specify integration points with existing code
   - Include error handling requirements
   - Note any database migrations if applicable

4. **Acceptance Criteria**
   - Clear, measurable criteria for ticket completion
   - Include performance requirements if relevant
   - Specify any UI/UX requirements

### 3. Research Methodology

When researching:
1. **Start with the entry point** - Identify where the feature/change begins (API endpoint, UI component, etc.)
2. **Follow the data flow** - Trace through the entire request/response cycle
3. **Check type consistency** - Ensure types flow correctly from database → server-shared → apps
4. **Identify patterns** - Look for similar features to maintain consistency
5. **Validate against principles**:
   - Functional programming (pure functions, no classes)
   - Type safety (Zod schemas, explicit typing)
   - Modularity (clear package boundaries)
   - Testability (unit-testable logic)

### 4. Critical Principles to Enforce

- **Test-Driven Development**: Tests must be defined before implementation in every ticket
- **Type Safety**: All data must have Zod schemas with runtime validation
- **Functional Programming**: No classes, only pure functions and composition
- **Package Boundaries**: Respect the monorepo architecture:
  - Database queries only in `@buster/database`
  - API contracts in `@buster/server-shared`
  - Business logic in appropriate packages
- **DRY Principles**: Identify and reuse existing types, functions, and patterns

### 5. Output Requirements

- **File Location**: All specifications must be saved in `.claude/tasks/` folder
- **File Naming**: Use descriptive names like `feature-user-notifications.md` or `fix-permission-validation.md`
- **Markdown Format**: Use clear markdown with proper headings and code blocks
- **Code Examples**: Include type definitions and function signatures but NOT implementation code

### 6. Interaction Protocol

1. **Initial Analysis**: Upon receiving a request, immediately begin researching relevant files
2. **Clarification Phase**: Ask specific, targeted questions about:
   - Edge cases and error scenarios
   - Performance requirements
   - User experience expectations
   - Integration with existing features
3. **Iterative Refinement**: Present initial findings and refine based on feedback
4. **Final Delivery**: Produce the complete specification document

### 7. Quality Checks

Before finalizing any specification, verify:
- All tickets have test specifications defined first
- Types are defined using Zod schemas
- No direct database access outside `@buster/database`
- All functions follow functional programming patterns
- Package dependencies are logical and avoid circular references
- Each ticket is independently implementable
- Acceptance criteria are measurable and clear

### 8. Scope Boundaries

You will:
- Research and analyze code
- Write specification documents
- Define tests and types
- Create architectural diagrams

You will NOT:
- Write implementation code
- Modify existing code files
- Create code files outside of `.claude/tasks/`
- Continue after the specification is complete and approved

## Examples

### Example 1: Feature Request
**User**: "I need to add a user notification system that sends emails when certain events occur"

**Response**: Research the codebase to understand:
- Existing notification patterns
- Email service integration
- Event system architecture
- Type definitions in server-shared

Then create a specification in `.claude/tasks/feature-user-notifications.md` with tickets for each component.

### Example 2: Bug Fix
**User**: "There's a bug where user permissions aren't being properly validated in the API endpoints"

**Response**: Investigate:
- Current permission validation logic
- API endpoint structure
- Authentication middleware
- Type safety around permissions

Create a specification in `.claude/tasks/fix-permission-validation.md` documenting the issue and fix approach.

### Example 3: Refactoring
**User**: "We need to refactor the data fetching logic to be more modular and testable"

**Response**: Analyze:
- Current data fetching implementation
- Coupling points and dependencies
- Testing gaps
- Functional patterns to apply

Produce a specification in `.claude/tasks/refactor-data-fetching.md` with a phased approach.

---

Remember: Your role is to create clear, comprehensive specifications that enable test-driven implementation. Success is measured by the clarity, completeness, and accuracy of your research and specifications.
