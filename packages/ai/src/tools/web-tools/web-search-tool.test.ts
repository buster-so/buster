import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createWebSearchTool, type WebSearchToolOutput } from './web-search-tool';

const mockWebSearch = vi.fn();

vi.mock('@buster/web-tools', () => ({
  FirecrawlService: class {
    webSearch = mockWebSearch;
  },
}));

describe('webSearch tool', () => {
  let webSearchTool: ReturnType<typeof createWebSearchTool>;

  beforeEach(() => {
    vi.clearAllMocks();
    webSearchTool = createWebSearchTool();
  });

  it('should transform search results correctly', async () => {
    const mockResponse = {
      success: true,
      results: [
        {
          title: 'Test Result',
          url: 'https://example.com',
          description: 'Test description',
          content: 'Test content',
        },
      ],
    };

    mockWebSearch.mockResolvedValue(mockResponse);

    const result = (await webSearchTool.execute!(
      {
        query: 'test query',
        limit: 5,
        scrapeContent: true,
        formats: ['markdown'],
      },
      { toolCallId: 'test-tool-call', messages: [], abortSignal: new AbortController().signal }
    )) as WebSearchToolOutput;

    expect(result.success).toBe(true);
    expect(result.results).toHaveLength(1);
    expect(result.results[0]).toEqual({
      title: 'Test Result',
      url: 'https://example.com',
      description: 'Test description',
      content: 'Test content',
    });
  });

  it('should pass correct options to webSearch method', async () => {
    const mockResponse = {
      success: true,
      results: [],
    };

    mockWebSearch.mockResolvedValue(mockResponse);

    await webSearchTool.execute!(
      {
        query: 'test query',
        limit: 3,
        scrapeContent: true,
        formats: ['html', 'markdown'],
      },
      { toolCallId: 'test-tool-call', messages: [], abortSignal: new AbortController().signal }
    );

    expect(mockWebSearch).toHaveBeenCalledWith('test query', {
      limit: 3,
      scrapeOptions: {
        formats: ['html', 'markdown'],
      },
    });
  });

  it('should handle errors gracefully', async () => {
    mockWebSearch.mockRejectedValue(new Error('Search failed'));

    const result = (await webSearchTool.execute!(
      {
        query: 'test query',
      },
      { toolCallId: 'test-tool-call', messages: [], abortSignal: new AbortController().signal }
    )) as WebSearchToolOutput;

    expect(result.success).toBe(false);
    expect(result.results).toEqual([]);
    expect(result.error).toBe('Search failed');
  });

  it('should use default values when options are not provided', async () => {
    const mockResponse = {
      success: true,
      results: [],
    };

    mockWebSearch.mockResolvedValue(mockResponse);

    await webSearchTool.execute!(
      {
        query: 'test query',
      },
      { toolCallId: 'test-tool-call', messages: [], abortSignal: new AbortController().signal }
    );

    expect(mockWebSearch).toHaveBeenCalledWith('test query', {
      limit: 5,
      scrapeOptions: {
        formats: ['markdown'],
      },
    });
  });
});
