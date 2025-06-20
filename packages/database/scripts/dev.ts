#!/usr/bin/env bun

import { exec } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runCommand(command: string, cwd?: string): Promise<void> {
  console.log(`🔄 Running: ${command}`);

  try {
    const { stdout, stderr } = await execAsync(command, { cwd });

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

async function developmentSetup(): Promise<void> {
  console.log('🚀 Starting development environment setup...\n');

  try {
    // Step 1: Run start-supabase.ts
    console.log('📦 Step 1: Starting Supabase...');
    const startSupabaseScript = join(__dirname, 'start-supabase.ts');
    await runCommand(`bun run ${startSupabaseScript}`);

    // Step 2: Run setup command
    console.log('🔧 Step 2: Running database setup...');
    const setupScript = join(__dirname, 'setup', 'setup.ts');
    await runCommand(`bun run ${setupScript} setup`);

    console.log('🎉 Development environment setup completed successfully!');
  } catch (error) {
    console.error('💥 Development setup failed:', error);
    process.exit(1);
  }
}

// Run the script
developmentSetup();
