import { tool } from 'ai';
import { z } from 'zod';
import { createWebSearchToolExecute } from './web-search-tool-execute';

export const WEB_SEARCH_TOOL_NAME = 'webSearch';

export const WebSearchToolInputSchema = z.object({
  query: z.string().min(1, 'Search query is required').describe('The search query to execute'),
  limit: z
    .number()
    .int()
    .min(1)
    .max(20)
    .optional()
    .describe('Maximum number of search results to return (default: 5)'),
  scrapeContent: z
    .boolean()
    .optional()
    .describe('Whether to scrape content from search results (default: true)'),
  formats: z
    .array(z.enum(['markdown', 'html', 'rawHtml', 'links', 'screenshot']))
    .optional()
    .describe('Content formats to scrape (default: ["markdown"])'),
});

const WebSearchToolOutputSchema = z.object({
  success: z.boolean().describe('Whether the search was successful'),
  results: z
    .array(
      z.object({
        title: z.string().describe('Title of the search result'),
        url: z.string().describe('URL of the search result'),
        description: z.string().describe('Description of the search result'),
        content: z.string().optional().describe('Scraped content from the result (if available)'),
      })
    )
    .describe('Array of search results'),
  error: z.string().optional().describe('Error message if the search failed'),
});

export type WebSearchToolInput = z.infer<typeof WebSearchToolInputSchema>;
export type WebSearchToolOutput = z.infer<typeof WebSearchToolOutputSchema>;

export function createWebSearchTool() {
  return tool({
    description:
      'Search the web for information using Firecrawl. Returns search results with titles, URLs, descriptions, and optionally scraped content. Useful for finding current information, research, and web content.',
    inputSchema: WebSearchToolInputSchema,
    outputSchema: WebSearchToolOutputSchema,
    execute: createWebSearchToolExecute(),
  });
}
