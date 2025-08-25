import axios, { type AxiosInstance } from 'axios';
import { getSecretSync } from '@buster/secrets';
import type { RerankConfig, RerankResponse, RerankResult } from './types';
import { RerankResponseSchema } from './types';

export class Reranker {
  private apiKey: string;
  private baseUrl: string;
  private model: string;
  private client: AxiosInstance;

  constructor(config?: Partial<RerankConfig>) {
    const getEnvValue = (key: string): string | undefined => {
      try {
        return getSecretSync(key);
      } catch {
        return undefined;
      }
    };

    const apiKey = config?.apiKey || getEnvValue('RERANK_API_KEY');
    const baseUrl = config?.baseUrl || getEnvValue('RERANK_BASE_URL');
    const model = config?.model || getEnvValue('RERANK_MODEL');

    if (!apiKey || apiKey === '') {
      throw new Error('RERANK_API_KEY is required');
    }
    if (!baseUrl || baseUrl === '') {
      throw new Error('RERANK_BASE_URL is required');
    }
    if (!model || model === '') {
      throw new Error('RERANK_MODEL is required');
    }

    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.model = model;
    this.client = axios.create({
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async rerank(query: string, documents: string[], topN?: number): Promise<RerankResult[]> {
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
          top_n: limitedTopN,
          model: this.model,
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
      console.error('Rerank failed:', error);
      return documents.map((_, index) => ({ index, relevance_score: 1.0 }));
    }
  }
}

export async function rerankResults(
  query: string,
  documents: string[],
  topN?: number,
  config?: Partial<RerankConfig>
): Promise<RerankResult[]> {
  const reranker = new Reranker(config);
  return reranker.rerank(query, documents, topN);
}
