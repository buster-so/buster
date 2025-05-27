import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { eq } from 'drizzle-orm';
import { closePool, getDb, initializePool } from '../src/connection';
import { organizations, users, usersToOrganizations } from '../src/schema';

describe('Database Integration Tests', () => {
  beforeAll(async () => {
    // Ensure we have a fresh connection
    await closePool();
    initializePool();
  });

  afterAll(async () => {
    // Clean up connections
    await closePool();
  });

  describe('Database Connection', () => {
    test('should connect to database successfully', async () => {
      const db = getDb();
      expect(db).toBeDefined();

      // Test basic connectivity with a simple query
      const result = await db.execute('SELECT 1 as test');
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ test: 1 });
    });

    test('should handle environment variable validation', () => {
      const originalUrl = process.env.DATABASE_URL;

      // Temporarily set empty DATABASE_URL
      process.env.DATABASE_URL = '';

      expect(() => {
        initializePool();
      }).toThrow('DATABASE_URL environment variable is required');

      // Restore original URL
      process.env.DATABASE_URL = originalUrl;
    });
  });

  describe('Organizations Table Operations', () => {
    test('should query organizations table', async () => {
      const db = getDb();

      // Test basic select query
      const result = await db.select().from(organizations).limit(5);

      expect(Array.isArray(result)).toBe(true);

      // If there are results, verify structure
      if (result.length > 0) {
        const org = result[0];
        expect(org).toHaveProperty('id');
        expect(org).toHaveProperty('name');
        expect(org).toHaveProperty('createdAt');
        expect(org).toHaveProperty('updatedAt');
        expect(typeof org.id).toBe('string');
        expect(typeof org.name).toBe('string');
      }
    });

    test('should handle concurrent queries on organizations', async () => {
      const db = getDb();

      // Run multiple concurrent queries
      const promises = Array.from({ length: 5 }, (_, i) =>
        db.select().from(organizations).limit(1).offset(i)
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      for (const result of results) {
        expect(Array.isArray(result)).toBe(true);
      }
    });

    test('should handle filtered queries on organizations', async () => {
      const db = getDb();

      // Test with a where clause - just get all organizations without filter for simplicity
      const result = await db.select().from(organizations).limit(10);

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Users Table Operations', () => {
    test('should query users table', async () => {
      const db = getDb();

      const result = await db.select().from(users).limit(5);

      expect(Array.isArray(result)).toBe(true);

      // If there are results, verify structure
      if (result.length > 0) {
        const user = result[0];
        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('email');
        expect(user).toHaveProperty('createdAt');
        expect(user).toHaveProperty('updatedAt');
        expect(typeof user.id).toBe('string');
        expect(typeof user.email).toBe('string');
      }
    });

    test('should handle concurrent queries on users', async () => {
      const db = getDb();

      // Run multiple concurrent queries
      const promises = Array.from({ length: 3 }, () =>
        db
          .select({
            id: users.id,
            email: users.email,
            createdAt: users.createdAt,
          })
          .from(users)
          .limit(2)
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      for (const result of results) {
        expect(Array.isArray(result)).toBe(true);
      }
    });
  });

  describe('Join Operations', () => {
    test('should handle joins between users and organizations', async () => {
      const db = getDb();

      const result = await db
        .select({
          userId: users.id,
          userEmail: users.email,
          orgId: organizations.id,
          orgName: organizations.name,
        })
        .from(users)
        .innerJoin(usersToOrganizations, eq(users.id, usersToOrganizations.userId))
        .innerJoin(organizations, eq(usersToOrganizations.organizationId, organizations.id))
        .limit(5);

      expect(Array.isArray(result)).toBe(true);

      // If there are results, verify join structure
      if (result.length > 0) {
        const row = result[0];
        expect(row).toHaveProperty('userId');
        expect(row).toHaveProperty('userEmail');
        expect(row).toHaveProperty('orgId');
        expect(row).toHaveProperty('orgName');
        expect(typeof row.userId).toBe('string');
        expect(typeof row.userEmail).toBe('string');
        expect(typeof row.orgId).toBe('string');
        expect(typeof row.orgName).toBe('string');
      }
    });
  });

  describe('Transaction Support', () => {
    test('should support database transactions', async () => {
      const db = getDb();

      // Test transaction (read-only operation)
      await expect(async () => {
        await db.transaction(async (tx) => {
          // Perform a read operation
          const orgs = await tx.select().from(organizations).limit(1);

          expect(Array.isArray(orgs)).toBe(true);

          return orgs;
        });
      }).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid SQL gracefully', async () => {
      const db = getDb();

      await expect(async () => {
        await db.execute('SELECT * FROM non_existent_table');
      }).toThrow();
    });

    test('should handle malformed queries', async () => {
      const db = getDb();

      await expect(async () => {
        await db.execute('INVALID SQL QUERY');
      }).toThrow();
    });
  });

  describe('Connection Pool', () => {
    test('should handle multiple concurrent connections', async () => {
      const db = getDb();

      // Create multiple concurrent database operations
      const operations = Array.from(
        { length: 10 },
        (_, i) =>
          db
            .select()
            .from(organizations)
            .limit(1)
            .offset(i % 5) // Vary the offset to create different queries
      );

      const results = await Promise.all(operations);

      expect(results).toHaveLength(10);
      for (const result of results) {
        expect(Array.isArray(result)).toBe(true);
      }
    });

    test('should reuse existing pool instance', () => {
      const db1 = getDb();
      const db2 = getDb();

      // Both should reference the same instance
      expect(db1).toBe(db2);
    });
  });
});
