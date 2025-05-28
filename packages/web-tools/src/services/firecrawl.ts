import FirecrawlApp from '@mendable/firecrawl-js';
import { CompanyResearchError } from '../deep-research/types.js';

export interface FirecrawlConfig {
  apiKey?: string;
  apiUrl?: string;
}

interface FirecrawlResponse {
  id?: string;
  data?: {
    id?: string;
  };
  jobId?: string;
}

interface Source {
  url: string;
  title: string;
  description: string;
}

interface JobStatusResponse {
  status?: string;
  data?: {
    status?: string;
    currentStep?: string;
    totalSteps?: number;
    progress?: number;
    finalAnalysis?: string;
    sources?: Source[];
    error?: string;
  };
  error?: string;
}

interface ScrapeResponse {
  success: boolean;
  data?: {
    markdown?: string;
    html?: string;
    rawHtml?: string;
    links?: string[];
    screenshot?: string;
  };
  error?: string;
}

export class FirecrawlService {
  private app: FirecrawlApp;

  constructor(config?: FirecrawlConfig) {
    const apiKey = config?.apiKey || process.env.FIRECRAWL_API_KEY;

    if (!apiKey) {
      throw new CompanyResearchError(
        'Firecrawl API key is required. Set FIRECRAWL_API_KEY environment variable or pass it in config.',
        'API_ERROR'
      );
    }

    this.app = new FirecrawlApp({
      apiKey,
      apiUrl: config?.apiUrl,
    });
  }

  /**
   * Start a deep research job using Firecrawl's native method
   */
  async startDeepResearch(
    query: string,
    options?: {
      maxDepth?: number;
      timeLimit?: number;
      maxUrls?: number;
    }
  ): Promise<string | JobStatusResponse> {
    try {
      // Use the SDK's native deep research method
      const response = await this.app.deepResearch(query, {
        maxDepth: options?.maxDepth || 5,
        timeLimit: options?.timeLimit || 180, // 3 minutes default
        maxUrls: options?.maxUrls || 10,
        systemPrompt:
          'This shouldnt be marketing material, it should be almost like a training doc that describes the company to a new hire or consultant.',
      });

      const firecrawlResponse = response as FirecrawlResponse & JobStatusResponse;

      // Check if this is an immediate result (has finalAnalysis)
      if (firecrawlResponse.data?.finalAnalysis || firecrawlResponse.status === 'completed') {
        // Return the complete response for immediate processing
        return firecrawlResponse as JobStatusResponse;
      }

      // Extract job ID for polling-based responses
      const jobId =
        firecrawlResponse?.id || firecrawlResponse?.data?.id || firecrawlResponse?.jobId;

      if (!jobId) {
        throw new CompanyResearchError(
          'Failed to start deep research job - no job ID returned and no immediate results',
          'API_ERROR',
          response
        );
      }

      return jobId;
    } catch (error) {
      throw new CompanyResearchError(
        `Failed to start deep research job: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'API_ERROR',
        error instanceof Error ? error : String(error)
      );
    }
  }

  /**
   * Check the status of a deep research job using Firecrawl's native method
   */
  async getJobStatus(jobId: string): Promise<JobStatusResponse> {
    try {
      // Use the SDK's native status check method
      const response = await (
        this.app as unknown as { checkDeepResearchStatus: (id: string) => Promise<unknown> }
      ).checkDeepResearchStatus(jobId);
      return response as JobStatusResponse;
    } catch (error) {
      throw new CompanyResearchError(
        `Failed to get job status: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'API_ERROR',
        error instanceof Error ? error : String(error)
      );
    }
  }

  /**
   * Scrape a single URL using Firecrawl's native method
   */
  async scrapeUrl(
    url: string,
    options?: {
      formats?: ('markdown' | 'html' | 'rawHtml' | 'links' | 'screenshot')[];
      onlyMainContent?: boolean;
    }
  ): Promise<ScrapeResponse> {
    try {
      const response = await this.app.scrapeUrl(url, {
        formats: options?.formats || ['markdown'],
        onlyMainContent: options?.onlyMainContent ?? true,
      });

      return response as ScrapeResponse;
    } catch (error) {
      throw new CompanyResearchError(
        `Failed to scrape URL: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'API_ERROR',
        error instanceof Error ? error : String(error)
      );
    }
  }

  /**
   * Validate that a URL is accessible and scrapeable
   */
  async validateUrl(url: string): Promise<boolean> {
    try {
      await this.scrapeUrl(url, { formats: ['markdown'], onlyMainContent: true });
      return true;
    } catch {
      return false;
    }
  }
}
