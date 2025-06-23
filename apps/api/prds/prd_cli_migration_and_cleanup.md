---
title: CLI Migration and Cleanup
author: Claude Assistant
date: 2024-07-26
status: Draft
parent_prd: semantic_layer_refactor_overview.md
ticket: N/A
---

# CLI Migration and Cleanup

## Parent Project

This is a sub-PRD of the [Semantic Layer and Deployment Refactor](semantic_layer_refactor_overview.md) project. Please refer to the parent PRD for the overall project context, goals, and implementation plan.

## Problem Statement

During the semantic layer refactor, we've implemented new functionality in separate modules to allow for parallel development and testing without disrupting the existing system. Now that all the core components are implemented and tested, we need to:

1. Integrate the new implementation into the main CLI application
2. Remove temporary development artifacts
3. Ensure the entire system works correctly with the unified semantic layer model
4. Update documentation to reflect the new capabilities

Current state:
- The new deployment logic exists in `cli/cli/src/commands/deploy_new/`
- The old deployment logic remains in `cli/cli/src/commands/deploy.rs`
- Test harnesses and temporary code exist for development purposes
- Main CLI still uses the old deployment logic

Expected state:
- A single, unified deployment logic in `cli/cli/src/commands/deploy.rs` using the semantic layer model
- No temporary or duplicate code
- Comprehensive tests covering the refactored implementation
- Updated documentation for developers and users

## Goals

1. Replace the current deployment logic with the new implementation
2. Maintain backward compatibility with existing deployed models
3. Ensure a seamless transition for users
4. Remove all temporary code and test harnesses
5. Update documentation to reflect the new capabilities

## Non-Goals

1. Adding new features beyond what was implemented in previous PRDs
2. Changing the CLI command interface visible to end users
3. Modifying the API structure beyond what was needed for the semantic layer refactor

## Implementation Plan

### Phase 1: Code Migration

#### Technical Design

The migration will proceed as follows:

1. **Prepare the integration**
   - Create a backup of the existing `deploy.rs` file
   - Extract the essential logic from `commands/deploy_new/mod.rs`

2. **Replace the old implementation**
   - Update `cli/cli/src/commands/deploy.rs` with the new implementation
   - Ensure the public interfaces remain backward compatible
   - Update imports and references throughout the CLI

3. **Testing**
   - Run all existing tests to ensure they still pass
   - Run the new tests against the integrated implementation
   - Perform manual end-to-end testing

4. **Cleanup**
   - Remove the `deploy_new` directory and all temporary code
   - Remove any unused imports or dependencies

#### Specific Changes

```rust
// In cli/cli/src/commands/mod.rs, update the imports
pub mod auth;
pub mod deploy;  // This will now use the new implementation
pub mod init;
pub mod update;
pub mod version;

pub use auth::auth_with_args;
pub use deploy::deploy;  // Same interface, new implementation
pub use init::init;
pub use update::UpdateCommand;
```

#### Implementation Steps

1. [ ] Create a backup of the existing `deploy.rs` file
2. [ ] Update `deploy.rs` with the core functionality from `deploy_new/mod.rs`:
   - Parse model files using the semantic layer models
   - Resolve configuration inheritance (Model > Project > Global)
   - Convert semantic models to API format
   - Send API requests with proper validation
3. [ ] Ensure backward compatibility by maintaining the same public interfaces
4. [ ] Update any imports or references in other CLI modules
5. [ ] Run all tests to verify functionality
6. [ ] Remove the `deploy_new` directory and all temporary code
7. [ ] Remove any unused imports or dependencies

### Phase 2: Documentation Updates

#### User Documentation

1. [ ] Update CLI documentation to explain the new project-based configuration capabilities
2. [ ] Document the configuration inheritance model (Model > Project > Global)
3. [ ] Provide examples of multi-project setups with the new `buster.yml` format

#### Developer Documentation

1. [ ] Update technical documentation about the semantic layer model structure
2. [ ] Document the deployment process and API request format
3. [ ] Provide migration guidance for any custom tools that might interact with the CLI

## Tests

1. **Unit Tests**
   - Verify that all existing unit tests pass with the new implementation
   - Ensure the new tests from `deploy_new/tests.rs` pass against the integrated code

2. **Integration Tests**
   - Run end-to-end tests with various configuration scenarios:
     - Single model with global config
     - Project-based configuration
     - Model-level overrides
   - Test with both new and pre-existing model files

3. **Backward Compatibility Tests**
   - Verify that existing model files deploy correctly
   - Ensure the CLI can still read and use existing `buster.yml` files

## Dependencies on Other Components

- All previous PRDs in the semantic layer refactor must be completed:
  - Semantic Model Definition
  - CLI Configuration & Discovery
  - CLI Deployment Logic
  - API Request Handling
  - API Type Inference
  - API Model Persistence

## Success Criteria

- [ ] All CLI unit and integration tests pass
- [ ] The CLI can successfully deploy models using the new semantic layer structures
- [ ] All temporary development code has been removed
- [ ] Documentation has been updated to reflect the new capabilities
- [ ] No regressions in functionality from the previous implementation

## References

- `cli/cli/src/commands/deploy.rs` (current implementation)
- `cli/cli/src/commands/deploy_new/` (new implementation to be integrated)
- `api/libs/semantic_layer/src/models.rs` (semantic layer model definition)