import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CompanyResearchError } from '../deep-research/types.js';
import { FirecrawlService } from './firecrawl.js';

interface MockFirecrawlApp {
  deepResearch: ReturnType<typeof vi.fn>;
  checkDeepResearchStatus: ReturnType<typeof vi.fn>;
  scrapeUrl: ReturnType<typeof vi.fn>;
  search: ReturnType<typeof vi.fn>;
}

// Mock the FirecrawlApp
vi.mock('@mendable/firecrawl-js', () => {
  return {
    default: vi.fn(function (this: MockFirecrawlApp) {
      this.deepResearch = vi.fn();
      this.checkDeepResearchStatus = vi.fn();
      this.scrapeUrl = vi.fn();
      this.search = vi.fn();
      return this;
    }),
  };
});

describe('FirecrawlService', () => {
  let service: FirecrawlService;

  beforeEach(() => {
    vi.clearAllMocks();
    // Set API key for tests
    process.env.FIRECRAWL_API_KEY = 'test-api-key';
  });

  it('should create service with API key from environment', () => {
    service = new FirecrawlService();
    expect(service).toBeInstanceOf(FirecrawlService);
  });

  it('should create service with API key from config', () => {
    service = new FirecrawlService({ apiKey: 'custom-api-key' });
    expect(service).toBeInstanceOf(FirecrawlService);
  });

  describe('startDeepResearch', () => {
    beforeEach(() => {
      service = new FirecrawlService();
    });

    it('should start deep research with default options', async () => {
      const mockResponse = { id: 'job-123' };
      const mockApp = (service as unknown as { app: MockFirecrawlApp }).app;
      mockApp.deepResearch.mockResolvedValue(mockResponse);

      const jobId = await service.startDeepResearch('test query');

      expect(jobId).toBe('job-123');
      expect(mockApp.deepResearch).toHaveBeenCalledWith('test query', {});
    });

    it('should start deep research with custom options', async () => {
      const mockResponse = { data: { id: 'job-456' } };
      const mockApp = (service as unknown as { app: MockFirecrawlApp }).app;
      mockApp.deepResearch.mockResolvedValue(mockResponse);

      const jobId = await service.startDeepResearch('test query', {
        systemPrompt: 'Custom system prompt',
        analysisPrompt: 'Custom analysis prompt',
      });

      expect(jobId).toBe('job-456');
      expect(mockApp.deepResearch).toHaveBeenCalledWith('test query', {
        systemPrompt: 'Custom system prompt',
        analysisPrompt: 'Custom analysis prompt',
      });
    });

    it('should throw error when no job ID is returned', async () => {
      const mockResponse = {};
      const mockApp = (service as unknown as { app: MockFirecrawlApp }).app;
      mockApp.deepResearch.mockResolvedValue(mockResponse);

      await expect(service.startDeepResearch('test query')).rejects.toThrow(CompanyResearchError);
    });

    it('should handle API errors', async () => {
      const mockApp = (service as unknown as { app: MockFirecrawlApp }).app;
      mockApp.deepResearch.mockRejectedValue(new Error('API Error'));

      await expect(service.startDeepResearch('test query')).rejects.toThrow(CompanyResearchError);
    });
  });

  describe('getJobStatus', () => {
    beforeEach(() => {
      service = new FirecrawlService();
    });

    it('should get job status', async () => {
      const mockResponse = { status: 'completed', data: { result: 'test' } };
      const mockApp = (service as unknown as { app: MockFirecrawlApp }).app;
      mockApp.checkDeepResearchStatus.mockResolvedValue(mockResponse);

      const status = await service.getJobStatus('job-123');

      expect(status).toEqual(mockResponse);
      expect(mockApp.checkDeepResearchStatus).toHaveBeenCalledWith('job-123');
    });

    it('should handle status check errors', async () => {
      const mockApp = (service as unknown as { app: MockFirecrawlApp }).app;
      mockApp.checkDeepResearchStatus.mockRejectedValue(new Error('Network Error'));

      await expect(service.getJobStatus('job-123')).rejects.toThrow(CompanyResearchError);
    });
  });

  describe('scrapeUrl', () => {
    beforeEach(() => {
      service = new FirecrawlService();
    });

    it('should scrape URL with default options', async () => {
      const mockResponse = { data: 'scraped content' };
      const mockApp = (service as unknown as { app: MockFirecrawlApp }).app;
      mockApp.scrapeUrl.mockResolvedValue(mockResponse);

      const result = await service.scrapeUrl('https://example.com');

      expect(result).toEqual(mockResponse);
      expect(mockApp.scrapeUrl).toHaveBeenCalledWith('https://example.com', {
        formats: ['markdown'],
        onlyMainContent: true,
      });
    });

    it('should scrape URL with custom options', async () => {
      const mockResponse = { data: 'scraped content' };
      const mockApp = (service as unknown as { app: MockFirecrawlApp }).app;
      mockApp.scrapeUrl.mockResolvedValue(mockResponse);

      const result = await service.scrapeUrl('https://example.com', {
        formats: ['html', 'markdown'],
        onlyMainContent: false,
      });

      expect(result).toEqual(mockResponse);
      expect(mockApp.scrapeUrl).toHaveBeenCalledWith('https://example.com', {
        formats: ['html', 'markdown'],
        onlyMainContent: false,
      });
    });

    it('should handle scraping errors', async () => {
      const mockApp = (service as unknown as { app: MockFirecrawlApp }).app;
      mockApp.scrapeUrl.mockRejectedValue(new Error('Scraping failed'));

      await expect(service.scrapeUrl('https://example.com')).rejects.toThrow(CompanyResearchError);
    });
  });

  describe('validateUrl', () => {
    beforeEach(() => {
      service = new FirecrawlService();
    });

    it('should return true for valid accessible URL', async () => {
      const mockApp = (service as unknown as { app: MockFirecrawlApp }).app;
      mockApp.scrapeUrl.mockResolvedValue({ data: 'content' });

      const isValid = await service.validateUrl('https://example.com');

      expect(isValid).toBe(true);
    });

    it('should return false for inaccessible URL', async () => {
      const mockApp = (service as unknown as { app: MockFirecrawlApp }).app;
      mockApp.scrapeUrl.mockRejectedValue(new Error('Not accessible'));

      const isValid = await service.validateUrl('https://invalid.com');

      expect(isValid).toBe(false);
    });
  });

  describe('webSearch', () => {
    beforeEach(() => {
      service = new FirecrawlService();
    });

    it('should perform web search with default options', async () => {
      const mockResponse = {
        success: true,
        data: [
          {
            title: 'Test Result',
            url: 'https://example.com',
            description: 'Test description',
            content: 'Test content',
          },
        ],
      };
      const mockApp = (service as unknown as { app: MockFirecrawlApp }).app;
      mockApp.search.mockResolvedValue(mockResponse);

      const result = await service.webSearch('test query');

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(1);
      expect(result.results[0]).toEqual({
        title: 'Test Result',
        url: 'https://example.com',
        description: 'Test description',
        content: 'Test content',
      });
      expect(mockApp.search).toHaveBeenCalledWith('test query', {
        limit: 5,
        scrapeOptions: {
          formats: ['markdown'],
        },
      });
    });

    it('should perform web search with content scraping options', async () => {
      const mockResponse = {
        success: true,
        data: [
          {
            title: 'Test Result',
            url: 'https://example.com',
            description: 'Test description',
            content: 'Test content',
          },
        ],
      };
      const mockApp = (service as unknown as { app: MockFirecrawlApp }).app;
      mockApp.search.mockResolvedValue(mockResponse);

      const result = await service.webSearch('test query', {
        limit: 3,
        location: 'US',
        scrapeOptions: {
          formats: ['html', 'markdown'],
          onlyMainContent: false,
        },
      });

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(1);
      expect(mockApp.search).toHaveBeenCalledWith('test query', {
        limit: 3,
        location: 'US',
        scrapeOptions: {
          formats: ['html', 'markdown'],
          onlyMainContent: false,
        },
      });
    });

    it('should handle search errors', async () => {
      const mockApp = (service as unknown as { app: MockFirecrawlApp }).app;
      mockApp.search.mockRejectedValue(new Error('Search failed'));

      await expect(service.webSearch('test query')).rejects.toThrow(CompanyResearchError);
    });
  });
});
