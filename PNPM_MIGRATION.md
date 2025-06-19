# PNPM Migration Guide

This document outlines the migration from npm to pnpm for the Buster monorepo.

## What Changed

### Files Added
- `pnpm-workspace.yaml` - Defines workspace configuration for pnpm
- `.pnpmrc` - pnpm configuration file with monorepo best practices
- `PNPM_MIGRATION.md` - This migration guide

### Files Modified
- `package.json` - Updated packageManager to pnpm@9.15.0, removed workspaces field, updated scripts
- `apps/web/Dockerfile` - Updated to use pnpm instead of npm
- `.github/workflows/web-lint.yml` - Updated CI to use pnpm
- `.github/workflows/web-e2e-tests-optimized.yml` - Updated CI to use pnpm  
- `scripts/evals.sh` - Updated to use `pnpm exec` instead of `npx`
- `CLAUDE.md` - Updated documentation examples to use pnpm
- `.github/dependabot.yml` - Consolidated npm dependency updates to root

### Files Removed
- `package-lock.json` - Replaced by `pnpm-lock.yaml`
- `apps/web/package-lock.json` - Replaced by workspace-wide `pnpm-lock.yaml`

## Migration Steps Completed

1. ✅ Created `pnpm-workspace.yaml` with workspace definitions
2. ✅ Created `.pnpmrc` with optimized monorepo settings
3. ✅ Updated `package.json` packageManager field to `pnpm@9.15.0`
4. ✅ Removed `workspaces` field from `package.json` (now in pnpm-workspace.yaml)
5. ✅ Updated all npm scripts to use pnpm equivalents:
   - `npm run` → `pnpm run`
   - `npm run --workspace=@package` → `pnpm --filter @package run`
   - `npm run --cwd` → `pnpm --filter`
6. ✅ Updated Dockerfile to use pnpm with corepack
7. ✅ Updated GitHub Actions workflows to use pnpm
8. ✅ Updated shell scripts to use `pnpm exec` instead of `npx`
9. ✅ Removed npm lockfiles
10. ✅ Updated documentation

## Key Differences for Developers

### Installation
```bash
# Old (npm)
npm install

# New (pnpm)  
pnpm install
```

### Running Scripts
```bash
# Old (npm)
npm run dev
npm run build --workspace=@buster/web

# New (pnpm)
pnpm run dev
pnpm --filter @buster/web run build
```

### Adding Dependencies
```bash
# Old (npm)
npm install lodash
npm install -D typescript --workspace=@buster/web

# New (pnpm)
pnpm add lodash
pnpm --filter @buster/web add -D typescript
```

### Running Package Executables
```bash
# Old (npm)
npx playwright test

# New (pnpm)
pnpm exec playwright test
```

## Benefits of pnpm

1. **Disk Space Efficiency**: pnpm uses hard links and symlinks to share dependencies across projects
2. **Faster Installation**: Better caching and parallel installation
3. **Strict Dependency Resolution**: Prevents phantom dependencies by creating proper node_modules structure
4. **Better Workspace Support**: More intuitive workspace commands with filtering
5. **Lockfile Efficiency**: Smaller, more readable lockfiles

## Next Steps

After migration, developers should:

1. Install pnpm globally: `npm install -g pnpm`
2. Remove any local `node_modules` directories: `rm -rf node_modules`
3. Install dependencies: `pnpm install`
4. Update any local scripts or tooling to use pnpm commands

## Troubleshooting

### If you encounter issues:

1. **Clear pnpm cache**: `pnpm store prune`
2. **Remove node_modules**: `rm -rf node_modules packages/*/node_modules apps/*/node_modules`
3. **Fresh install**: `pnpm install`
4. **Check workspace setup**: `pnpm list -r` to see all workspace packages

### Common Command Equivalents

| npm | pnpm |
|-----|------|
| `npm install` | `pnpm install` |
| `npm run script` | `pnpm run script` |
| `npm run script --workspace=pkg` | `pnpm --filter pkg run script` |
| `npx command` | `pnpm exec command` |
| `npm install pkg` | `pnpm add pkg` |
| `npm install -g pkg` | `pnpm add -g pkg` |

For more information, see the [pnpm documentation](https://pnpm.io/) 