#!/usr/bin/env node
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sql, eq, inArray } from 'drizzle-orm';
import { getTableName } from 'drizzle-orm';
import { db } from '../src/connection';
import * as schema from '../src/schema';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get all table objects from schema (same as dump.ts and seed.ts)
function getAllTables(): Record<string, any> {
  const tables: Record<string, any> = {};

  for (const [key, value] of Object.entries(schema)) {
    if (value && typeof value === 'object' && Symbol.for('drizzle:IsDrizzleTable') in value) {
      try {
        const _tableName = getTableName(value);
        tables[key] = value;
      } catch {
        // Not a table, skip
      }
    }
  }

  return tables;
}

async function loadJsonFile(filePath: string): Promise<any> {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
}

async function deleteTableData(
  tx: any,
  tableName: string,
  table: any,
  seedData: any[]
): Promise<number> {
  if (!seedData || seedData.length === 0) return 0;

  try {
    // Get the IDs from the seed data
    const ids = seedData.map((record) => record.id).filter(Boolean);
    if (ids.length === 0) return 0;

    // Delete only records with matching IDs
    if (table.id) {
      const result = await tx.delete(table).where(inArray(table.id, ids));
      return result.rowCount || 0;
    }
  } catch (error: any) {
    console.warn(`Could not delete from ${tableName}: ${error.message}`);
  }
  return 0;
}

