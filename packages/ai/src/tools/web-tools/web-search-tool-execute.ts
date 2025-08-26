import { WEB_TOOLS_KEYS, getSecret } from '@buster/secrets';
import { FirecrawlService, type WebSearchOptions, type WebSearchResult } from '@buster/web-tools';
import { wrapTraced } from 'braintrust';
import type { WebSearchToolInput, WebSearchToolOutput } from './web-search-tool';

export function createWebSearchToolExecute() {
  return wrapTraced(
    async (input: WebSearchToolInput): Promise<WebSearchToolOutput> => {
      try {
        const apiKey = await getSecret(WEB_TOOLS_KEYS.FIRECRAWL_API_KEY);
        const firecrawlService = new FirecrawlService(apiKey);

        const searchOptions: WebSearchOptions = {
          limit: input.limit || 5,
          ...(input.scrapeContent !== false && {
            scrapeOptions: {
              formats: input.formats || ['markdown'],
            },
          }),
        };

        const response = await firecrawlService.webSearch(input.query, searchOptions);

        const transformedResults = response.results.map((result: WebSearchResult) => ({
          title: result.title,
          url: result.url,
          description: result.description,
          ...(result.content && { content: result.content }),
        }));

        return {
          success: response.success,
          results: transformedResults,
        };
      } catch (error) {
        return {
          success: false,
          results: [],
          error: error instanceof Error ? error.message : 'Unknown error occurred',
        };
      }
    },
    { name: 'web-search-tool-execute' }
  );
}
