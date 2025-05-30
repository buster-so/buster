import { describe, it, expect, beforeAll } from 'vitest';
import { config } from 'dotenv';
import { Reranker, rerankResults } from '../rerank';
import type { RerankResult } from '../types';

// Load environment variables
config();

describe('Reranker - Integration Tests', () => {
  const isIntegrationTest =
    process.env.RERANK_API_KEY &&
    process.env.RERANK_API_KEY !== 'test-api-key' &&
    process.env.CI !== 'true';

  beforeAll(() => {
    if (!isIntegrationTest) {
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
      results.forEach((result) => {
        expect(result.index).toBeGreaterThanOrEqual(0);
        expect(result.index).toBeLessThan(documents.length);
        expect(result.relevance_score).toBeGreaterThanOrEqual(0);
        expect(result.relevance_score).toBeLessThanOrEqual(1);
      });

      // Check that results are sorted by relevance score (descending)
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].relevance_score).toBeGreaterThanOrEqual(results[i].relevance_score);
      }

      // Verify that Paris-related documents rank higher
      const topResultDoc = documents[results[0].index];
      expect(topResultDoc.toLowerCase()).toContain('paris');

      // Log results for manual verification
      console.log('Query:', query);
      console.log('Top results:');
      results.forEach((result, idx) => {
        console.log(
          `${idx + 1}. [Score: ${result.relevance_score.toFixed(4)}] ${documents[result.index]}`
        );
      });
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
          expectedKeywords: ['database', 'sql', 'normalization', 'primary'],
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
          expectedKeywords: ['neural', 'random forest', 'gradient'],
        },
      ];

      for (const testCase of testCases) {
        const results = await reranker.rerank(testCase.query, testCase.documents, 3);

        expect(results).toHaveLength(3);

        // Check that at least one of the top results contains expected keywords
        const topDocs = results.map((r) => testCase.documents[r.index].toLowerCase());
        const hasRelevantResult = topDocs.some((doc) =>
          testCase.expectedKeywords.some((keyword) => doc.includes(keyword))
        );
        expect(hasRelevantResult).toBe(true);
      }
    });

    it.skipIf(!isIntegrationTest)('should handle edge cases', async () => {
      const reranker = new Reranker();

      // Single document
      const singleDocResult = await reranker.rerank('test', ['single document']);
      expect(singleDocResult).toHaveLength(1);
      expect(singleDocResult[0].index).toBe(0);

      // Large number of documents (should limit to top_n)
      const manyDocs = Array(50)
        .fill(0)
        .map((_, i) => `Document ${i}`);
      const manyDocsResult = await reranker.rerank('test query', manyDocs, 5);
      expect(manyDocsResult).toHaveLength(5);

      // Unicode and special characters
      const unicodeDocs = [
        'Café ☕ in París 🇫🇷',
        'Tokyo 東京 is the capital of Japan',
        'Москва is the capital of Russia',
      ];
      const unicodeResult = await reranker.rerank('coffee shop', unicodeDocs, 2);
      expect(unicodeResult).toHaveLength(2);
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
      expect(results[0].relevance_score).toBeGreaterThan(0);

      // TypeScript-related documents should rank higher
      const topDoc = documents[results[0].index].toLowerCase();
      expect(topDoc).toMatch(/typescript|type/);
    });
  });

  describe('Error Handling with Real API', () => {
    it.skipIf(!isIntegrationTest)('should handle invalid API key gracefully', async () => {
      const reranker = new Reranker({
        apiKey: 'invalid-api-key',
        baseUrl: process.env.RERANK_BASE_URL!,
        model: process.env.RERANK_MODEL!,
      });

      const documents = ['doc1', 'doc2'];
      const results = await reranker.rerank('test', documents);

      // Should fallback to equal scores
      expect(results).toHaveLength(2);
      expect(results[0].relevance_score).toBe(1.0);
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
      results.forEach((result) => {
        expect(result).toHaveLength(3);
        expect(result[0]).toHaveProperty('index');
        expect(result[0]).toHaveProperty('relevance_score');
      });
    });
  });
});
