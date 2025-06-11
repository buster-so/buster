import { closePool, getDb, initializePool, sql } from '@buster/database';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  type SearchTarget,
  generateEmbedding,
  searchValuesAcrossTargets,
  searchValuesByEmbedding,
  searchValuesByEmbeddingWithFilters,
} from '../src/search';

// Integration tests require a real database connection
// These tests will be skipped if DATABASE_URL is not set
const DATABASE_URL = process.env.DATABASE_URL;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const describeFn = DATABASE_URL && OPENAI_API_KEY ? describe : describe.skip;

describeFn('search.ts - Integration Tests', () => {
  // Use the existing data source ID and schema
  const testDataSourceId = 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a';
  const testSchemaName = 'ds_cc3ef3bc_44ec_4a43_8dc4_681cae5c996a';
  let testEmbedding: number[];
  // biome-ignore lint/suspicious/noExplicitAny: i am lazy right now
  let existingData: any[] = [];

  beforeAll(async () => {
    // Initialize the database pool
    initializePool();

    // Generate a real embedding for testing
    testEmbedding = await generateEmbedding(['test search query']);

    // Check what data exists in the table
    const db = getDb();

    try {
      const result = await db.execute(
        sql.raw(`
          SELECT value, database_name, schema_name, table_name, column_name
          FROM "${testSchemaName}"."searchable_column_values"
          LIMIT 10
        `)
      );

      console.log(result);
      existingData = Array.from(result) || [];
      console.log(`Found ${existingData.length} existing records for testing`);
    } catch (error) {
      console.error('Error checking existing data:', error);
      existingData = []; // Ensure it's always an array
    }
  }, 60000); // 60 second timeout for setup

  afterAll(async () => {
    // Just close the pool, don't drop anything
    await closePool();
  });

  describe('searchValuesByEmbedding', () => {
    it('should find values by semantic similarity', async () => {
      const searchQuery = 'email address';

      const searchEmbedding = await generateEmbedding([searchQuery]);
      const results = await searchValuesByEmbedding(testDataSourceId, searchEmbedding, {
        limit: 3,
      });

      expect(results).toBeDefined();
      expect(results.length).toBeLessThanOrEqual(3);

      // If we have existing data, we should get results
      if (existingData.length > 0) {
        expect(results.length).toBeGreaterThan(0);

        // Log the similarity scores if available
        results.forEach((_result, _index) => {});
      }
    }, 30000);

    it('should respect limit parameter', async () => {
      const limit = 2;

      const results = await searchValuesByEmbedding(testDataSourceId, testEmbedding, { limit });

      if (existingData.length >= limit) {
        expect(results).toHaveLength(limit);
      } else {
        expect(results.length).toBeLessThanOrEqual(limit);
      }
    });

    it('should handle non-existent schema gracefully', async () => {
      const fakeDataSourceId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

      await expect(
        searchValuesByEmbedding(fakeDataSourceId, testEmbedding, { limit: 10 })
      ).rejects.toThrow();
    });
  });

  describe('searchValuesByEmbeddingWithFilters', () => {
    it('should filter by database name', async () => {
      // First, let's see what database names exist
      const uniqueDatabases = [...new Set(existingData.map((d) => d.database_name))];

      if (uniqueDatabases.length > 0) {
        const testDatabase = uniqueDatabases[0];

        const results = await searchValuesByEmbeddingWithFilters(
          testDataSourceId,
          testEmbedding,
          { limit: 10 },
          testDatabase
        );

        expect(results.every((r) => r.database_name === testDatabase)).toBe(true);
      } else {
      }
    });

    it('should filter by table and column', async () => {
      // Find a valid table/column combination from existing data
      if (existingData.length > 0) {
        const testItem = existingData[0];

        const results = await searchValuesByEmbeddingWithFilters(
          testDataSourceId,
          testEmbedding,
          { limit: 10 },
          undefined,
          undefined,
          testItem.table_name,
          testItem.column_name
        );

        expect(results.every((r) => r.table_name === testItem.table_name)).toBe(true);
        expect(results.every((r) => r.column_name === testItem.column_name)).toBe(true);
      } else {
      }
    });

    it('should return empty array when filters match no data', async () => {
      // Skip if the schema doesn't exist
      if (existingData.length === 0) {
        console.log('Skipping test - no existing data/schema found');
        return;
      }

      const nonExistentDb = 'non_existent_db_12345';

      const results = await searchValuesByEmbeddingWithFilters(
        testDataSourceId,
        testEmbedding,
        { limit: 10 },
        nonExistentDb
      );
      expect(results).toEqual([]);
    });

    it('should combine multiple filters correctly', async () => {
      if (existingData.length > 0) {
        const testItem = existingData[0];

        const results = await searchValuesByEmbeddingWithFilters(
          testDataSourceId,
          testEmbedding,
          { limit: 10 },
          testItem.database_name,
          testItem.schema_name,
          testItem.table_name,
          testItem.column_name
        );

        if (results.length > 0) {
          expect(
            results.every(
              (r) =>
                r.database_name === testItem.database_name &&
                r.schema_name === testItem.schema_name &&
                r.table_name === testItem.table_name &&
                r.column_name === testItem.column_name
            )
          ).toBe(true);
        }
      } else {
      }
    });
  });

  describe('searchValuesAcrossTargets', () => {
    it('should search multiple targets and combine results', async () => {
      // Build targets from existing data
      const targets: SearchTarget[] = [];

      if (existingData.length >= 2) {
        // Use first two different items as targets
        targets.push({
          database_name: existingData[0].database_name,
          schema_name: existingData[0].schema_name,
          table_name: existingData[0].table_name,
          column_name: existingData[0].column_name,
        });

        // Try to find a different table/column combination
        const differentItem = existingData.find(
          (item) =>
            item.table_name !== existingData[0].table_name ||
            item.column_name !== existingData[0].column_name
        );

        if (differentItem) {
          targets.push({
            database_name: differentItem.database_name,
            schema_name: differentItem.schema_name,
            table_name: differentItem.table_name,
            column_name: differentItem.column_name,
          });
        }
      }

      if (targets.length > 0) {
        const results = await searchValuesAcrossTargets(
          testDataSourceId,
          testEmbedding,
          targets,
          5
        );

        expect(results.length).toBeGreaterThan(0);

        // Check if we got results matching our targets
        for (const target of targets) {
          const _matchingResults = results.filter(
            (r) => r.table_name === target.table_name && r.column_name === target.column_name
          );
        }
      } else {
      }
    });

    it('should handle mixed valid and invalid targets', async () => {
      if (existingData.length > 0) {
        const validTarget = {
          database_name: existingData[0].database_name,
          schema_name: existingData[0].schema_name,
          table_name: existingData[0].table_name,
          column_name: existingData[0].column_name,
        };

        const targets: SearchTarget[] = [
          validTarget,
          {
            database_name: 'invalid_db',
            schema_name: 'invalid_schema',
            table_name: 'invalid_table',
            column_name: 'invalid_column',
          },
        ];

        const results = await searchValuesAcrossTargets(
          testDataSourceId,
          testEmbedding,
          targets,
          5
        );

        // Should still get results from valid target
        expect(results.length).toBeGreaterThan(0);
        expect(
          results.every(
            (r) =>
              r.database_name === validTarget.database_name &&
              r.table_name === validTarget.table_name &&
              r.column_name === validTarget.column_name
          )
        ).toBe(true);
      } else {
      }
    });
  });

  describe('generateEmbedding', () => {
    it('should generate valid embeddings', async () => {
      const embedding = await generateEmbedding(['test query']);

      expect(embedding).toBeDefined();
      expect(Array.isArray(embedding)).toBe(true);
      expect(embedding.length).toBe(1536); // text-embedding-3-small dimension
      expect(embedding.every((val) => typeof val === 'number')).toBe(true);
    }, 30000);

    it('should generate different embeddings for different inputs', async () => {
      const embedding1 = await generateEmbedding(['hello world']);
      const embedding2 = await generateEmbedding(['goodbye universe']);

      expect(embedding1).not.toEqual(embedding2);
    }, 30000);

    it('should generate similar embeddings for same input', async () => {
      const embedding1 = await generateEmbedding(['consistent test']);
      const embedding2 = await generateEmbedding(['consistent test']);

      // OpenAI embeddings are not deterministic, but should be very similar
      // Check that they have the same length and are reasonably close
      expect(embedding1).toHaveLength(1536);
      expect(embedding2).toHaveLength(1536);

      // Calculate cosine similarity to verify they're very similar
      const dotProduct = embedding1.reduce((sum, a, i) => sum + a * (embedding2[i] ?? 0), 0);
      const magnitude1 = Math.sqrt(embedding1.reduce((sum, a) => sum + a * a, 0));
      const magnitude2 = Math.sqrt(embedding2.reduce((sum, a) => sum + a * a, 0));
      const similarity = dotProduct / (magnitude1 * magnitude2);

      // Should be highly similar (> 0.99) for the same input
      expect(similarity).toBeGreaterThan(0.99);
    }, 30000);
  });

  describe('Performance Tests', () => {
    it('should handle large result sets efficiently', async () => {
      const startTime = Date.now();

      const results = await searchValuesByEmbedding(testDataSourceId, testEmbedding, { limit: 50 });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      expect(results.length).toBeLessThanOrEqual(50);
    });

    it('should execute parallel searches efficiently', async () => {
      if (existingData.length > 0) {
        // Create targets based on existing data
        const targets: SearchTarget[] = existingData.slice(0, 5).map((item) => ({
          database_name: item.database_name,
          schema_name: item.schema_name,
          table_name: item.table_name,
          column_name: item.column_name,
        }));
        const startTime = Date.now();

        const results = await searchValuesAcrossTargets(
          testDataSourceId,
          testEmbedding,
          targets,
          10
        );

        const endTime = Date.now();
        const duration = endTime - startTime;

        // Parallel execution should be faster than sequential
        expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
        expect(results).toBeDefined();
      } else {
      }
    });
  });
});
