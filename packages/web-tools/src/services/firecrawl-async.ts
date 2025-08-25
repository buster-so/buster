import FirecrawlApp from '@mendable/firecrawl-js';
import { getSecret } from '@buster/secrets';
import { CompanyResearchError } from '../deep-research/types';
import type { 
  FirecrawlConfig,
  WebSearchOptions,
  WebSearchResult,
  WebSearchResponse 
} from './firecrawl';

interface FirecrawlResponse {
  id?: string;
  data?: {
    id?: string;
  };
  jobId?: string;
}

export class AsyncFirecrawlService {
  private app: FirecrawlApp | null = null;
  private initialized = false;

  constructor(private config?: FirecrawlConfig) {}

  private async initialize(): Promise<void> {
    if (this.initialized) return;

    const apiKey = this.config?.apiKey || await getSecret('FIRECRAWL_API_KEY').catch(() => undefined);

    if (!apiKey) {
      throw new CompanyResearchError(
        'Firecrawl API key is required. Set FIRECRAWL_API_KEY environment variable or pass it in config.',
        'API_ERROR'
      );
    }

    this.app = new FirecrawlApp({
      apiKey,
      ...(this.config?.apiUrl && { apiUrl: this.config.apiUrl }),
    });

    this.initialized = true;
  }

  /**
   * Start a deep research job using Firecrawl's native method
   */
  async startDeepResearch(
    query: string,
    options?: {
      systemPrompt?: string;
      analysisPrompt?: string;
    }
  ): Promise<string> {
    await this.initialize();
    if (!this.app) throw new Error('Firecrawl not initialized');

    const params: any = {};
    if (options?.systemPrompt) params.systemPrompt = options.systemPrompt;
    if (options?.analysisPrompt) params.analysisPrompt = options.analysisPrompt;
    
    const response = await this.app.deepResearch(query, params) as FirecrawlResponse;

    const jobId = response?.id || response?.data?.id || response?.jobId;
    if (!jobId) {
      throw new CompanyResearchError('Failed to start deep research job', 'API_ERROR');
    }

    return jobId;
  }

  /**
   * Poll the status of a deep research job
   */
  async pollDeepResearch(jobId: string): Promise<any> {
    await this.initialize();
    if (!this.app) throw new Error('Firecrawl not initialized');

    const maxAttempts = 60;
    const pollInterval = 5000;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const response = await (this.app as unknown as { checkDeepResearchStatus: (id: string) => Promise<unknown> }).checkDeepResearchStatus(jobId) as any;

      if (response?.status === 'completed' || response?.data?.status === 'completed') {
        return response?.data || response;
      }

      if (response?.status === 'failed' || response?.data?.status === 'failed') {
        throw new CompanyResearchError(
          response?.data?.error || response?.error || 'Deep research job failed',
          'API_ERROR'
        );
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    throw new CompanyResearchError('Deep research job timed out', 'API_ERROR');
  }

  /**
   * Scrape a single URL
   */
  async scrapeUrl(
    url: string,
    options?: {
      formats?: ('markdown' | 'html' | 'rawHtml' | 'links' | 'screenshot')[];
      onlyMainContent?: boolean;
    }
  ): Promise<any> {
    await this.initialize();
    if (!this.app) throw new Error('Firecrawl not initialized');

    const response = await this.app.scrapeUrl(url, {
      formats: options?.formats || ['markdown'],
      onlyMainContent: options?.onlyMainContent !== false,
    }) as any;

    if (!response?.success) {
      throw new CompanyResearchError(
        `Failed to scrape URL: ${response?.error || 'Unknown error'}`,
        'API_ERROR'
      );
    }

    return response.data;
  }

  /**
   * Search the web using Firecrawl
   */
  async searchWeb(query: string, options?: WebSearchOptions): Promise<WebSearchResponse> {
    await this.initialize();
    if (!this.app) throw new Error('Firecrawl not initialized');

    try {
      const response = await this.app.search(query, {
        limit: options?.limit || 5,
        ...(options?.location && { location: options.location }),
        ...(options?.tbs && { tbs: options.tbs }),
        ...(options?.timeout && { timeout: options.timeout }),
        scrapeOptions: options?.scrapeOptions || {
          formats: ['markdown'],
          onlyMainContent: true,
        },
      }) as any;

      if (!response?.success) {
        throw new CompanyResearchError(
          `Web search failed: ${response?.error || 'Unknown error'}`,
          'API_ERROR'
        );
      }

      const results: WebSearchResult[] = (response.results || response.data || []).map((result: any) => ({
        title: result.title || '',
        url: result.url || '',
        description: result.description || '',
        content: result.markdown || result.content || '',
      }));

      return {
        success: true,
        results,
      };
    } catch (error: any) {
      return {
        success: false,
        results: [],
        error: error.message || 'Web search failed',
      };
    }
  }
}

// Factory function for easier instantiation
export async function createFirecrawlService(config?: FirecrawlConfig): Promise<AsyncFirecrawlService> {
  const service = new AsyncFirecrawlService(config);
  await service['initialize']();
  return service;
}