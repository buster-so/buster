# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands
- Build: `cargo build`
- Release build: `cargo build --release`
- Run tests: `cargo test`
- Run specific test: `cargo test test_name`
- Run tests in file: `cargo test --test filename`
- Run package tests: `cargo test -p <package_name>`
- Format: `cargo fmt`
- Lint: `cargo clippy`

## Code Style Guidelines
- **Imports**: Group by std, external crates, internal modules; alphabetical order
- **Formatting**: 4-space indentation (standard Rust)
- **Error Handling**: Use `thiserror` for error types, `anyhow` for general propagation
- **Naming**: Follow Rust conventions (`snake_case` for variables/functions, `PascalCase` for types)
- **Types**: Define custom error types with descriptive messages
- **Dependencies**: Use workspace dependencies with `{ workspace = true }`
- **Testing**: Place in separate `/tests` directory; use `tempfile` for test directories
- **Never log secrets or sensitive data**

## Project Info
- CLI for managing semantic models in Buster
- Uses semantic versioning (PR title conventions for bumps)
  - Major: PR title with "BREAKING CHANGE" or "major", or PR with "major" label
  - Minor: PR title with "feat", "feature", or "minor", or PR with "minor" label
  - Patch: Default for all other PRs
- Cross-project references supported
- Config defined in `buster.yml`
- File and tag exclusions for deployment
- Row limit of 5000 is enforced for database queries by default