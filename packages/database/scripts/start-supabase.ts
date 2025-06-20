#!/usr/bin/env tsx

import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

async function runCommand(command: string): Promise<void> {
  console.log(`🔄 Running: ${command}`);

  try {
    const { stdout, stderr } = await execAsync(command);

    if (stdout) {
      console.log(stdout);
    }

    if (stderr) {
      console.error(stderr);
    }

    console.log(`✅ Successfully completed: ${command}\n`);
  } catch (error) {
    console.error(`❌ Error running command: ${command}`);
    console.error(error);
    throw error;
  }
}

async function startSupabase(): Promise<void> {
  console.log('🚀 Starting Supabase setup...\n');

  try {
    // Start Supabase
    await runCommand('npm run db:start-supabase');

    // Reset the database
    await runCommand('npm run db:reset');

    console.log('🎉 Supabase setup completed successfully!');
  } catch (error) {
    console.error('💥 Supabase setup failed:', error);
    process.exit(1);
  }
}

// Run the script
startSupabase();
