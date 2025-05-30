import { createTool } from '@mastra/core/tools';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

interface SearchDataCatalogParams {
  specific_queries?: string[];
  exploratory_topics?: string[];
  value_search_terms?: string[];
}

interface PermissionedDataset {
  id: string;
  name?: string;
  yml_content?: string;
  data_source_id?: string;
}

interface FoundValueInfo {
  value: string;
  database_name: string;
  schema_name: string;
  table_name: string;
  column_name: string;
}

export const searchDataCatalogTool = createTool({
  id: 'search-data-catalog',
  description: 'Search the data catalog for relevant datasets using semantic search and LLM filtering',
  inputSchema: z.object({
    specific_queries: z.array(z.string()).optional()
      .describe('Specific search queries targeting particular data assets'),
    exploratory_topics: z.array(z.string()).optional()
      .describe('Broader topics for discovering related datasets'),
    value_search_terms: z.array(z.string()).optional()
      .describe('Specific values to search for within dataset columns'),
    max_results: z.number().default(10).describe('Maximum number of results to return'),
    include_metadata: z.boolean().default(true).describe('Include dataset metadata in results')
  }),
  outputSchema: z.object({
    message: z.string(),
    specific_queries: z.array(z.string()).optional(),
    exploratory_topics: z.array(z.string()).optional(),
    duration: z.number(),
    results: z.array(z.object({
      id: z.string(),
      name: z.string().optional(),
      yml_content: z.string().optional(),
      relevance_score: z.number().optional(),
      match_type: z.enum(['specific', 'exploratory', 'value_match']).optional()
    })),
    data_source_id: z.string().optional(),
    total_datasets_searched: z.number(),
    value_matches_found: z.number()
  }),
  execute: async ({ context }) => {
    return await searchDataCatalog(context as SearchDataCatalogParams);
  },
});

const searchDataCatalog = wrapTraced(
  async (params: SearchDataCatalogParams) => {
    const startTime = Date.now();
    const {
      specific_queries = [],
      exploratory_topics = [],
      value_search_terms = [],
      max_results = 10,
      include_metadata = true
    } = params;
    
    // Simulate getting permissioned datasets (in real implementation, this would query the database)
    const datasets = await getPermissionedDatasets();
    
    if (datasets.length === 0) {
      return {
        message: "No datasets available to search",
        duration: Date.now() - startTime,
        results: [],
        total_datasets_searched: 0,
        value_matches_found: 0,
        specific_queries,
        exploratory_topics
      };
    }
    
    // Perform searches in parallel
    const [specificResults, exploratoryResults, valueResults] = await Promise.all([
      searchSpecificQueries(specific_queries, datasets),
      searchExploratoryTopics(exploratory_topics, datasets),
      searchValues(value_search_terms, datasets)
    ]);
    
    // Combine and rank results
    const combinedResults = combineAndRankResults(
      specificResults,
      exploratoryResults,
      valueResults,
      max_results
    );
    
    // Inject found values into relevant datasets if requested
    const finalResults = include_metadata 
      ? await injectMetadata(combinedResults, valueResults)
      : combinedResults;
    
    return {
      message: `Found ${finalResults.length} relevant datasets from ${datasets.length} available datasets`,
      specific_queries,
      exploratory_topics,
      duration: Date.now() - startTime,
      results: finalResults,
      data_source_id: datasets[0]?.data_source_id,
      total_datasets_searched: datasets.length,
      value_matches_found: valueResults.length
    };
  },
  { name: 'search-data-catalog' }
);

async function getPermissionedDatasets(): Promise<PermissionedDataset[]> {
  // Simulated dataset catalog - in real implementation, this would query the database
  return [
    {
      id: 'dataset-1',
      name: 'Customer Analytics',
      yml_content: `
name: Customer Analytics
description: Customer behavior and demographics data
tables:
  - name: customers
    columns:
      - name: customer_id
        type: string
      - name: age
        type: integer
      - name: location
        type: string
      - name: purchase_history
        type: json
`,
      data_source_id: 'postgres-1'
    },
    {
      id: 'dataset-2',
      name: 'Sales Performance',
      yml_content: `
name: Sales Performance
description: Sales metrics and revenue data
tables:
  - name: sales
    columns:
      - name: sale_id
        type: string
      - name: amount
        type: decimal
      - name: date
        type: timestamp
      - name: product_id
        type: string
`,
      data_source_id: 'postgres-1'
    },
    {
      id: 'dataset-3',
      name: 'Product Inventory',
      yml_content: `
name: Product Inventory
description: Product catalog and inventory levels
tables:
  - name: products
    columns:
      - name: product_id
        type: string
      - name: name
        type: string
      - name: category
        type: string
      - name: stock_level
        type: integer
`,
      data_source_id: 'postgres-1'
    },
    {
      id: 'dataset-4',
      name: 'Website Analytics',
      yml_content: `
name: Website Analytics
description: Web traffic and user engagement metrics
tables:
  - name: page_views
    columns:
      - name: session_id
        type: string
      - name: page_url
        type: string
      - name: timestamp
        type: timestamp
      - name: user_id
        type: string
`,
      data_source_id: 'postgres-1'
    }
  ];
}

