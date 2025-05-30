import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { Reranker, rerankResults } from '../rerank';
import type { RerankResult } from '../types';

vi.mock('axios');
const mockedAxios = vi.mocked(axios);

describe('Reranker - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedAxios.create.mockReturnValue({
      post: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Constructor', () => {
    it('should create instance with environment variables', () => {
      expect(() => new Reranker()).not.toThrow();
    });

    it('should create instance with custom config', () => {
      const config = {
        apiKey: 'custom-key',
        baseUrl: 'https://custom.api.com',
        model: 'custom-model',
      };
      expect(() => new Reranker(config)).not.toThrow();
    });

    it('should throw error if API key is missing', () => {
      const originalApiKey = process.env.RERANK_API_KEY;
      process.env.RERANK_API_KEY = '';

      expect(() => new Reranker()).toThrow('RERANK_API_KEY is required');

      process.env.RERANK_API_KEY = originalApiKey;
    });

    it('should throw error if base URL is missing', () => {
      const originalBaseUrl = process.env.RERANK_BASE_URL;
      process.env.RERANK_BASE_URL = '';

      expect(() => new Reranker()).toThrow('RERANK_BASE_URL is required');

      process.env.RERANK_BASE_URL = originalBaseUrl;
    });

    it('should throw error if model is missing', () => {
      const originalModel = process.env.RERANK_MODEL;
      process.env.RERANK_MODEL = '';

      expect(() => new Reranker()).toThrow('RERANK_MODEL is required');

      process.env.RERANK_MODEL = originalModel;
    });
  });

  describe('rerank method', () => {
    let reranker: Reranker;
    let mockPost: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      mockPost = vi.fn();
      mockedAxios.create.mockReturnValue({
        post: mockPost,
      });
      reranker = new Reranker();
    });

    it('should return equal scores for empty query', async () => {
      const documents = ['doc1', 'doc2', 'doc3'];
      const results = await reranker.rerank('', documents);

      expect(results).toHaveLength(documents.length);
      results.forEach((result, index) => {
        expect(result.index).toBe(index);
        expect(result.relevance_score).toBe(1.0);
      });
      expect(mockPost).not.toHaveBeenCalled();
    });

    it('should return empty array for empty documents', async () => {
      const results = await reranker.rerank('test query', []);

      expect(results).toEqual([]);
      expect(mockPost).not.toHaveBeenCalled();
    });

    it('should make API request with correct parameters', async () => {
      const query = 'What is the capital of France?';
      const documents = ['Paris info', 'London info', 'Berlin info'];
      const mockResponse: RerankResult[] = [
        { index: 0, relevance_score: 0.95 },
        { index: 2, relevance_score: 0.45 },
      ];

      mockPost.mockResolvedValueOnce({
        data: { results: mockResponse },
      });

      const results = await reranker.rerank(query, documents, 2);

      expect(mockPost).toHaveBeenCalledWith(
        process.env.RERANK_BASE_URL,
        {
          query,
          documents,
          top_n: 2,
          model: process.env.RERANK_MODEL,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.RERANK_API_KEY}`,
          },
        }
      );
      expect(results).toEqual(mockResponse);
    });

    it('should limit top_n to document count', async () => {
      const documents = ['doc1', 'doc2'];
      mockPost.mockResolvedValueOnce({
        data: { results: [] },
      });

      await reranker.rerank('query', documents, 5);

      expect(mockPost).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          top_n: 2,
        }),
        expect.any(Object)
      );
    });

    it('should use default top_n of 10 or document count', async () => {
      const documents = Array(15).fill('doc');
      mockPost.mockResolvedValueOnce({
        data: { results: [] },
      });

      await reranker.rerank('query', documents);

      expect(mockPost).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          top_n: 10,
        }),
        expect.any(Object)
      );
    });

    it('should handle API errors gracefully', async () => {
      const documents = ['doc1', 'doc2', 'doc3'];
      mockPost.mockRejectedValueOnce(new Error('API Error'));

      const results = await reranker.rerank('query', documents);

      expect(results).toHaveLength(documents.length);
      results.forEach((result, index) => {
        expect(result.index).toBe(index);
        expect(result.relevance_score).toBe(1.0);
      });
      expect(console.error).toHaveBeenCalledWith('Rerank failed:', expect.any(Error));
    });

    it('should handle network timeouts', async () => {
      const documents = ['doc1', 'doc2'];
      const timeoutError = new Error('timeout of 30000ms exceeded');
      timeoutError.name = 'AxiosError';
      mockPost.mockRejectedValueOnce(timeoutError);

      const results = await reranker.rerank('query', documents);

      expect(results).toHaveLength(documents.length);
      expect(console.error).toHaveBeenCalled();
    });

    it('should handle invalid API responses', async () => {
      const documents = ['doc1', 'doc2'];
      mockPost.mockResolvedValueOnce({
        data: { invalid: 'response' },
      });

      const results = await reranker.rerank('query', documents);

      expect(results).toHaveLength(documents.length);
      results.forEach((result, index) => {
        expect(result.index).toBe(index);
        expect(result.relevance_score).toBe(1.0);
      });
    });

    it('should validate response schema', async () => {
      const documents = ['doc1', 'doc2'];
      const invalidResponse = {
        results: [{ index: 'not-a-number', relevance_score: 0.5 }],
      };
      mockPost.mockResolvedValueOnce({
        data: invalidResponse,
      });

      const results = await reranker.rerank('query', documents);

      expect(results).toHaveLength(documents.length);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('rerankResults function', () => {
    it('should create reranker and call rerank method', async () => {
      const mockResults: RerankResult[] = [{ index: 0, relevance_score: 0.9 }];
      const mockPost = vi.fn().mockResolvedValueOnce({
        data: { results: mockResults },
      });
      mockedAxios.create.mockReturnValue({
        post: mockPost,
      });

      const results = await rerankResults('query', ['doc1']);

      expect(results).toEqual(mockResults);
    });

    it('should accept custom config', async () => {
      const config = {
        apiKey: 'custom-key',
        baseUrl: 'https://custom.api.com',
        model: 'custom-model',
      };
      const mockPost = vi.fn().mockResolvedValueOnce({
        data: { results: [] },
      });
      mockedAxios.create.mockReturnValue({
        post: mockPost,
      });

      await rerankResults('query', ['doc1'], 5, config);

      expect(mockPost).toHaveBeenCalledWith(
        config.baseUrl,
        expect.objectContaining({
          model: config.model,
        }),
        expect.objectContaining({
          headers: {
            Authorization: `Bearer ${config.apiKey}`,
          },
        })
      );
    });
  });
});
