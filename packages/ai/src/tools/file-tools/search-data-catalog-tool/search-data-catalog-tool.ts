import type { RuntimeContext } from '@mastra/core/runtime-context';
import { createTool } from '@mastra/core/tools';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';
import { getPermissionedDatasets } from '../../../../../access-controls/src/access-controls';
import type { AnalystRuntimeContext } from '../../../agents/analyst-agent/analyst-agent';

interface SearchDataCatalogParams {
  specific_queries?: string[];
  exploratory_topics?: string[];
  value_search_terms?: string[];
  include_metadata?: boolean;
}

export const searchDataCatalogTool = createTool({
  id: 'search-data-catalog',
  description:
    'Search the data catalog for relevant datasets using semantic search and LLM filtering',
  inputSchema: z.object({
    specific_queries: z
      .array(z.string())
      .optional()
      .describe('Specific search queries targeting particular data assets'),
    exploratory_topics: z
      .array(z.string())
      .optional()
      .describe('Broader topics for discovering related datasets'),
    value_search_terms: z
      .array(z.string())
      .optional()
      .describe('Specific values to search for within dataset columns'),
    include_metadata: z.boolean().default(true).describe('Include dataset metadata in results'),
  }),
  outputSchema: z.object({
    message: z.string(),
    specific_queries: z.array(z.string()).optional(),
    exploratory_topics: z.array(z.string()).optional(),
    duration: z.number(),
    results: z.array(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        yml_content: z.string().optional(),
        relevance_score: z.number().optional(),
        match_type: z.enum(['specific', 'exploratory', 'value_match']).optional(),
      })
    ),
    data_source_id: z.string().optional(),
    total_datasets_searched: z.number(),
    value_matches_found: z.number(),
  }),
  execute: async ({ context, runtimeContext }) => {
    return await searchDataCatalog(context as SearchDataCatalogParams, runtimeContext);
  },
});

const searchDataCatalog = wrapTraced(
  async (
    params: SearchDataCatalogParams,
    runtimeContext: RuntimeContext<AnalystRuntimeContext>
  ) => {
    const startTime = Date.now();
    const { specific_queries = [], exploratory_topics = [], include_metadata = true } = params;

    const userId: string = runtimeContext.get('userId');

    if (!userId) {
      throw new Error('User ID not available in runtime context');
    }

    // Get permissioned datasets from database
    const datasets = await getPermissionedDatasets(userId, 0, 1000);

    if (datasets.length === 0) {
      return {
        message:
          'No datasets available to search. Have you deployed datasets? If you believe this is an error, please contact support.',
        duration: Date.now() - startTime,
        results: [],
        total_datasets_searched: 0,
        value_matches_found: 0,
        specific_queries,
        exploratory_topics,
      };
    }

    // Extract and cache data source ID
    const targetDataSourceId = datasets[0]?.dataSourceId;

    // Return all datasets with YAML content
    const results = datasets
      .filter((dataset) => dataset.ymlFile) // Only include datasets with YAML content
      .map((dataset) => ({
        id: dataset.id,
        name: include_metadata ? dataset.name : undefined,
        yml_content: include_metadata ? dataset.ymlFile || undefined : undefined,
        relevance_score: 1.0, // Set all to max relevance for now
        match_type: 'specific' as const,
      }));

    runtimeContext.set('searchedDataCatalog', true);

    return {
      message: `Found ${results.length} datasets with YAML content.`,
      specific_queries,
      exploratory_topics,
      duration: Date.now() - startTime,
      results,
      data_source_id: targetDataSourceId,
      total_datasets_searched: datasets.length,
      value_matches_found: 0,
    };
  },
  { name: 'search-data-catalog' }
);
