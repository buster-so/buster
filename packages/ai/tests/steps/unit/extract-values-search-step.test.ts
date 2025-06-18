import { RuntimeContext } from '@mastra/core/runtime-context';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { extractValuesSearchStep } from '../../../src/steps/extract-values-search-step';
import type { AnalystRuntimeContext } from '../../../src/workflows/analyst-workflow';

// Mock the stored-values package
vi.mock('@buster/stored-values/search', () => ({
  generateEmbedding: vi.fn(),
  searchValuesByEmbedding: vi.fn(),
}));

// Mock the AI models
vi.mock('../../../src/utils/models/anthropic-cached', () => ({
  anthropicCachedModel: vi.fn(() => 'mock-model'),
}));

// Mock Braintrust
vi.mock('braintrust', () => ({
  wrapTraced: vi.fn((fn) => fn),
}));

describe('extractValuesSearchStep', () => {
  const mockGenerateEmbedding = vi.fn();
  const mockSearchValuesByEmbedding = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mocks
    const { generateEmbedding, searchValuesByEmbedding } = require('@buster/stored-values/search');
    mockGenerateEmbedding.mockImplementation(generateEmbedding);
    mockSearchValuesByEmbedding.mockImplementation(searchValuesByEmbedding);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('keyword extraction', () => {
    it('should extract keywords from user prompt', async () => {
      const inputData = {
        prompt: 'Show me sales for Red Bull in California',
        conversationHistory: [],
      };

      const runtimeContext = new RuntimeContext<AnalystRuntimeContext>();
      runtimeContext.set('dataSourceId', 'test-datasource-id');

      // Mock the LLM response for keyword extraction
      const mockAgentGenerate = vi.fn().mockResolvedValue({
        object: { values: ['Red Bull', 'California'] },
      });

      // Mock the values agent
      vi.doMock('../../../src/steps/extract-values-search-step', async () => {
        const actual = await vi.importActual('../../../src/steps/extract-values-search-step');
        return {
          ...actual,
          valuesAgent: { generate: mockAgentGenerate },
        };
      });

      mockGenerateEmbedding.mockResolvedValue([1, 2, 3]);
      mockSearchValuesByEmbedding.mockResolvedValue([]);

      const result = await extractValuesSearchStep.execute({
        inputData,
        runtimeContext,
        getInitData: async () => inputData,
      } as any);

      expect(result.values).toEqual(['Red Bull', 'California']);
      expect(result.searchPerformed).toBe(true);
    });

    it('should handle empty keyword extraction', async () => {
      const inputData = {
        prompt: 'Show me last month revenue',
        conversationHistory: [],
      };

      const runtimeContext = new RuntimeContext<AnalystRuntimeContext>();
      runtimeContext.set('dataSourceId', 'test-datasource-id');

      const result = await extractValuesSearchStep.execute({
        inputData,
        runtimeContext,
        getInitData: async () => inputData,
      } as any);

      // Should still run even with no keywords
      expect(Array.isArray(result.values)).toBe(true);
      expect(typeof result.searchPerformed).toBe('boolean');
    });
  });

  describe('stored values search', () => {
    it('should skip search when no dataSourceId is provided', async () => {
      const inputData = {
        prompt: 'Test prompt',
        conversationHistory: [],
      };

      const runtimeContext = new RuntimeContext<AnalystRuntimeContext>();
      // No dataSourceId set

      const result = await extractValuesSearchStep.execute({
        inputData,
        runtimeContext,
        getInitData: async () => inputData,
      } as any);

      expect(result.searchPerformed).toBe(false);
      expect(result.searchResults).toBe('');
      expect(result.foundValues).toEqual({});
    });

    it('should skip search when no keywords are extracted', async () => {
      const inputData = {
        prompt: 'Test prompt',
        conversationHistory: [],
      };

      const runtimeContext = new RuntimeContext<AnalystRuntimeContext>();
      runtimeContext.set('dataSourceId', 'test-datasource-id');

      // Mock empty keyword extraction
      const mockAgentGenerate = vi.fn().mockResolvedValue({
        object: { values: [] },
      });

      const result = await extractValuesSearchStep.execute({
        inputData,
        runtimeContext,
        getInitData: async () => inputData,
      } as any);

      expect(result.values).toEqual([]);
      expect(result.searchPerformed).toBe(false);
    });

    it('should format search results correctly', async () => {
      const mockSearchResults = [
        {
          id: '1',
          value: 'Red Bull Energy',
          schema_name: 'public',
          table_name: 'products',
          column_name: 'name',
          database_name: 'retail',
          synced_at: new Date(),
        },
        {
          id: '2',
          value: 'Red Bull Sugar Free',
          schema_name: 'public',
          table_name: 'products',
          column_name: 'name',
          database_name: 'retail',
          synced_at: new Date(),
        },
        {
          id: '3',
          value: 'Los Angeles',
          schema_name: 'public',
          table_name: 'stores',
          column_name: 'city',
          database_name: 'retail',
          synced_at: new Date(),
        },
      ];

      const inputData = {
        prompt: 'Show me sales for Red Bull',
        conversationHistory: [],
      };

      const runtimeContext = new RuntimeContext<AnalystRuntimeContext>();
      runtimeContext.set('dataSourceId', 'test-datasource-id');

      // Mock successful search
      mockGenerateEmbedding.mockResolvedValue([1, 2, 3]);
      mockSearchValuesByEmbedding.mockResolvedValue(mockSearchResults);

      const result = await extractValuesSearchStep.execute({
        inputData,
        runtimeContext,
        getInitData: async () => inputData,
      } as any);

      expect(result.searchPerformed).toBe(true);
      expect(result.searchResults).toContain('public.products');
      expect(result.searchResults).toContain('name [Red Bull Energy, Red Bull Sugar Free]');
      expect(result.searchResults).toContain('public.stores');
      expect(result.searchResults).toContain('city [Los Angeles]');
    });

    it('should handle embedding generation errors gracefully', async () => {
      const inputData = {
        prompt: 'Test prompt',
        conversationHistory: [],
      };

      const runtimeContext = new RuntimeContext<AnalystRuntimeContext>();
      runtimeContext.set('dataSourceId', 'test-datasource-id');

      // Mock LLM extraction success but embedding failure
      const mockAgentGenerate = vi.fn().mockResolvedValue({
        object: { values: ['test keyword'] },
      });

      mockGenerateEmbedding.mockRejectedValue(new Error('Embedding service unavailable'));

      const result = await extractValuesSearchStep.execute({
        inputData,
        runtimeContext,
        getInitData: async () => inputData,
      } as any);

      // Should not break the workflow
      expect(result.searchPerformed).toBe(false);
      expect(result.searchResults).toBe('');
      expect(result.foundValues).toEqual({});
    });

    it('should handle database search errors gracefully', async () => {
      const inputData = {
        prompt: 'Test prompt',
        conversationHistory: [],
      };

      const runtimeContext = new RuntimeContext<AnalystRuntimeContext>();
      runtimeContext.set('dataSourceId', 'test-datasource-id');

      // Mock successful embedding but database failure
      mockGenerateEmbedding.mockResolvedValue([1, 2, 3]);
      mockSearchValuesByEmbedding.mockRejectedValue(new Error('Database connection failed'));

      const result = await extractValuesSearchStep.execute({
        inputData,
        runtimeContext,
        getInitData: async () => inputData,
      } as any);

      // Should not break the workflow
      expect(result.searchPerformed).toBe(true); // We attempted the search
      expect(result.searchResults).toBe(''); // But got no results due to error
      expect(result.foundValues).toEqual({});
    });

    it('should handle mixed success/failure in concurrent searches', async () => {
      const inputData = {
        prompt: 'Test prompt',
        conversationHistory: [],
      };

      const runtimeContext = new RuntimeContext<AnalystRuntimeContext>();
      runtimeContext.set('dataSourceId', 'test-datasource-id');

      // Mock two keywords: one succeeds, one fails
      const mockAgentGenerate = vi.fn().mockResolvedValue({
        object: { values: ['keyword1', 'keyword2'] },
      });

      mockGenerateEmbedding
        .mockResolvedValueOnce([1, 2, 3]) // First embedding succeeds
        .mockRejectedValueOnce(new Error('Second embedding fails')); // Second fails

      mockSearchValuesByEmbedding.mockResolvedValue([
        {
          id: '1',
          value: 'test value',
          schema_name: 'public',
          table_name: 'test',
          column_name: 'name',
          database_name: 'test',
          synced_at: new Date(),
        },
      ]);

      const result = await extractValuesSearchStep.execute({
        inputData,
        runtimeContext,
        getInitData: async () => inputData,
      } as any);

      // Should succeed with partial results
      expect(result.searchPerformed).toBe(true);
      expect(result.searchResults).toContain('test value');
    });
  });

  describe('error handling', () => {
    it('should never throw errors even with complete failure', async () => {
      const inputData = {
        prompt: 'Test prompt',
        conversationHistory: [],
      };

      const runtimeContext = new RuntimeContext<AnalystRuntimeContext>();
      runtimeContext.set('dataSourceId', 'test-datasource-id');

      // Mock everything to fail
      const mockAgentGenerate = vi.fn().mockRejectedValue(new Error('LLM failure'));
      mockGenerateEmbedding.mockRejectedValue(new Error('Embedding failure'));
      mockSearchValuesByEmbedding.mockRejectedValue(new Error('Database failure'));

      // Should not throw
      const result = await extractValuesSearchStep.execute({
        inputData,
        runtimeContext,
        getInitData: async () => inputData,
      } as any);

      expect(result).toBeDefined();
      expect(result.values).toEqual([]);
      expect(result.searchPerformed).toBe(false);
      expect(result.searchResults).toBe('');
      expect(result.foundValues).toEqual({});
    });
  });

  describe('result formatting', () => {
    it('should deduplicate values within the same column', async () => {
      const mockSearchResults = [
        {
          id: '1',
          value: 'Red Bull',
          schema_name: 'public',
          table_name: 'products',
          column_name: 'name',
          database_name: 'retail',
          synced_at: new Date(),
        },
        {
          id: '2',
          value: 'Red Bull', // Duplicate
          schema_name: 'public',
          table_name: 'products',
          column_name: 'name',
          database_name: 'retail',
          synced_at: new Date(),
        },
      ];

      mockGenerateEmbedding.mockResolvedValue([1, 2, 3]);
      mockSearchValuesByEmbedding.mockResolvedValue(mockSearchResults);

      const inputData = {
        prompt: 'Test prompt',
        conversationHistory: [],
      };

      const runtimeContext = new RuntimeContext<AnalystRuntimeContext>();
      runtimeContext.set('dataSourceId', 'test-datasource-id');

      const result = await extractValuesSearchStep.execute({
        inputData,
        runtimeContext,
        getInitData: async () => inputData,
      } as any);

      // Should only show "Red Bull" once
      expect(result.foundValues['public.products']?.name).toEqual(['Red Bull']);
      expect(result.searchResults).toContain('name [Red Bull]');
      expect(result.searchResults).not.toContain('Red Bull, Red Bull');
    });

    it('should organize results by schema.table.column structure', async () => {
      const mockSearchResults = [
        {
          id: '1',
          value: 'Product A',
          schema_name: 'sales',
          table_name: 'products',
          column_name: 'name',
          database_name: 'retail',
          synced_at: new Date(),
        },
        {
          id: '2',
          value: 'Category B',
          schema_name: 'sales',
          table_name: 'products',
          column_name: 'category',
          database_name: 'retail',
          synced_at: new Date(),
        },
        {
          id: '3',
          value: 'Store C',
          schema_name: 'inventory',
          table_name: 'locations',
          column_name: 'store_name',
          database_name: 'retail',
          synced_at: new Date(),
        },
      ];

      mockGenerateEmbedding.mockResolvedValue([1, 2, 3]);
      mockSearchValuesByEmbedding.mockResolvedValue(mockSearchResults);

      const inputData = {
        prompt: 'Test prompt',
        conversationHistory: [],
      };

      const runtimeContext = new RuntimeContext<AnalystRuntimeContext>();
      runtimeContext.set('dataSourceId', 'test-datasource-id');

      const result = await extractValuesSearchStep.execute({
        inputData,
        runtimeContext,
        getInitData: async () => inputData,
      } as any);

      expect(result.foundValues).toEqual({
        'sales.products': {
          name: ['Product A'],
          category: ['Category B'],
        },
        'inventory.locations': {
          store_name: ['Store C'],
        },
      });

      expect(result.searchResults).toContain('sales.products');
      expect(result.searchResults).toContain('inventory.locations');
    });
  });
});
