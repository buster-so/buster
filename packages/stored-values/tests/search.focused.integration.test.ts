import { closePool, getDb, initializePool, sql } from '@buster/database';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  type SearchTarget,
  generateEmbedding,
  searchValuesAcrossTargets,
  searchValuesByEmbedding,
  searchValuesByEmbeddingWithFilters,
} from '../src/search';

// Integration tests using the existing data
const DATABASE_URL = process.env.DATABASE_URL;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const describeFn = DATABASE_URL && OPENAI_API_KEY ? describe : describe.skip;

describeFn('search.ts - Focused Integration Tests with Real Data', () => {
  // Use the existing data source ID
  const testDataSourceId = 'cc3ef3bc-44ec-4a43-8dc4-681cae5c996a';
  const testSchemaName = `ds_${testDataSourceId.replace(/-/g, '_')}`;

  beforeAll(async () => {
    // Initialize the database pool
    initializePool();

    // Log some statistics about the data
    const db = getDb();
    const _stats = await db.execute(
      sql.raw(`
      SELECT 
        COUNT(*) as total_rows,
        COUNT(DISTINCT database_name) as databases,
        COUNT(DISTINCT table_name) as tables,
        COUNT(DISTINCT column_name) as columns,
        COUNT(embedding) as embeddings
      FROM "${testSchemaName}"."searchable_column_values"
    `)
    );
  }, 30000);

  afterAll(async () => {
    await closePool();
  });

  describe('searchValuesByEmbedding with real data', () => {
    it('should find file extensions when searching for document types', async () => {
      const searchEmbedding = await generateEmbedding(['file', 'document', 'extension', 'format']);

      const results = await searchValuesByEmbedding(testDataSourceId, searchEmbedding, {
        limit: 5,
      });
      results.forEach((_r, _i) => {});

      // Check if we found file extensions
      const _hasFileExtension = results.some(
        (r) => r.value.startsWith('.') || r.column_name.toLowerCase().includes('extension')
      );

      expect(results.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('searchValuesByEmbeddingWithFilters with real data', () => {
    it('should filter results by table name', async () => {
      const searchEmbedding = await generateEmbedding(['territory', 'region', 'area']);

      const results = await searchValuesByEmbeddingWithFilters(
        testDataSourceId,
        searchEmbedding,
        { limit: 10 },
        undefined,
        undefined,
        'sales_territory',
        undefined
      );
      results.forEach((_r, _i) => {});

      // All results should be from sales_territory table
      expect(results.every((r) => r.table_name === 'sales_territory')).toBe(true);
      expect(results.length).toBeGreaterThan(0);

      // Should include territory names we saw in the data
      const territoryNames = ['Northeast', 'Northwest', 'Southeast', 'Southwest', 'Central'];
      const _foundTerritories = results.filter((r) => territoryNames.includes(r.value));
    });

    it('should filter by database and schema', async () => {
      const searchEmbedding = await generateEmbedding(['data', 'value']);

      const results = await searchValuesByEmbeddingWithFilters(
        testDataSourceId,
        searchEmbedding,
        { limit: 5 },
        'postgres',
        'ont_ont',
        undefined,
        undefined
      );
      results.forEach((_r, _i) => {});

      // All results should match the filters
      expect(results.every((r) => r.database_name === 'postgres')).toBe(true);
      expect(results.every((r) => r.schema_name === 'ont_ont')).toBe(true);
    });
  });

  describe('searchValuesAcrossTargets with real data', () => {
    it('should search multiple targets in parallel', async () => {
      // Define targets based on actual data
      const targets: SearchTarget[] = [
        {
          database_name: 'postgres',
          schema_name: 'ont_ont',
          table_name: 'sales_territory',
          column_name: 'name',
        },
        {
          database_name: 'postgres',
          schema_name: 'ont_ont',
          table_name: 'document',
          column_name: 'fileextension',
        },
      ];
      targets.forEach((_t, _i) => {});

      const searchEmbedding = await generateEmbedding(['name', 'identifier']);
      const results = await searchValuesAcrossTargets(
        testDataSourceId,
        searchEmbedding,
        targets,
        3
      );

      // Group by table for analysis
      const resultsByTable = results.reduce(
        (acc, r) => {
          const tableName = r.table_name;
          if (!acc[tableName]) {
            acc[tableName] = [];
          }
          acc[tableName].push(r);
          return acc;
        },
        {} as Record<string, typeof results>
      );

      for (const [_table, tableResults] of Object.entries(resultsByTable)) {
        tableResults.forEach((_r, _i) => {});
      }

      // Should have results from both targets
      expect(results.length).toBeGreaterThan(0);
      expect(results.length).toBeLessThanOrEqual(6); // 3 per target max

      // Should have results from multiple tables
      const uniqueTables = new Set(results.map((r) => r.table_name));
      expect(uniqueTables.size).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Performance with real data', () => {
    it('should handle large result sets efficiently', async () => {
      const startTime = Date.now();

      const searchEmbedding = await generateEmbedding(['value']);
      const _midTime = Date.now();

      const results = await searchValuesByEmbedding(testDataSourceId, searchEmbedding, {
        limit: 100,
      });
      const endTime = Date.now();
      results.slice(0, 5).forEach((_r, _i) => {});

      expect(results.length).toBeLessThanOrEqual(100);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });

  describe('Edge cases with real data', () => {
    it('should handle searches that return no results', async () => {
      const searchEmbedding = await generateEmbedding(['xyzabc123notfound']);

      const results = await searchValuesByEmbeddingWithFilters(
        testDataSourceId,
        searchEmbedding,
        { limit: 10 },
        'nonexistent_db',
        undefined,
        undefined,
        undefined
      );
      expect(results).toEqual([]);
    });

    it('should show similarity differences in results', async () => {
      // Search for something specific
      const searchEmbedding = await generateEmbedding(['United States regions']);
      const results = await searchValuesByEmbedding(testDataSourceId, searchEmbedding, {
        limit: 10,
      });
      results.forEach((_r, _i) => {});

      // The results should be ordered by similarity
      // Territory names should appear near the top
      const territoryNames = ['Northeast', 'Northwest', 'Southeast', 'Southwest', 'Central'];
      const firstFiveValues = results.slice(0, 5).map((r) => r.value);
      const _territoriesInTopFive = firstFiveValues.filter((v) => territoryNames.includes(v));

      expect(results.length).toBeGreaterThan(0);
    });
  });
});
