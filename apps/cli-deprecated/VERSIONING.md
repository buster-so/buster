# Semantic Versioning for Buster CLI

This project uses automated semantic versioning based on pull request metadata. The version is automatically bumped when a pull request is merged into the main branch.

## How It Works

1. When a pull request is merged into the main branch, a GitHub Action workflow automatically determines the type of version bump needed.
2. The version in `Cargo.toml` is updated accordingly.
3. The changes are committed back to the repository.
4. When a release is created, the version is extracted directly from `Cargo.toml`.

## Version Bump Rules

The type of version bump is determined by the following rules:

### Major Version Bump (X.y.z → X+1.0.0)

A major version bump occurs when:
- The PR title contains "BREAKING CHANGE" or "major"
- The PR body contains "BREAKING CHANGE"
- The PR has a "major" label

### Minor Version Bump (x.Y.z → x.Y+1.0)

A minor version bump occurs when:
- The PR title contains "feat", "feature", or "minor"
- The PR has a "minor" or "feature" label

### Patch Version Bump (x.y.Z → x.y.Z+1)

A patch version bump occurs by default when:
- The PR doesn't match any of the above criteria

## Manual Version Control

If you need to manually control the version:

1. You can add specific labels to your PR:
   - `major` for a major version bump
   - `minor` or `feature` for a minor version bump
   - Any other label will result in a patch version bump

2. You can include specific keywords in your PR title:
   - "BREAKING CHANGE" or "major" for a major version bump
   - "feat", "feature", or "minor" for a minor version bump

## Example PR Titles

- `feat: add new command for user management` → Minor version bump
- `fix: resolve issue with file uploads` → Patch version bump
- `BREAKING CHANGE: change API response format` → Major version bump
- `chore: update dependencies` → Patch version bump 