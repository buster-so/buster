#!/usr/bin/env bun

/**
 * Build script for Buster CLI
 *
 * Creates a standalone executable binary with Bun embedded.
 * Externalizes DuckDB native bindings since CLI doesn't use search functionality.
 *
 * Usage:
 *   bun run build.ts                     # Build for current platform
 *   bun run build.ts --target linux-x64  # Build for specific platform
 *   BUN_TARGET=darwin-arm64 bun run build.ts  # Via environment variable
 *
 * Supported targets:
 *   - bun-linux-x64-modern (Linux x86_64)
 *   - bun-darwin-x64 (macOS Intel)
 *   - bun-darwin-arm64 (macOS Apple Silicon)
 *   - bun-windows-x64 (Windows x64)
 *
 * Why external config is needed:
 * - CLI imports @buster/ai which includes analyst workflow
 * - Analyst workflow imports steps that reference @buster/search
 * - Even though CLI never uses search, Bun's bundler does static analysis on all files
 * - Bun sees '@buster/search' import and tries to resolve DuckDB native bindings
 * - This config tells Bun to skip those platform-specific native modules
 */

import { $ } from 'bun';
import { parseArgs } from 'node:util';

const isProd = process.env.NODE_ENV === 'production';

// Parse command line arguments
const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    target: {
      type: 'string',
      short: 't',
    },
  },
  allowPositionals: true,
});

// Get target from CLI arg or environment variable
const target = values.target || process.env.BUN_TARGET || '';

console.log(`🔨 Building CLI${isProd ? ' (production)' : ''}...`);
if (target) {
  console.log(`📦 Target: ${target}`);
}

// Build command parts
const buildCmd = [
  'bun build src/index.tsx',
  '--compile',
  target ? `--target=${target}` : '',
  '--outfile dist/buster',
  '--external @duckdb/node-bindings',
  '--external @duckdb/node-api',
  `--define import.meta.env.PROD=${isProd ? 'true' : 'false'}`,
]
  .filter(Boolean)
  .join(' ');

const result = await $`${buildCmd}`.nothrow();

if (result.exitCode !== 0) {
  console.error('❌ Build failed');
  process.exit(result.exitCode);
}

console.log('✅ Build complete: dist/buster');
