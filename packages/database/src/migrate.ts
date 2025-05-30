import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { getClient, getDb } from './connection.js';

export async function runMigrations(migrationsFolder = './drizzle'): Promise<void> {
  try {
    const db = getDb();
    console.log('Running migrations...');
    await migrate(db, { migrationsFolder });
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

export async function runMigrationsAndClose(migrationsFolder = './drizzle'): Promise<void> {
  try {
    await runMigrations(migrationsFolder);
  } finally {
    const client = getClient();
    await client.end();
  }
}
