#!/usr/bin/env node
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getTableName, sql } from 'drizzle-orm';
import { getTableConfig } from 'drizzle-orm/pg-core';
import { db } from '../src/connection';
import * as schema from '../src/schema';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get all table objects from schema
function getAllTables(): Record<string, any> {
  const tables: Record<string, any> = {};

  for (const [key, value] of Object.entries(schema)) {
    // Check if it's a Drizzle table object
    if (value && typeof value === 'object' && Symbol.for('drizzle:IsDrizzleTable') in value) {
      try {
        const tableName = getTableName(value);
        tables[key] = value;
        console.log(`Found table: ${key} (${tableName})`);
      } catch {
        // Not a table, skip
      }
    }
  }

  return tables;
}

// Build foreign key dependencies using Drizzle metadata
function buildDependencyMap(tables: Record<string, any>): Record<string, string[]> {
  const dependencies: Record<string, string[]> = {};

  // Initialize all tables with empty dependencies
  for (const tableName of Object.keys(tables)) {
    dependencies[tableName] = [];
  }

  // Extract foreign key dependencies from Drizzle table configs
  for (const [tableName, table] of Object.entries(tables)) {
    const config = getTableConfig(table);

    if (config.foreignKeys && config.foreignKeys.length > 0) {
      for (const fk of config.foreignKeys) {
        const ref = fk.reference();
        const foreignTable = ref.foreignTable;

        // Find the schema export name for this foreign table
        for (const [schemaName, schemaTable] of Object.entries(tables)) {
          if (schemaTable === foreignTable) {
            if (!dependencies[tableName].includes(schemaName)) {
              dependencies[tableName].push(schemaName);
              console.log(`  Detected FK: ${tableName} -> ${schemaName}`);
            }
            break;
          }
        }
      }
    }
  }

  console.log('\nParsed dependencies:');
  for (const [table, deps] of Object.entries(dependencies)) {
    if (deps.length > 0) {
      console.log(`  ${table} depends on: ${deps.join(', ')}`);
    }
  }

  return dependencies;
}

