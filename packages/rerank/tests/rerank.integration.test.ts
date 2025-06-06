import { config } from 'dotenv';
import { beforeAll, describe, expect, it } from 'vitest';
import { Reranker, rerankResults } from '../src/index';
import type { RerankResult } from '../src/types';

// Load environment variables
config();

describe('Reranker - Integration Tests', () => {
  const isIntegrationTest =
    process.env.RERANK_API_KEY &&
    process.env.RERANK_API_KEY !== 'test-api-key' &&
    process.env.CI !== 'true';

  beforeAll(() => {
    if (!isIntegrationTest) {
      // Use console for test output in beforeAll
      // eslint-disable-next-line no-console
      console.log('Skipping integration tests - real API credentials not available');
    }
  });

  describe('Real API Integration', () => {
    it.skipIf(!isIntegrationTest)('should rerank documents with real API', async () => {
      const reranker = new Reranker();

      const query = 'What is the capital of France?';
      const documents = [
        'Paris is a major European city and a global center for art, fashion, gastronomy and culture.',
        'London is the capital and largest city of England and the United Kingdom.',
        'The Eiffel Tower is a wrought-iron lattice tower on the Champ de Mars in Paris, France.',
        'Berlin is the capital and largest city of Germany by both area and population.',
        'France is a country in Western Europe with Paris as its capital city.',
      ];
      const topN = 3;

      const results: RerankResult[] = await reranker.rerank(query, documents, topN);

      // Basic assertions
      expect(results).toHaveLength(topN);
      expect(results).toBeInstanceOf(Array);

      // Check that indices are valid
      for (const result of results) {
        expect(result.index).toBeGreaterThanOrEqual(0);
        expect(result.index).toBeLessThan(documents.length);
        expect(result.relevance_score).toBeGreaterThanOrEqual(0);
        expect(result.relevance_score).toBeLessThanOrEqual(1);
      }

      // Check that results are sorted by relevance score (descending)
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].relevance_score).toBeGreaterThanOrEqual(results[i].relevance_score);
      }

      // Based on actual API response, verify specific rankings
      // Document at index 4 ("France is a country...") should rank first
      expect(results[0].index).toBe(4);
      expect(results[0].relevance_score).toBeGreaterThan(0.8);

      // Document at index 0 ("Paris is a major...") should rank second
      expect(results[1].index).toBe(0);
      expect(results[1].relevance_score).toBeGreaterThan(0.4);
      expect(results[1].relevance_score).toBeLessThan(0.5);

      // Document at index 2 ("The Eiffel Tower...") should rank third
      expect(results[2].index).toBe(2);
      expect(results[2].relevance_score).toBeGreaterThan(0.2);
      expect(results[2].relevance_score).toBeLessThan(0.3);

      // Verify that all top results mention Paris
      for (const result of results) {
        const doc = documents[result.index];
        expect(doc.toLowerCase()).toContain('paris');
      }
    });

    it.skipIf(!isIntegrationTest)('should handle different query types', async () => {
      const reranker = new Reranker();

      const testCases = [
        {
          query: 'database schema design best practices',
          documents: [
            'Normalization is a key principle in database design',
            'The weather today is sunny and warm',
            'SQL indexes improve query performance',
            'Primary keys ensure data integrity',
            'Chocolate cake recipe with strawberries',
          ],
          expectedTopIndices: [0, 2, 3], // Database-related documents should rank higher
          minTopScore: 0.1, // Top result should have meaningful relevance
        },
        {
          query: 'machine learning algorithms',
          documents: [
            'Neural networks are inspired by biological neurons',
            'Pizza delivery in 30 minutes or less',
            'Random forests combine multiple decision trees',
            'Gradient descent optimizes model parameters',
            'The stock market closed higher today',
          ],
          expectedTopIndices: [0, 2, 3], // ML-related documents should rank higher
          minTopScore: 0.1,
        },
      ];

      for (const testCase of testCases) {
        const results = await reranker.rerank(testCase.query, testCase.documents, 3);

        expect(results).toHaveLength(3);

        // Verify that top results are from expected indices
        const topIndices = results.map((r) => r.index);
        const hasExpectedDocs = testCase.expectedTopIndices.every((idx) =>
          topIndices.includes(idx)
        );
        expect(hasExpectedDocs).toBe(true);

        // Top result should have high relevance score
        expect(results[0].relevance_score).toBeGreaterThan(testCase.minTopScore);

        // Results should be sorted by relevance
        for (let i = 1; i < results.length; i++) {
          expect(results[i - 1].relevance_score).toBeGreaterThanOrEqual(results[i].relevance_score);
        }
      }
    });

    it.skipIf(!isIntegrationTest)('should handle edge cases', async () => {
      const reranker = new Reranker();

      // Single document
      const singleDocResult = await reranker.rerank('test', ['single document']);
      expect(singleDocResult).toHaveLength(1);
      expect(singleDocResult[0].index).toBe(0);
      expect(singleDocResult[0].relevance_score).toBeGreaterThan(0);

      // Large number of documents (should limit to top_n)
      const manyDocs = Array(50)
        .fill(0)
        .map((_, i) => `Document ${i}`);
      const manyDocsResult = await reranker.rerank('test query', manyDocs, 5);
      expect(manyDocsResult).toHaveLength(5);

      // Verify all results have valid scores
      for (const result of manyDocsResult) {
        expect(result.relevance_score).toBeGreaterThan(0);
        expect(result.relevance_score).toBeLessThanOrEqual(1);
      }

      // Unicode and special characters
      const unicodeDocs = [
        'Café ☕ in París 🇫🇷',
        'Tokyo 東京 is the capital of Japan',
        'Москва is the capital of Russia',
      ];
      const unicodeResult = await reranker.rerank('coffee shop', unicodeDocs, 2);
      expect(unicodeResult).toHaveLength(2);

      // First result should contain "Café" as it's most relevant to "coffee shop"
      expect(unicodeDocs[unicodeResult[0].index]).toContain('Café');
      expect(unicodeResult[0].relevance_score).toBeGreaterThan(0.1);
    });

    it.skipIf(!isIntegrationTest)('should use rerankResults helper function', async () => {
      const query = 'TypeScript programming';
      const documents = [
        'TypeScript adds static typing to JavaScript',
        'Python is a dynamically typed language',
        'JavaScript is the language of the web',
        'Type safety helps catch bugs at compile time',
      ];

      const results = await rerankResults(query, documents, 2);

      expect(results).toHaveLength(2);

      // First result should be the TypeScript document (index 0)
      expect(results[0].index).toBe(0);
      expect(results[0].relevance_score).toBeGreaterThan(0.3);

      // Second result should be JavaScript or type safety document (index 2 or 3)
      expect([2, 3]).toContain(results[1].index);
      expect(results[1].relevance_score).toBeGreaterThan(0.1);

      // Both top results should be TypeScript-related
      const topDoc = documents[results[0].index].toLowerCase();
      expect(topDoc).toContain('typescript');
    });
  });

  describe('Error Handling with Real API', () => {
    it.skipIf(!isIntegrationTest)('should handle invalid API key gracefully', async () => {
      const baseUrl = process.env.RERANK_BASE_URL;
      const model = process.env.RERANK_MODEL;

      if (!baseUrl || !model) {
        throw new Error('Missing required environment variables');
      }

      const reranker = new Reranker({
        apiKey: 'invalid-api-key',
        baseUrl,
        model,
      });

      const documents = ['doc1', 'doc2'];
      const results = await reranker.rerank('test', documents);

      // Should fallback to equal scores
      expect(results).toHaveLength(2);
      expect(results[0].index).toBe(0);
      expect(results[0].relevance_score).toBe(1.0);
      expect(results[1].index).toBe(1);
      expect(results[1].relevance_score).toBe(1.0);
    });

    it.skipIf(!isIntegrationTest)('should handle rate limiting', async () => {
      const reranker = new Reranker();
      const documents = ['doc1', 'doc2', 'doc3'];

      // Make multiple rapid requests to potentially trigger rate limiting
      const promises = Array(5)
        .fill(0)
        .map(() => reranker.rerank('test query', documents));

      const results = await Promise.all(promises);

      // All should return results (either from API or fallback)
      for (const result of results) {
        expect(result).toHaveLength(3);
        expect(result[0]).toHaveProperty('index');
        expect(result[0]).toHaveProperty('relevance_score');

        // Each result should have valid indices
        for (const item of result) {
          expect(item.index).toBeGreaterThanOrEqual(0);
          expect(item.index).toBeLessThan(documents.length);
          expect(item.relevance_score).toBeGreaterThan(0);
          expect(item.relevance_score).toBeLessThanOrEqual(1);
        }
      }
    });
  });
});