async function searchSpecificQueries(
  queries: string[],
  datasets: PermissionedDataset[]
): Promise<Array<{ dataset: PermissionedDataset; relevance_score: number; match_type: 'specific' }>> {
  if (queries.length === 0) return [];
  
  const results: Array<{ dataset: PermissionedDataset; relevance_score: number; match_type: 'specific' }> = [];
  
  for (const query of queries) {
    const queryResults = await filterDatasetsWithLLM(
      query,
      datasets,
      'specific'
    );
    
    results.push(...queryResults.map(r => ({
      dataset: r.dataset,
      relevance_score: r.relevance_score,
      match_type: 'specific' as const
    })));
  }
  
  return results;
}

async function searchExploratoryTopics(
  topics: string[],
  datasets: PermissionedDataset[]
): Promise<Array<{ dataset: PermissionedDataset; relevance_score: number; match_type: 'exploratory' }>> {
  if (topics.length === 0) return [];
  
  const results: Array<{ dataset: PermissionedDataset; relevance_score: number; match_type: 'exploratory' }> = [];
  
  for (const topic of topics) {
    const topicResults = await filterDatasetsWithLLM(
      topic,
      datasets,
      'exploratory'
    );
    
    results.push(...topicResults.map(r => ({
      dataset: r.dataset,
      relevance_score: r.relevance_score,
      match_type: 'exploratory' as const
    })));
  }
  
  return results;
}

async function searchValues(
  searchTerms: string[],
  datasets: PermissionedDataset[]
): Promise<FoundValueInfo[]> {
  if (searchTerms.length === 0) return [];
  
  // Simulate value search - in real implementation, this would use embeddings
  const foundValues: FoundValueInfo[] = [];
  
  for (const term of searchTerms) {
    for (const dataset of datasets) {
      if (dataset.yml_content && dataset.yml_content.toLowerCase().includes(term.toLowerCase())) {
        foundValues.push({
          value: term,
          database_name: 'main_db',
          schema_name: 'public',
          table_name: dataset.name?.toLowerCase().replace(/\s+/g, '_') || 'unknown',
          column_name: 'data_column'
        });
      }
    }
  }
  
  return foundValues;
}

