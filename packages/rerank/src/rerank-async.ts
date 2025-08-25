import { getSecret } from '@buster/secrets';
import axios, { type AxiosInstance } from 'axios';
import type { RerankConfig, RerankResponse, RerankResult } from './types';
import { RerankResponseSchema } from './types';

export class AsyncReranker {
  private apiKey: string | undefined;
  private baseUrl: string | undefined;
  private model: string | undefined;
  private client: AxiosInstance | undefined;
  private initialized = false;

  constructor(private config?: Partial<RerankConfig>) {}

  private async initialize(): Promise<void> {
    if (this.initialized) return;

    // Try config first, then secrets
    this.apiKey = this.config?.apiKey || (await getSecret('RERANK_API_KEY').catch(() => undefined));
    this.baseUrl = this.config?.baseUrl || (await getSecret('RERANK_BASE_URL').catch(() => undefined));
    this.model = this.config?.model || (await getSecret('RERANK_MODEL').catch(() => undefined));

    if (!this.apiKey || this.apiKey === '') {
      throw new Error('RERANK_API_KEY is required');
    }
    if (!this.baseUrl || this.baseUrl === '') {
      throw new Error('RERANK_BASE_URL is required');
    }
    if (!this.model || this.model === '') {
      throw new Error('RERANK_MODEL is required');
    }

    this.client = axios.create({
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.initialized = true;
  }

  async rerank(query: string, documents: string[], topN?: number): Promise<RerankResult[]> {
    await this.initialize();

    if (!this.client || !this.apiKey || !this.baseUrl || !this.model) {
      throw new Error('Reranker not initialized');
    }

    try {
      if (!query || documents.length === 0) {
        return documents.map((_, index) => ({ index, relevance_score: 1.0 }));
      }

      const actualTopN = topN || Math.min(10, documents.length);
      const limitedTopN = Math.min(actualTopN, documents.length);

      const response = await this.client.post<RerankResponse>(
        this.baseUrl,
        {
          query,
          documents,
          model: this.model,
          top_n: limitedTopN,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );

      const validatedResponse = RerankResponseSchema.parse(response.data);
      return validatedResponse.results;
    } catch (error) {
      console.error('Rerank error:', error);
      // Fallback: return all documents with equal scores
      return documents.map((_, index) => ({ index, relevance_score: 1.0 }));
    }
  }
}

// Factory function for easier instantiation
export async function createReranker(config?: Partial<RerankConfig>): Promise<AsyncReranker> {
  const reranker = new AsyncReranker(config);
  // Pre-initialize to validate config early
  await reranker['initialize']();
  return reranker;
}