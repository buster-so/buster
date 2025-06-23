# [Library Name] - Agent Guidance

> **Last Updated**: [DATE]  
> **Version**: 1.0.0  
> **Maintainer**: [MAINTAINER NAME]

## Purpose & Role

Brief 1-2 sentence description of what this library does and its role in the overall system.

## Key Functionality

- List major capabilities provided by this library
- Include key modules and their purposes
- Highlight public interfaces and how they should be used

## Internal Organization

### Directory Structure

```
src/
  ├── module1.rs - Purpose of this module
  ├── module2/
  │   ├── submodule1.rs - Purpose of this submodule
  │   └── mod.rs
  ├── types.rs - Core types used throughout the library
  └── lib.rs - Public exports and library documentation
```

### Key Modules

- `module1`: Detailed explanation of what this module does
- `module2`: Explanation of this module's functionality
- `types`: Description of the core types and why they're designed this way

## Usage Patterns

```rust
// Simple example of how to use this library
use library_name::SomeType;

fn example() -> Result<(), Error> {
    let instance = SomeType::new()?;
    instance.do_something()?;
    // ...
    Ok(())
}
```

### Common Implementation Patterns

- Describe typical usage patterns
- Include best practices for using this library
- Note any gotchas or non-obvious behavior

## Dependencies

- **Internal Dependencies**:
  - List library dependencies within the codebase and why they're needed

- **External Dependencies**:
  - List key external crates and their purposes in this library

## Code Navigation Tips

- Important entry points to start exploring the code
- Key type definitions to understand
- Relationships between important components
- How to trace execution flow through the library

## Testing Guidelines

- Guidance on how to test this library
- Any specific test utilities or fixtures provided
- How to run just the tests for this library: `cargo test -p library_name`

## Troubleshooting

### Common Issues

List common issues and their solutions:

1. **[Issue Name]**
   - **Symptom**: Description of how the issue manifests
   - **Solution**: Steps to resolve the issue
   - **Example Error**: `Example error message`

2. **[Issue Name]**
   - **Symptom**: Description of how the issue manifests
   - **Solution**: Steps to resolve the issue
   - **Example Error**: `Example error message`

### Debugging Tips

- How to enable debug logging for this library
- How to trace specific operations
- Tools or techniques for troubleshooting

## Changelog

- **1.0.0** ([DATE]): Initial documentation version