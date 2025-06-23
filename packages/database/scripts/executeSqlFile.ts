#!/usr/bin/env bun

import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

/**
 * Execute a SQL file against the database using psql command
 */
export async function executeSqlFile(filePath: string): Promise<void> {
  try {
    console.log(`📄 Executing SQL file with psql: ${filePath}`);

    // Use ON_ERROR_STOP to halt execution on first error
    const command = `PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -d postgres -U postgres --set ON_ERROR_STOP=on -f "${filePath}"`;

    const { stdout, stderr } = await execAsync(command);

    // Check for SQL errors in the output
    const hasErrors =
      stderr &&
      (stderr.includes('ERROR:') || stderr.includes('FATAL:') || stderr.includes('PANIC:'));

    if (hasErrors) {
      console.error(`❌ SQL errors found in ${filePath}:`);
      console.error(stderr);
      throw new Error(`SQL execution failed with errors: ${stderr}`);
    }

    if (stdout) {
      console.log(stdout);
    }
    if (stderr) {
      // psql outputs some info to stderr that isn't actually errors (like notices)
      console.log(stderr);
    }

    console.log(`✅ Successfully executed SQL file: ${filePath}`);
  } catch (error) {
    console.error(`❌ Error executing SQL file ${filePath}:`, error);
    throw error;
  }
}