// Topological sort to determine insertion order
function topologicalSort(dependencies: Record<string, string[]>): string[] {
  const sorted: string[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();

  function visit(node: string, path: string[] = []): void {
    if (visited.has(node)) return;

    if (visiting.has(node)) {
      console.warn(`Circular dependency detected: ${[...path, node].join(' -> ')}`);
      return;
    }

    visiting.add(node);
    const deps = dependencies[node] || [];

    for (const dep of deps) {
      visit(dep, [...path, node]);
    }

    visiting.delete(node);
    visited.add(node);
    sorted.push(node);
  }

  // Visit all nodes
  for (const node of Object.keys(dependencies)) {
    if (!visited.has(node)) {
      visit(node);
    }
  }

  return sorted;
}

async function extractTableData(tableName: string, table: any): Promise<any[]> {
  try {
    const results = await db.select().from(table);
    console.log(`Extracted ${results.length} records from ${tableName}`);
    return results;
  } catch (error) {
    console.error(`Error extracting data from ${tableName}:`, error);
    return [];
  }
}

async function extractAuthData(): Promise<{ authUsers: any[]; authIdentities: any[] }> {
  try {
    const authUsersResult = await db.execute(sql`SELECT * FROM auth.users`);
    const authUsers = authUsersResult.rows || [];
    console.log(`Extracted ${authUsers.length} auth users`);

    const authIdentitiesResult = await db.execute(sql`SELECT * FROM auth.identities`);
    const authIdentities = authIdentitiesResult.rows || [];
    console.log(`Extracted ${authIdentities.length} auth identities`);

    return { authUsers, authIdentities };
  } catch (error) {
    console.error('Error extracting auth data:', error);
    return { authUsers: [], authIdentities: [] };
  }
}

async function extractVaultSecrets(): Promise<any[]> {
  try {
    const result = await db.execute(sql`SELECT * FROM vault.secrets`);
    const secrets = result.rows || [];
    console.log(`Extracted ${secrets.length} vault secrets`);
    return secrets;
  } catch (error) {
    console.error('Error extracting vault secrets:', error);
    return [];
  }
}

async function main() {
  console.log('Starting dynamic data extraction...\n');

  // Discover all tables
  console.log('=== Discovering tables ===\n');
  const tables = getAllTables();
  console.log(`Found ${Object.keys(tables).length} tables in schema\n`);

  // Build dependencies from Drizzle metadata
  console.log('=== Building dependency map from Drizzle metadata ===');
  const dependencies = buildDependencyMap(tables);

  // Sort tables by dependencies
  console.log('\n=== Determining insertion order ===');
  const tableOrder = topologicalSort(dependencies);
  console.log('\nInsertion order (respecting dependencies):');
  console.log(tableOrder.map((t, i) => `${i + 1}. ${t}`).join('\n'));
  console.log();

  // Create data directory
  const dataDir = path.join(__dirname, '../seed-data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Extract auth data
  console.log('=== Extracting auth data ===\n');
  const { authUsers, authIdentities } = await extractAuthData();
  if (authUsers.length > 0) {
    fs.writeFileSync(path.join(dataDir, 'auth.users.json'), JSON.stringify(authUsers, null, 2));
  }
  if (authIdentities.length > 0) {
    fs.writeFileSync(
      path.join(dataDir, 'auth.identities.json'),
      JSON.stringify(authIdentities, null, 2)
    );
  }

  // Extract vault secrets
  console.log('\n=== Extracting vault secrets ===\n');
  const vaultSecrets = await extractVaultSecrets();
  if (vaultSecrets.length > 0) {
    fs.writeFileSync(
      path.join(dataDir, 'vault.secrets.json'),
      JSON.stringify(vaultSecrets, null, 2)
    );
  }

  // Extract data from all public schema tables
  console.log('\n=== Extracting public schema tables ===\n');
  const extractedData: Record<string, any[]> = {};

  for (const tableName of tableOrder) {
    const table = tables[tableName];
    if (table) {
      const data = await extractTableData(tableName, table);
      if (data.length > 0) {
        extractedData[tableName] = data;

        // Write to individual file
        fs.writeFileSync(path.join(dataDir, `${tableName}.json`), JSON.stringify(data, null, 2));
      }
    }
  }

  // Create metadata file with extraction info and dependencies
  const metadata = {
    extractedAt: new Date().toISOString(),
    tableCount:
      Object.keys(extractedData).length +
      (authUsers.length > 0 ? 1 : 0) +
      (authIdentities.length > 0 ? 1 : 0) +
      (vaultSecrets.length > 0 ? 1 : 0),
    tables: [
      ...Object.entries(extractedData).map(([name, data]) => ({
        name,
        recordCount: data.length,
        dependencies: dependencies[name] || [],
      })),
      ...(authUsers.length > 0
        ? [{ name: 'auth.users', recordCount: authUsers.length, dependencies: [] }]
        : []),
      ...(authIdentities.length > 0
        ? [
            {
              name: 'auth.identities',
              recordCount: authIdentities.length,
              dependencies: ['auth.users'],
            },
          ]
        : []),
      ...(vaultSecrets.length > 0
        ? [{ name: 'vault.secrets', recordCount: vaultSecrets.length, dependencies: [] }]
        : []),
    ],
    tableOrder,
    dependencies,
  };

  fs.writeFileSync(path.join(dataDir, '_metadata.json'), JSON.stringify(metadata, null, 2));

  console.log('\n=== Extraction Summary ===');
  console.log(`Total tables extracted: ${metadata.tableCount}`);
  console.log(`Data saved to: ${dataDir}`);
  console.log('\nExtracted tables with dependencies:');
  metadata.tables.forEach((table) => {
    const deps =
      table.dependencies.length > 0
        ? ` → depends on: ${table.dependencies.join(', ')}`
        : ' (independent)';
    console.log(`  ${table.name}: ${table.recordCount} records${deps}`);
  });

  process.exit(0);
}

// Set default DATABASE_URL if not provided
if (!process.env.DATABASE_URL) {
  const defaultUrl = 'postgresql://postgres:postgres@localhost:54322/postgres';
  console.log(`DATABASE_URL not set - using default: ${defaultUrl}`);
  process.env.DATABASE_URL = defaultUrl;
}

// Run extraction
main().catch((error) => {
  console.error('Fatal error during extraction:', error);
  process.exit(1);
});
