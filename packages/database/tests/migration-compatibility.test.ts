import { expect, test } from 'bun:test';
import postgres from 'postgres';

const connectionString =
  process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

test('Both Diesel and Drizzle see same database', async () => {
  const sql = postgres(connectionString, { max: 1 });

  try {
    // Check that both migration systems can see the database
    const dieselMigrations = await sql`
      SELECT COUNT(*) as count FROM public.__diesel_schema_migrations;
    `;

    // Drizzle table might not exist yet, so we check conditionally
    const drizzleTableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'drizzle' 
        AND table_name = '__drizzle_migrations'
      );
    `;

    expect(Number(dieselMigrations[0]?.count)).toBeGreaterThan(0);

    if (drizzleTableExists[0]?.exists) {
      const drizzleMigrations = await sql`
        SELECT COUNT(*) as count FROM drizzle.__drizzle_migrations;
      `;

      expect(Number(drizzleMigrations[0]?.count)).toBeGreaterThan(0);
      console.log(`✅ Diesel migrations: ${dieselMigrations[0]?.count}`);
      console.log(`✅ Drizzle migrations: ${drizzleMigrations[0]?.count}`);
    } else {
      console.log('⚠️  Drizzle migration table not found - baseline not yet established');
      console.log(`✅ Diesel migrations: ${dieselMigrations[0]?.count}`);
    }
  } finally {
    await sql.end();
  }
});

test('Can read from main tables using raw SQL', async () => {
  const sql = postgres(connectionString, { max: 1 });

  try {
    // Test that we can read from key tables
    const userCount = await sql`SELECT COUNT(*) as count FROM users;`;
    const orgCount = await sql`SELECT COUNT(*) as count FROM organizations;`;

    expect(Number(userCount[0]?.count)).toBeGreaterThanOrEqual(0);
    expect(Number(orgCount[0]?.count)).toBeGreaterThanOrEqual(0);

    console.log(`📊 Users: ${userCount[0]?.count}, Organizations: ${orgCount[0]?.count}`);
  } finally {
    await sql.end();
  }
});

test('Schema consistency check', async () => {
  const sql = postgres(connectionString, { max: 1 });

  try {
    // Check that key tables exist with expected structure
    const tableInfo = await sql`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'organizations', 'messages')
      ORDER BY table_name, ordinal_position;
    `;

    expect(tableInfo.length).toBeGreaterThan(0);

    // Check that we have the expected core tables
    const tableNames = [...new Set(tableInfo.map((row: any) => row.table_name))];
    expect(tableNames).toContain('users');
    expect(tableNames).toContain('organizations');
    expect(tableNames).toContain('messages');

    console.log(`📋 Found ${tableNames.length} core tables with ${tableInfo.length} total columns`);
  } finally {
    await sql.end();
  }
});