async function filterDatasetsWithLLM(
  query: string,
  datasets: PermissionedDataset[],
  queryType: 'specific' | 'exploratory'
): Promise<Array<{ dataset: PermissionedDataset; relevance_score: number }>> {
  const prompt = buildFilterPrompt(query, datasets, queryType);
  
  try {
    const result = await generateText({
      model: openai('gpt-4'),
      messages: [
        {
          role: 'system',
          content: queryType === 'specific' 
            ? 'You are a data catalog expert. Filter datasets based on specific user queries. Return only datasets that directly match the requirements.'
            : 'You are a data discovery expert. Find datasets related to broad topics. Be inclusive for exploration.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.0,
      maxTokens: 2000,
    });
    
    const parsed = JSON.parse(result.text);
    
    if (!parsed.results || !Array.isArray(parsed.results)) {
      return [];
    }
    
    return parsed.results
      .map((result: any) => {
        const dataset = datasets.find(d => d.id === result.dataset_id);
        if (!dataset) return null;
        
        return {
          dataset,
          relevance_score: result.relevance_score || 0.5
        };
      })
      .filter((result: any): result is { dataset: PermissionedDataset; relevance_score: number } => result !== null);
    
  } catch (error) {
    console.warn('LLM filtering failed, falling back to simple text matching:', error);
    return fallbackTextSearch(query, datasets);
  }
}

function buildFilterPrompt(
  query: string,
  datasets: PermissionedDataset[],
  queryType: 'specific' | 'exploratory'
): string {
  const datasetsInfo = datasets.map(d => ({
    id: d.id,
    name: d.name,
    yml_content: d.yml_content?.substring(0, 500) // Truncate for prompt size
  }));
  
  return `
Query: "${query}"
Query Type: ${queryType}

Available Datasets:
${JSON.stringify(datasetsInfo, null, 2)}

Please analyze which datasets are relevant to the query and return a JSON response with this structure:
{
  "results": [
    {
      "dataset_id": "dataset-id",
      "relevance_score": 0.9,
      "reasoning": "brief explanation"
    }
  ]
}

Relevance scores should be between 0.0 and 1.0. Only include datasets with relevance scores above 0.3.
For specific queries, be selective. For exploratory queries, be more inclusive.
`;
}

function fallbackTextSearch(
  query: string,
  datasets: PermissionedDataset[]
): Array<{ dataset: PermissionedDataset; relevance_score: number }> {
  const results: Array<{ dataset: PermissionedDataset; relevance_score: number }> = [];
  const queryLower = query.toLowerCase();
  
  for (const dataset of datasets) {
    let score = 0;
    
    // Check name match
    if (dataset.name && dataset.name.toLowerCase().includes(queryLower)) {
      score += 0.8;
    }
    
    // Check content match
    if (dataset.yml_content && dataset.yml_content.toLowerCase().includes(queryLower)) {
      score += 0.6;
    }
    
    if (score > 0) {
      results.push({
        dataset,
        relevance_score: Math.min(score, 1.0)
      });
    }
  }
  
  return results.sort((a, b) => b.relevance_score - a.relevance_score);
}

function combineAndRankResults(
  specificResults: Array<{ dataset: PermissionedDataset; relevance_score: number; match_type: 'specific' }>,
  exploratoryResults: Array<{ dataset: PermissionedDataset; relevance_score: number; match_type: 'exploratory' }>,
  valueResults: FoundValueInfo[],
  maxResults: number
): Array<{ id: string; name?: string; yml_content?: string; relevance_score: number; match_type: string }> {
  // Combine all results
  const allResults = [
    ...specificResults.map(r => ({
      ...r,
      match_type: r.match_type as string
    })),
    ...exploratoryResults.map(r => ({
      ...r,
      match_type: r.match_type as string
    }))
  ];
  
  // Add value matches with high relevance
  const valueMatchDatasets = new Set(
    valueResults.map(v => v.table_name)
  );
  
  for (const tableName of valueMatchDatasets) {
    const matchingDataset = allResults.find(r => 
      r.dataset.name?.toLowerCase().replace(/\s+/g, '_') === tableName
    );
    
    if (matchingDataset) {
      matchingDataset.relevance_score = Math.min(matchingDataset.relevance_score + 0.3, 1.0);
      matchingDataset.match_type = 'value_match';
    }
  }
  
  // Deduplicate by dataset ID
  const uniqueResults = new Map<string, typeof allResults[0]>();
  
  for (const result of allResults) {
    const existing = uniqueResults.get(result.dataset.id);
    if (!existing || result.relevance_score > existing.relevance_score) {
      uniqueResults.set(result.dataset.id, result);
    }
  }
  
  // Sort by relevance score and limit results
  return Array.from(uniqueResults.values())
    .sort((a, b) => b.relevance_score - a.relevance_score)
    .slice(0, maxResults)
    .map(result => ({
      id: result.dataset.id,
      name: result.dataset.name,
      yml_content: result.dataset.yml_content,
      relevance_score: result.relevance_score,
      match_type: result.match_type
    }));
}

async function injectMetadata(
  results: Array<{ id: string; name?: string; yml_content?: string; relevance_score: number; match_type: string }>,
  valueResults: FoundValueInfo[]
): Promise<Array<{ id: string; name?: string; yml_content?: string; relevance_score: number; match_type: string }>> {
  // In a real implementation, this would inject found values into YML content
  // For now, we'll just add a comment about found values
  
  return results.map(result => {
    const relevantValues = valueResults.filter(v => 
      v.table_name === result.name?.toLowerCase().replace(/\s+/g, '_')
    );
    
    if (relevantValues.length > 0 && result.yml_content) {
      const valueComment = `# Found values: ${relevantValues.map(v => v.value).join(', ')}\n`;
      return {
        ...result,
        yml_content: valueComment + result.yml_content
      };
    }
    
    return result;
  });
}