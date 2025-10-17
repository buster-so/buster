#!/usr/bin/env node
/** biome-ignore-all lint/suspicious/noExplicitAny: I guess this is okay? */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { eq, getTableName, sql } from 'drizzle-orm';
import { db } from '../src/connection';
import * as schema from '../src/schema';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get all table objects from schema
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

async function upsertData(tx: any, tableName: string, table: any, data: any[]) {
  if (!data || data.length === 0) return;

  try {
    // Fix YAML content in datasets table by converting literal \n to actual newlines
    if (tableName === 'datasets') {
      data = data.map((record) => ({
        ...record,
        ymlFile: record.ymlFile ? record.ymlFile.replace(/\\n/g, '\n') : record.ymlFile,
      }));
    }
    // For tables that should always use ON CONFLICT DO NOTHING instead of updating
    const doNothingTables = [
      'assetSearch',
      'textSearch',
      'permissionGroupsToUsers',
      'teamsToUsers',
      'datasetsToPermissionGroups',
      'datasetsToDatasetGroups',
      'collectionsToAssets',
      'messagesToFiles',
      'messagesToSlackMessages',
      'metricFilesToDashboardFiles',
      'metricFilesToDatasets',
      'metricFilesToReportFiles',
      'usersToOrganizations',
      'permissionGroupsToIdentities',
    ];

    // Batch upsert for large datasets
    const batchSize = 100;
    let upserted = 0;

    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);

      // Use batch insert with ON CONFLICT for better performance
      if (doNothingTables.includes(tableName)) {
        // For junction/relation tables, just skip duplicates
        await tx.insert(table).values(batch).onConflictDoNothing();
        upserted += batch.length;
      } else {
        // For regular tables with id field, use onConflictDoUpdate
        for (const record of batch) {
          const { id, ...updateFields } = record;

          // Most tables have an 'id' column as primary key
          if (id && table.id) {
            await tx.insert(table).values(record).onConflictDoUpdate({
              target: table.id,
              set: updateFields,
            });
          } else {
            // For tables without id column, use onConflictDoNothing
            await tx.insert(table).values(record).onConflictDoNothing();
          }
          upserted++;
        }
      }
    }

    console.log(`Upserted ${upserted} records into ${tableName}`);
  } catch (error) {
    console.error(`Error upserting data into ${tableName}:`, error);
    throw error;
  }
}

// Standard dev password for all auth users (encrypted version of "password123")
const DEV_PASSWORD_ENCRYPTED = '$2a$06$BKy/23Yp58fItuTD0aKWluB2ayXyww8AeXNQ0KHgh9TeRxJ/tbmaC';

// Function to generate auth user from public user data
function generateAuthUser(publicUser: any) {
  return {
    instanceId: '00000000-0000-0000-0000-000000000000',
    id: publicUser.id,
    aud: 'authenticated',
    role: 'authenticated',
    email: publicUser.email,
    encryptedPassword: DEV_PASSWORD_ENCRYPTED,
    emailConfirmedAt: '2025-03-04 18:42:05.801697+00',
    invitedAt: null,
    confirmationToken: '',
    confirmationSentAt: null,
    recoveryToken: '',
    recoverySentAt: null,
    emailChangeTokenNew: '',
    emailChange: '',
    emailChangeSentAt: null,
    lastSignInAt: null,
    rawAppMetaData: '{"provider": "email", "providers": ["email"]}',
    rawUserMetaData: '{}',
    isSuperAdmin: null,
    createdAt: '2025-03-04 18:42:05.801697+00',
    updatedAt: '2025-03-04 18:42:05.801697+00',
    phone: null,
    phoneConfirmedAt: null,
    phoneChange: '',
    phoneChangeToken: '',
    phoneChangeSentAt: null,
    confirmedAt: 'DEFAULT',
    emailChangeTokenCurrent: '',
    emailChangeConfirmStatus: '0',
    bannedUntil: null,
    reauthenticationToken: '',
    reauthenticationSentAt: null,
    isSsoUser: false,
    deletedAt: null,
    isAnonymous: false,
  };
}

// Function to generate auth identity from public user data
function generateAuthIdentity(publicUser: any) {
  return {
    providerId: publicUser.id,
    userId: publicUser.id,
    identityData: JSON.stringify({ sub: publicUser.id }),
    provider: 'email',
    lastSignInAt: '2025-03-04 18:42:05.801697+00',
    createdAt: '2025-03-04 18:42:05.801697+00',
    updatedAt: '2025-03-04 18:42:05.801697+00',
    email: 'DEFAULT',
    id: publicUser.id,
  };
}

