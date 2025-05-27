#!/usr/bin/env bun

import { 
  runSeed, 
  runSeeds, 
  runAllSeeds, 
  createSnapshot, 
  getAvailableSeeds, 
  getAvailableSnapshots,
  cleanupSnapshots 
} from './index.js';

async function main() {
  const command = process.argv[2];
  const args = process.argv.slice(3);

  try {
    switch (command) {
      case 'run':
        await handleRunCommand(args);
        break;
      case 'snapshot':
        await handleSnapshotCommand(args);
        break;
      case 'list':
        await handleListCommand(args);
        break;
      case 'cleanup':
        await handleCleanupCommand(args);
        break;
      default:
        showHelp();
        break;
    }
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

async function handleRunCommand(args: string[]) {
  if (args.length === 0) {
    console.log('🌱 Running all seeds...');
    const results = await runAllSeeds();
    printResults(results);
    return;
  }

  if (args[0] === 'all') {
    console.log('🌱 Running all seeds...');
    const results = await runAllSeeds();
    printResults(results);
    return;
  }

  console.log(`🌱 Running seeds: ${args.join(', ')}`);
  const results = await runSeeds(args);
  printResults(results);
}

async function handleSnapshotCommand(args: string[]) {
  if (args.length === 0) {
    console.error('❌ Snapshot name is required');
    console.log('Usage: bun run seed snapshot <name> [table1,table2,...]');
    process.exit(1);
  }

  const name = args[0];
  const tables = args[1] ? args[1].split(',').map(t => t.trim()) : undefined;

  if (!name) {
    console.error('❌ Snapshot name is required');
    process.exit(1);
  }

  await createSnapshot(name, tables);
}

async function handleListCommand(args: string[]) {
  const type = args[0] || 'seeds';

  if (type === 'seeds') {
    const seeds = getAvailableSeeds();
    console.log('📋 Available seeds:');
    if (seeds.length === 0) {
      console.log('  No seeds found');
    } else {
      for (const seed of seeds) {
        console.log(`  - ${seed}`);
      }
    }
  } else if (type === 'snapshots') {
    const snapshots = getAvailableSnapshots();
    console.log('📋 Available snapshots:');
    if (snapshots.length === 0) {
      console.log('  No snapshots found');
    } else {
      for (const snapshot of snapshots) {
        console.log(`  - ${snapshot}`);
      }
    }
  } else {
    console.error('❌ Invalid list type. Use "seeds" or "snapshots"');
    process.exit(1);
  }
}

async function handleCleanupCommand(args: string[]) {
  const keep = args[0] ? Number.parseInt(args[0], 10) : 5;
  
  if (Number.isNaN(keep) || keep < 1) {
    console.error('❌ Keep count must be a positive number');
    process.exit(1);
  }

  cleanupSnapshots(keep);
  console.log(`✅ Cleanup complete (kept ${keep} most recent snapshots)`);
}

function printResults(results: Array<{ name: string; success: boolean; duration: number; error?: string; recordsCreated?: number }>) {
  console.log('\n📊 Seed Results:');
  console.log('================');
  
  let totalSuccess = 0;
  let totalFailed = 0;
  let totalDuration = 0;
  let totalRecords = 0;

  for (const result of results) {
    const status = result.success ? '✅' : '❌';
    const duration = `${result.duration}ms`;
    const records = result.recordsCreated ? ` (${result.recordsCreated} records)` : '';
    
    console.log(`${status} ${result.name} - ${duration}${records}`);
    
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }

    if (result.success) {
      totalSuccess++;
      totalRecords += result.recordsCreated || 0;
    } else {
      totalFailed++;
    }
    totalDuration += result.duration;
  }

  console.log('================');
  console.log(`✅ Success: ${totalSuccess}`);
  console.log(`❌ Failed: ${totalFailed}`);
  console.log(`⏱️  Total time: ${totalDuration}ms`);
  console.log(`📊 Total records: ${totalRecords}`);
}

function showHelp() {
  console.log(`
🌱 Database Seeding CLI

Usage: bun run seed <command> [options]

Commands:
  run [seed1,seed2,...]  Run specific seeds (or all if none specified)
  run all               Run all available seeds
  snapshot <name> [tables]  Create a snapshot of current data
  list [seeds|snapshots]    List available seeds or snapshots
  cleanup [keep]        Clean up old snapshots (default: keep 5)
  help                  Show this help message

Examples:
  bun run seed run                    # Run all seeds
  bun run seed run users,posts        # Run specific seeds
  bun run seed snapshot prod-data     # Create snapshot of all data
  bun run seed snapshot test-users users,profiles  # Snapshot specific tables
  bun run seed list seeds             # List available seeds
  bun run seed list snapshots         # List available snapshots
  bun run seed cleanup 3              # Keep only 3 most recent snapshots
`);
}

// Run the CLI if this file is executed directly
if (import.meta.main) {
  await main();
} 