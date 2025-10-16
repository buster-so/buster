#!/usr/bin/env bun

/**
 * Build script for Buster CLI
 *
 * Creates a standalone executable binary with Bun embedded.
 * Externalizes DuckDB native bindings since CLI doesn't use search functionality.
 *
 * Why external config is needed:
 * - CLI imports @buster/ai which includes analyst workflow
 * - Analyst workflow imports steps that reference @buster/search
 * - Even though CLI never uses search, Bun's bundler does static analysis on all files
 * - Bun sees '@buster/search' import and tries to resolve DuckDB native bindings
 * - This config tells Bun to skip those platform-specific native modules
 */

import { $ } from 'bun';

const isProd = process.env.NODE_ENV === 'production';

console.log(`🔨 Building CLI${isProd ? ' (production)' : ''}...`);

const result =
  await $`bun build src/index.tsx --compile --outfile dist/buster --external @duckdb/node-bindings --external @duckdb/node-api --define import.meta.env.PROD=${isProd ? 'true' : 'false'}`.nothrow();

if (result.exitCode !== 0) {
  console.error('❌ Build failed');
  process.exit(result.exitCode);
}

console.log('✅ Build complete: dist/buster');