// Hardcoded vault secret for data sources
const HARDCODED_VAULT_SECRET = {
  type: 'postgres',
  host: 'aws-0-us-east-1.pooler.supabase.com',
  port: 5432,
  username: 'postgres.fjbidcbjvmpesoonimhl',
  password: 'S8Jrts05EqxsfA3q',
  database: 'postgres',
  schema: 'sem',
  jump_host: null,
  ssh_username: null,
  ssh_private_key: null,
};

async function seed() {
  console.log('Starting dynamic database seed from files...\n');

  const dataDir = path.join(__dirname, '../seed-data');

  if (!fs.existsSync(dataDir)) {
    console.error(`Seed data directory not found: ${dataDir}`);
    console.log('Please run extract-all-data-dynamic.ts first to generate seed data files');
    process.exit(1);
  }

  try {
    // Load metadata to get table order and dependencies
    const metadataPath = path.join(dataDir, '_metadata.json');
    const metadata = await loadJsonFile(metadataPath);

    if (!metadata || !metadata.tableOrder) {
      console.error(
        'Metadata file not found or invalid. Please run extract-all-data-dynamic.ts first'
      );
      process.exit(1);
    }

    const tableOrder = metadata.tableOrder;
    const tables = getAllTables();

    console.log(`Found ${Object.keys(tables).length} tables in schema`);
    console.log(`Loading data for ${tableOrder.length} tables from metadata\n`);

    // Load all data files
    const seedData: Record<string, any[]> = {};

    // Load auth data from files (but we'll use hardcoded instead)
    const _authUsers = await loadJsonFile(path.join(dataDir, 'auth.users.json'));
    const _authIdentities = await loadJsonFile(path.join(dataDir, 'auth.identities.json'));
    const _vaultSecrets = await loadJsonFile(path.join(dataDir, 'vault.secrets.json'));

    // Load public schema data
    for (const tableName of tableOrder) {
      const data = await loadJsonFile(path.join(dataDir, `${tableName}.json`));
      if (data) {
        seedData[tableName] = data;
      }
    }

    // Start transaction
    await db.transaction(async (tx) => {
      console.log('=== Upserting seed data (no deletion needed) ===\n');

      // Generate auth users for all public users in the seed data
      const publicUsers = seedData.users || [];
      const authUsers = publicUsers.map(generateAuthUser);
      const authIdentities = publicUsers.map(generateAuthIdentity);

      // Upsert auth.users
      if (authUsers.length > 0) {
        console.log(`Upserting ${authUsers.length} auth users from public users...`);
        for (const user of authUsers) {
          // Build the SQL dynamically with proper parameter handling
          await tx.execute(sql`
            INSERT INTO auth.users (
              instance_id, id, aud, role, email, encrypted_password,
              email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at,
              recovery_token, recovery_sent_at, email_change_token_new, email_change,
              email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
              is_super_admin, created_at, updated_at, phone, phone_confirmed_at,
              phone_change, phone_change_token, phone_change_sent_at, confirmed_at,
              email_change_token_current, email_change_confirm_status, banned_until,
              reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at, is_anonymous
            ) VALUES (
              ${user.instanceId}, ${user.id}, ${user.aud}, ${user.role}, 
              ${user.email}, ${user.encryptedPassword}, ${user.emailConfirmedAt}, 
              ${user.invitedAt}, ${user.confirmationToken}, ${user.confirmationSentAt},
              ${user.recoveryToken}, ${user.recoverySentAt}, ${user.emailChangeTokenNew}, 
              ${user.emailChange}, ${user.emailChangeSentAt}, ${user.lastSignInAt}, 
              ${user.rawAppMetaData}::jsonb, ${user.rawUserMetaData}::jsonb, ${user.isSuperAdmin}, 
              ${user.createdAt}, ${user.updatedAt}, ${user.phone}, ${user.phoneConfirmedAt},
              ${user.phoneChange}, ${user.phoneChangeToken}, ${user.phoneChangeSentAt}, 
              ${user.confirmedAt === 'DEFAULT' ? sql`DEFAULT` : user.confirmedAt},
              ${user.emailChangeTokenCurrent}, ${user.emailChangeConfirmStatus}, ${user.bannedUntil}, 
              ${user.reauthenticationToken}, ${user.reauthenticationSentAt}, ${user.isSsoUser}, 
              ${user.deletedAt}, ${user.isAnonymous}
            )
            ON CONFLICT (id) DO UPDATE SET
              email = EXCLUDED.email,
              encrypted_password = EXCLUDED.encrypted_password,
              updated_at = EXCLUDED.updated_at
          `);
        }
      }

      // Upsert auth.identities
      if (authIdentities.length > 0) {
        console.log(`Upserting ${authIdentities.length} auth identities from public users...`);
        for (const identity of authIdentities) {
          await tx.execute(sql`
            INSERT INTO auth.identities (
              provider_id, user_id, identity_data, provider, last_sign_in_at,
              created_at, updated_at, email, id
            ) VALUES (
              ${identity.providerId}, ${identity.userId}, ${identity.identityData}::jsonb,
              ${identity.provider}, ${identity.lastSignInAt}, ${identity.createdAt},
              ${identity.updatedAt}, 
              ${identity.email === 'DEFAULT' ? sql`DEFAULT` : identity.email}, 
              ${identity.id}
            )
            ON CONFLICT (id) DO UPDATE SET
              identity_data = EXCLUDED.identity_data,
              last_sign_in_at = EXCLUDED.last_sign_in_at,
              updated_at = EXCLUDED.updated_at
          `);
        }
      }

      // Upsert public schema data in dependency order
      for (const tableName of tableOrder) {
        const table = tables[tableName];
        const data = seedData[tableName];
        if (table && data) {
          await upsertData(tx, tableName, table, data);
        }
      }

      // After all data is inserted, create vault secrets for data sources
      const dataSources = seedData.dataSources || [];
      if (dataSources.length > 0) {
        console.log('\n=== Creating vault secrets for data sources ===\n');
        for (const dataSource of dataSources) {
          try {
            console.log(`Creating new vault secret for data source: ${dataSource.name}`);

            // Always try to delete the existing secret first (if it exists)
            try {
              await tx.execute(sql`
                DELETE FROM vault.secrets WHERE name = ${dataSource.id}
              `);
              console.log(`Deleted existing vault secret for ${dataSource.name}`);
            } catch (_deleteError) {
              // It's fine if the delete fails, it might not exist
            }

            // Create a new vault secret
            const result = await tx.execute(sql`
              SELECT vault.create_secret(
                ${JSON.stringify(HARDCODED_VAULT_SECRET)}, 
                ${dataSource.id}
              ) as secret_id
            `);

            // @ts-expect-error biome-ignore lint/suspicious/noExplicitAny: Need dallin to check...
            const secretId = result?.rows?.[0]?.secret_id;

            if (secretId) {
              // Update the data source with the new secret ID
              console.log(
                `Updating data source ${dataSource.name} with new secret ID: ${secretId}`
              );
              await tx
                .update(tables.dataSources)
                .set({ secretId: secretId })
                .where(eq(tables.dataSources.id, dataSource.id));
              console.log(`Successfully linked vault secret to data source ${dataSource.name}`);
            }
          } catch (vaultError: any) {
            console.warn(
              `Could not create vault secret for data source ${dataSource.name}:`,
              vaultError.message
            );
          }
        }
      }

      db.execute(sql`SELECT populate_metric_files_to_report_files()`);

      console.log('\n=== Seed completed successfully! ===');

      // Show summary
      console.log('\nSummary:');
      const publicUserCount = (seedData.users || []).length;
      const dataSourceCount = (seedData.dataSources || []).length;
      const totalRecords =
        Object.values(seedData).reduce((sum, data) => sum + data.length, 0) + publicUserCount * 2; // x2 for auth users + identities
      console.log(`Total records upserted: ${totalRecords}`);
      console.log(`Tables seeded: ${Object.keys(seedData).length + 2}`); // +2 for auth tables
      console.log(`Auth users upserted: ${publicUserCount} (from public users)`);
      console.log(`Auth identities upserted: ${publicUserCount}`);
      console.log(`Vault secrets created/updated for: ${dataSourceCount} data sources`);
      console.log(`Dev password: password123 (for all users)`);
    });
  } catch (error) {
    console.error('Error seeding database:', error);
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
    process.exit(1);
  }

  const metadata = JSON.parse(fs.readFileSync(path.join(dataDir, '_metadata.json'), 'utf-8'));

  console.log('Seed operation plan:\n');
  console.log('Tables will be seeded in this order:');

  if (metadata?.tables) {
    metadata.tables.forEach((table: any, index: number) => {
      const deps =
        table.dependencies?.length > 0 ? ` (depends on: ${table.dependencies.join(', ')})` : '';
      console.log(`${index + 1}. ${table.name}: ${table.recordCount} records${deps}`);
    });

    console.log(`\nTotal tables: ${metadata.tables.length}`);
    console.log(`Extraction date: ${metadata.extractedAt}`);
  }

  if (verbose && metadata.dependencies) {
    console.log('\nDependency graph:');
    Object.entries(metadata.dependencies).forEach(([table, deps]) => {
      if ((deps as string[]).length > 0) {
        console.log(`  ${table} → ${(deps as string[]).join(', ')}`);
      }
    });
  }

  process.exit(0);
}

// Set default DATABASE_URL if not provided
if (!process.env.DATABASE_URL) {
  const defaultUrl = 'postgresql://postgres:postgres@localhost:54322/postgres';
  console.log(`DATABASE_URL not set - using default: ${defaultUrl}`);
  process.env.DATABASE_URL = defaultUrl;
}

// Run the seed
seed();