async function teardown() {
  console.log('Starting targeted database teardown (seed data + related test data)...\n');

  const dataDir = path.join(__dirname, '../seed-data');

  if (!fs.existsSync(dataDir)) {
    console.error(`Seed data directory not found: ${dataDir}`);
    console.log('Cannot determine what data to remove without seed data files');
    process.exit(1);
  }

  try {
    // Load metadata to get table order
    const metadataPath = path.join(dataDir, '_metadata.json');
    const metadata = await loadJsonFile(metadataPath);

    if (!metadata || !metadata.tableOrder) {
      console.error('Metadata file not found or invalid. Please run dump.ts first');
      process.exit(1);
    }

    const tables = getAllTables();
    const tableOrder = [...metadata.tableOrder].reverse(); // Reverse for deletion

    console.log(`Found ${tableOrder.length} tables in metadata\n`);

    // Load all seed data files to get IDs
    const seedData: Record<string, any[]> = {};
    for (const tableName of metadata.tableOrder) {
      const data = await loadJsonFile(path.join(dataDir, `${tableName}.json`));
      if (data) {
        seedData[tableName] = data;
      }
    }

    // Extract key IDs for cascade operations
    const userIds = seedData.users?.map((u: any) => u.id) || [];
    const orgIds = seedData.organizations?.map((o: any) => o.id) || [];
    const dataSourceIds = seedData.dataSources?.map((d: any) => d.id) || [];

    console.log('=== Seed data summary ===');
    console.log(`Users to remove: ${userIds.length}`);
    console.log(`Organizations to remove: ${orgIds.length}`);
    console.log(`Data sources to remove: ${dataSourceIds.length}`);
    console.log();

    // Start transaction
    await db.transaction(async (tx) => {
      console.log('=== Phase 1: Gathering related test data ===\n');

      // Collect IDs of data created during testing that's related to seeded entities
      const relatedIds: Record<string, string[]> = {};

      // Find all chats belonging to seeded organizations
      if (orgIds.length > 0 && tables.chats) {
        try {
          const chats = await tx
            .select({ id: tables.chats.id })
            .from(tables.chats)
            .where(inArray(tables.chats.organizationId, orgIds));
          relatedIds.chats = chats.map((c: any) => c.id);
          if (relatedIds.chats.length > 0) {
            console.log(`Found ${relatedIds.chats.length} chats from seeded organizations`);
          }
        } catch (e) {
          // Table might not have organizationId
        }
      }

      // Find all messages in those chats or created by seeded users
      if ((relatedIds.chats?.length > 0 || userIds.length > 0) && tables.messages) {
        try {
          const conditions = [];
          if (relatedIds.chats?.length > 0 && tables.messages.chatId) {
            conditions.push(inArray(tables.messages.chatId, relatedIds.chats));
          }
          if (userIds.length > 0 && tables.messages.createdBy) {
            conditions.push(inArray(tables.messages.createdBy, userIds));
          }
          
          if (conditions.length > 0) {
            const messages = await tx
              .select({ id: tables.messages.id })
              .from(tables.messages)
              .where(conditions.length === 1 ? conditions[0] : sql`${conditions[0]} OR ${conditions[1]}`);
            
            relatedIds.messages = messages.map((m: any) => m.id);
            if (relatedIds.messages.length > 0) {
              console.log(`Found ${relatedIds.messages.length} messages from seeded users/chats`);
            }
          }
        } catch (e) {
          // Table structure might be different
        }
      }

      console.log('\n=== Phase 2: Deleting in reverse dependency order ===\n');

      let totalDeleted = 0;
      let tablesAffected = 0;

      // Process tables in reverse order to respect foreign keys
      for (const tableName of tableOrder) {
        const table = tables[tableName];
        const data = seedData[tableName];
        
        if (table && data && data.length > 0) {
          try {
            let deletedCount = 0;
            
            // Special handling for tables that might have test data
            if (tableName === 'messages' && relatedIds.messages?.length > 0) {
              // Delete both seeded messages and test messages
              const allMessageIds = [
                ...(data.map((d: any) => d.id) || []),
                ...(relatedIds.messages || [])
              ];
              const result = await tx.delete(table).where(inArray(table.id, allMessageIds));
              deletedCount = result.rowCount || 0;
            } else if (tableName === 'chats' && relatedIds.chats?.length > 0) {
              // Delete both seeded chats and test chats
              const allChatIds = [
                ...(data.map((d: any) => d.id) || []),
                ...(relatedIds.chats || [])
              ];
              const result = await tx.delete(table).where(inArray(table.id, allChatIds));
              deletedCount = result.rowCount || 0;
            } else {
              // For other tables, check if they have organizationId or userId columns
              // and delete related test data too
              if (table.organizationId && orgIds.length > 0) {
                // Delete by organization (includes test data)
                const result = await tx.delete(table).where(inArray(table.organizationId, orgIds));
                deletedCount = result.rowCount || 0;
              } else if (table.userId && userIds.length > 0) {
                // Delete by user (includes test data)
                const result = await tx.delete(table).where(inArray(table.userId, userIds));
                deletedCount = result.rowCount || 0;
              } else if (table.createdBy && userIds.length > 0) {
                // Delete by createdBy (includes test data)
                const result = await tx.delete(table).where(inArray(table.createdBy, userIds));
                deletedCount = result.rowCount || 0;
              } else {
                // Default: Delete only by exact IDs from seed data
                deletedCount = await deleteTableData(tx, tableName, table, data);
              }
            }

            if (deletedCount > 0) {
              totalDeleted += deletedCount;
              tablesAffected++;
              const extraCount = deletedCount - data.length;
              if (extraCount > 0) {
                console.log(`✓ ${tableName}: deleted ${data.length} seeded + ${extraCount} test records`);
              } else {
                console.log(`✓ ${tableName}: deleted ${deletedCount} records`);
              }
            }
          } catch (error: any) {
            if (!error.message.includes('does not exist')) {
              console.warn(`✗ ${tableName}: ${error.message}`);
            }
          }
        }
      }

      console.log('\n=== Phase 3: Cleaning up auth schema ===\n');

      // Delete auth.identities for seeded users
      if (userIds.length > 0) {
        try {
          let count = 0;
          for (const userId of userIds) {
            const result = await tx.execute(sql`
              DELETE FROM auth.identities WHERE user_id = ${userId}
            `);
            count += result.rowCount || 0;
          }
          if (count > 0) {
            console.log(`✓ Deleted ${count} auth identities`);
          }
        } catch (error: any) {
          console.warn(`Could not delete auth identities: ${error.message}`);
        }
      }

      // Delete auth.users for seeded users
      if (userIds.length > 0) {
        try {
          let count = 0;
          for (const userId of userIds) {
            const result = await tx.execute(sql`
              DELETE FROM auth.users WHERE id = ${userId}
            `);
            count += result.rowCount || 0;
          }
          if (count > 0) {
            console.log(`✓ Deleted ${count} auth users`);
          }
        } catch (error: any) {
          console.warn(`Could not delete auth users: ${error.message}`);
        }
      }

      console.log('\n=== Phase 4: Cleaning up vault secrets ===\n');

      // Delete vault secrets for seeded data sources
      if (dataSourceIds.length > 0) {
        try {
          let count = 0;
          for (const dataSourceId of dataSourceIds) {
            const result = await tx.execute(sql`
              DELETE FROM vault.secrets WHERE name = ${dataSourceId}
            `);
            count += result.rowCount || 0;
          }
          if (count > 0) {
            console.log(`✓ Deleted ${count} vault secrets`);
          }
        } catch (error: any) {
          console.warn(`Could not delete vault secrets: ${error.message}`);
        }
      }

      console.log('\n=== Teardown Summary ===');
      console.log(`Tables affected: ${tablesAffected}`);
      console.log(`Total records deleted: ${totalDeleted}`);
      console.log(`Auth users deleted: ${userIds.length}`);
      console.log(`Organizations deleted: ${orgIds.length}`);
      console.log('\n✓ Successfully removed seeded data and related test data');
      console.log('✓ Other data in the database remains untouched');
    });
  } catch (error) {
    console.error('Error during teardown:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const verbose = args.includes('--verbose');

if (isDryRun) {
  console.log('DRY RUN MODE - No changes will be made to the database\n');
  
  const dataDir = path.join(__dirname, '../seed-data');
  
  if (!fs.existsSync(dataDir)) {
    console.error(`Seed data directory not found: ${dataDir}`);
    console.log('Please run dump.ts first to generate seed data files');
    process.exit(1);
  }
  
  const metadata = await loadJsonFile(path.join(dataDir, '_metadata.json'));
  
  if (!metadata) {
    console.error('Metadata file not found. Please run dump.ts first');
    process.exit(1);
  }
  
  console.log('=== Teardown Plan ===\n');
  console.log('This will remove:');
  console.log('1. All records from the original seed data files');
  console.log('2. Any test data created that belongs to:');
  console.log('   - Seeded users');
  console.log('   - Seeded organizations');
  console.log('   - Chats/messages created by seeded users');
  console.log('3. Auth schema entries for seeded users');
  console.log('4. Vault secrets for seeded data sources\n');
  
  console.log('Data that will be PRESERVED:');
  console.log('- Any users/orgs not in the seed data');
  console.log('- Data not associated with seeded entities\n');
  
  // Count seed records
  let totalSeedRecords = 0;
  const seedCounts: Record<string, number> = {};
  
  for (const table of metadata.tables || []) {
    const data = await loadJsonFile(path.join(dataDir, `${table.name}.json`));
    if (data) {
      seedCounts[table.name] = data.length;
      totalSeedRecords += data.length;
    }
  }
  
  console.log(`Seed data to remove: ${totalSeedRecords} records across ${Object.keys(seedCounts).length} tables`);
  
  if (verbose) {
    console.log('\nDetailed breakdown:');
    for (const [table, count] of Object.entries(seedCounts)) {
      if (count > 0) {
        console.log(`  ${table}: ${count} records`);
      }
    }
    
    console.log('\nDeletion order (reverse of dependencies):');
    const tableOrder = [...metadata.tableOrder].reverse();
    tableOrder.forEach((table, index) => {
      console.log(`  ${index + 1}. ${table}`);
    });
  }
  
  console.log('\nNote: Additional test data related to seeded entities will also be removed');
  console.log('Use --verbose flag for more details');
  
  process.exit(0);
}

// Set default DATABASE_URL if not provided
if (!process.env.DATABASE_URL) {
  const defaultUrl = 'postgresql://postgres:postgres@localhost:54322/postgres';
  console.log(`DATABASE_URL not set - using default: ${defaultUrl}`);
  process.env.DATABASE_URL = defaultUrl;
}

// Run teardown
console.log('Starting targeted teardown...\n');
console.log('This will DELETE:');
console.log('  - All seeded data');
console.log('  - Test data associated with seeded users/orgs\n');
console.log('This will PRESERVE:');
console.log('  - Any other data in your database\n');
console.log('Press Ctrl+C to cancel, or wait 3 seconds to continue...\n');

setTimeout(() => {
  teardown();
}, 3000);