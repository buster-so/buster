import { openai } from '@ai-sdk/openai';
import type { RuntimeContext } from '@mastra/core/runtime-context';
import { createTool } from '@mastra/core/tools';
import { embed, generateText } from 'ai';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';
import type { AnalystRuntimeContext } from '../../../agents/analyst-agent/analyst-agent';
// Note: You'll need to adjust this import path based on your actual database setup
// import { db } from '@/packages/database';

interface SearchDataCatalogParams {
  specific_queries?: string[];
  exploratory_topics?: string[];
  value_search_terms?: string[];
}

interface PermissionedDataset {
  id: string;
  name: string;
  yml_content: string;
  data_source_id: string;
}

interface FoundValueInfo {
  value: string;
  database_name: string;
  schema_name: string;
  table_name: string;
  column_name: string;
}

interface RankedDataset {
  dataset: PermissionedDataset;
  relevance_score: number;
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
    max_results: z.number().default(10).describe('Maximum number of results to return'),
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

const SPECIFIC_LLM_FILTER_PROMPT = `
You are a dataset relevance evaluator, focused on specific analytical requirements. Your task is to determine which datasets are **semantically relevant** to the user's query and the anticipated analytical needs based on their structure and metadata. Focus on the core **Business Objects, Properties, Events, Metrics, and Filters** explicitly requested or strongly implied.

USER REQUEST (Context): {user_request}
SPECIFIC SEARCH QUERY: {query} (This query is framed around key semantic concepts and anticipated attributes/joins identified from the user request)

Below is a list of datasets that were identified as potentially relevant by an initial ranking system.

For each dataset, review its description in the YAML format. Evaluate how well the dataset's described contents (columns, metrics, entities, documentation) **semantically align** with the key **Objects, Properties, Events, Metrics, and Filters** required by the SPECIFIC SEARCH QUERY and USER REQUEST context.

IMPORTANT EVIDENCE - ACTUAL DATA VALUES FOUND IN THIS DATASET:
{found_values_json}
These values were found in the actual data that matches your search requirements. Consider these as concrete evidence that this dataset contains data relevant to your query.

**Crucially, anticipate necessary attributes**: Pay close attention to whether the dataset contains specific attributes like **names, IDs, emails, timestamps, or other identifying/linking information** that are likely required to fulfill the analytical goal, even if not explicitly stated in the query but inferable from the user request context and common analytical patterns (e.g., needing 'customer name' when analyzing 'customer revenue').

Include datasets where the YAML description suggests a reasonable semantic match or overlap with the needed concepts and anticipated attributes. Prioritize datasets that appear to contain the core Objects or Events AND the necessary linking/descriptive Properties.

DATASETS:
{datasets_json}

Return a JSON response containing ONLY a list of the UUIDs for the semantically relevant datasets. The response should have the following structure:
\`\`\`json
{
  "results": [
    "dataset-uuid-here-1",
    "dataset-uuid-here-2"
    // ... semantically relevant dataset UUIDs
  ]
}
\`\`\`

IMPORTANT GUIDELINES:
1.  **Focus on Semantic Relevance & Anticipation**: Include datasets whose content, as described in the YAML, is semantically related to the required Objects, Properties, Events, Metrics, or Filters, AND contains the anticipated attributes needed for analysis (like names, IDs, relevant dimensions).
2.  **Consider the Core Concepts & Analytical Goal**: Does the dataset seem to be about the primary Business Object(s) or Event(s)? Does it contain relevant Properties or Metrics (including anticipated ones)?
3.  **Prioritize Datasets with Key Attributes**: Give higher importance to datasets containing necessary identifying or descriptive attributes (names, IDs, categories, timestamps) relevant to the query and user request context.
4.  **Evaluate based on Semantic Fit**: Does the dataset's purpose and structure align well with the user's information need and the likely analytical steps?
5.  **Consider Found Values as Evidence**: The actual values found in the dataset provide concrete evidence of relevance. If values matching the user's query (like specific entities, terms, or categories) appear in the dataset, this strongly suggests relevance.
6.  **Contextual Information is Relevant**: Include datasets providing important contextual Properties for the core Objects or Events.
7.  **When in doubt, lean towards inclusion if semantically plausible and potentially useful**: If the dataset seems semantically related, include it.
8.  **CRITICAL:** Each string in the "results" array MUST contain ONLY the dataset's UUID string (e.g., "9711ca55-8329-4fd9-8b20-b6a3289f3d38").
9.  **Use USER REQUEST for context, SPECIFIC SEARCH QUERY for focus**: Understand the underlying need (user request) and the specific concepts/attributes being targeted (search query).
`;

const EXPLORATORY_LLM_FILTER_PROMPT = `
You are a dataset relevance evaluator, focused on exploring potential connections and related concepts. Your task is to determine which datasets might be **thematically relevant** or provide useful **contextual information** related to the user's exploratory topic and broader request.

USER REQUEST (Context): {user_request}
EXPLORATORY TOPIC: {topic} (This topic represents a general area of interest derived from the user request)

Below is a list of datasets identified as potentially relevant by an initial ranking system.
For each dataset, review its description in the YAML format. Evaluate how well the dataset's described contents (columns, metrics, entities, documentation) **thematically relate** to the EXPLORATORY TOPIC and the overall USER REQUEST context.

IMPORTANT EVIDENCE - ACTUAL DATA VALUES FOUND IN THIS DATASET:
{found_values_json}
These values were found in the actual data that matches your exploratory topics. Consider these as concrete evidence that this dataset contains data relevant to your exploration.

Consider datasets that:
- Directly address the EXPLORATORY TOPIC.
- Contain concepts, objects, or events that are often related to the EXPLORATORY TOPIC (e.g., if the topic is 'customer churn', related datasets might involve 'customer support interactions', 'product usage', 'marketing engagement', 'customer demographics').
- Provide valuable contextual dimensions (like time, geography, product categories) that could enrich the analysis of the EXPLORATORY TOPIC.
- Might reveal interesting patterns or correlations when combined with data more central to the topic.

Focus on **potential utility for exploration and discovery**, rather than strict semantic matching to the topic words alone.

DATASETS:
{datasets_json}

Return a JSON response containing ONLY a list of the UUIDs for the potentially relevant datasets for exploration. The response should have the following structure:
\`\`\`json
{
  "results": [
    "dataset-uuid-here-1",
    "dataset-uuid-here-2"
    // ... potentially relevant dataset UUIDs for exploration
  ]
}
\`\`\`

IMPORTANT GUIDELINES:
1.  **Focus on Thematic Relevance & Potential Utility**: Include datasets whose content seems related to the EXPLORATORY TOPIC or could provide valuable context/insights for exploration.
2.  **Consider Related Concepts**: Think broadly about what data is often analyzed alongside the given topic.
3.  **Consider Found Values as Evidence**: The actual values found in the dataset provide concrete evidence of relevance. If values matching the user's exploratory topic (like specific entities, terms, or categories) appear in the dataset, this strongly suggests usefulness for exploration.
4.  **Prioritize Breadth**: Lean towards including datasets that might offer different perspectives or dimensions related to the topic.
5.  **Evaluate based on Potential for Discovery**: Does the dataset seem like it could contribute to understanding the topic area, even indirectly?
6.  **Contextual Information is Valuable**: Include datasets providing relevant dimensions or related entities.
7.  **When in doubt, lean towards inclusion if thematically plausible**: If the dataset seems potentially related to the exploration goal, include it.
8.  **CRITICAL:** Each string in the "results" array MUST contain ONLY the dataset's UUID string (e.g., "9711ca55-8329-4fd9-8b20-b6a3289f3d38").
9.  **Use USER REQUEST for context, EXPLORATORY TOPIC for focus**: Understand the underlying need (user request) and the general area being explored (topic).
`;

const searchDataCatalog = wrapTraced(
  async (
    params: SearchDataCatalogParams,
    runtimeContext: RuntimeContext<AnalystRuntimeContext>
  ) => {
    const startTime = Date.now();
    const { specific_queries = [], exploratory_topics = [], value_search_terms = [] } = params;

    const userId: string = runtimeContext.get('userId');
    const userPrompt: string = runtimeContext.get('user_prompt') || '';

    if (!userId) {
      throw new Error('User ID not available in runtime context');
    }

    // Get permissioned datasets from database
    const datasets = await getPermissionedDatasets(userId);

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
    const targetDataSourceId = datasets[0]?.data_source_id;
    if (targetDataSourceId) {
      await runtimeContext?.setStateValue?.('data_source_id', targetDataSourceId);
    }

    // Get data source syntax concurrently
    const syntaxPromise = getDataSourceSyntax(targetDataSourceId, runtimeContext);

    // Filter and search for values using embeddings
    const validValueSearchTerms = value_search_terms.filter(
      (term) => term.length >= 2 && !isTimePeriodTerm(term)
    );

    // Generate embeddings and search for values
    const allFoundValues = await searchValuesWithEmbeddings(
      validValueSearchTerms,
      targetDataSourceId
    );

    // Check if we have anything to search for
    if (
      specific_queries.length === 0 &&
      exploratory_topics.length === 0 &&
      allFoundValues.length === 0
    ) {
      return {
        message: 'No search queries, exploratory topics, or found values from provided terms.',
        specific_queries,
        exploratory_topics,
        duration: Date.now() - startTime,
        results: [],
        data_source_id: targetDataSourceId,
        total_datasets_searched: datasets.length,
        value_matches_found: 0,
      };
    }

    // Prepare documents for reranking
    const documents = datasets.filter((d) => d.yml_content).map((d) => d.yml_content!);

    if (documents.length === 0) {
      return {
        message: 'No searchable dataset content found.',
        specific_queries,
        exploratory_topics,
        duration: Date.now() - startTime,
        results: [],
        data_source_id: targetDataSourceId,
        total_datasets_searched: datasets.length,
        value_matches_found: allFoundValues.length,
      };
    }

    // Rerank datasets for specific queries and exploratory topics
    const [specificResults, exploratoryResults] = await Promise.all([
      Promise.all(specific_queries.map((query) => rerankDatasets(query, datasets, documents))),
      Promise.all(exploratory_topics.map((topic) => rerankDatasets(topic, datasets, documents))),
    ]);

    // Filter with LLM
    const [specificFiltered, exploratoryFiltered] = await Promise.all([
      Promise.all(
        specificResults.map((ranked, i) =>
          filterDatasetsWithLLM(
            SPECIFIC_LLM_FILTER_PROMPT,
            specific_queries[i] || '',
            userPrompt,
            ranked,
            allFoundValues,
            'specific'
          )
        )
      ),
      Promise.all(
        exploratoryResults.map((ranked, i) =>
          filterDatasetsWithLLM(
            EXPLORATORY_LLM_FILTER_PROMPT,
            exploratory_topics[i] || '',
            userPrompt,
            ranked,
            allFoundValues,
            'exploratory'
          )
        )
      ),
    ]);

    // Combine and deduplicate results
    const combinedResults = combineAndRankResults(
      specificFiltered.flat(),
      exploratoryFiltered.flat(),
      allFoundValues,
      max_results
    );

    // Inject metadata if requested
    const finalResults = include_metadata
      ? await injectMetadata(combinedResults, allFoundValues)
      : combinedResults;

    // Set agent state
    await runtimeContext?.setStateValue?.('data_context', finalResults.length > 0);
    await runtimeContext?.setStateValue?.('searched_data_catalog', true);

    // Wait for syntax promise to complete
    await syntaxPromise;

    return {
      message:
        finalResults.length === 0
          ? 'No relevant datasets found after filtering.'
          : `Found ${finalResults.length} relevant datasets with injected values for searchable dimensions.`,
      specific_queries,
      exploratory_topics,
      duration: Date.now() - startTime,
      results: finalResults,
      data_source_id: targetDataSourceId,
      total_datasets_searched: datasets.length,
      value_matches_found: allFoundValues.length,
    };
  },
  { name: 'search-data-catalog' }
);

async function getDataSourceSyntax(dataSourceId: string | undefined, runtimeContext: any) {
  if (!dataSourceId) return;

  try {
    // Mock implementation for now
    // const result = await db.query(`
    //   SELECT type FROM data_sources WHERE id = $1
    // `, [dataSourceId]);

    // const syntax = result.rows[0]?.type || null;
    const syntax = 'postgresql'; // Mock value
    await runtimeContext?.setStateValue?.('data_source_syntax', syntax);
  } catch (error) {
    console.warn('Failed to get data source syntax:', error);
    await runtimeContext?.setStateValue?.('data_source_syntax', null);
  }
}

function isTimePeriodTerm(term: string): boolean {
  const termLower = term.toLowerCase();
  const timeTerms = [
    'today',
    'yesterday',
    'tomorrow',
    'last week',
    'last month',
    'last year',
    'last quarter',
    'this week',
    'this month',
    'this year',
    'this quarter',
    'next week',
    'next month',
    'next year',
    'next quarter',
    'q1',
    'q2',
    'q3',
    'q4',
    'january',
    'february',
    'march',
    'april',
    'may',
    'june',
    'july',
    'august',
    'september',
    'october',
    'november',
    'december',
    'jan',
    'feb',
    'mar',
    'apr',
    'jun',
    'jul',
    'aug',
    'sep',
    'oct',
    'nov',
    'dec',
  ];

  return timeTerms.some((t) => termLower.includes(t));
}

async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const result = await embed({
      model: openai.embedding('text-embedding-3-small'),
      value: text,
    });
    return result.embedding;
  } catch (error) {
    console.error('Failed to generate embedding:', error);
    return [];
  }
}

async function searchValuesWithEmbeddings(
  terms: string[],
  dataSourceId: string | undefined
): Promise<FoundValueInfo[]> {
  if (!terms.length || !dataSourceId) return [];

  // Generate embeddings for all terms
  const embeddings = await Promise.all(
    terms.map(async (term) => ({
      term,
      embedding: await generateEmbedding(term),
    }))
  );

  // Search for values using embeddings
  const allFoundValues: FoundValueInfo[] = [];

  for (const { term, embedding } of embeddings) {
    if (embedding.length === 0) continue;

    try {
      // This would need to be implemented based on your stored values system
      // For now, using a mock implementation
      const results = await searchValuesByEmbedding(dataSourceId, embedding, 20);

      const foundValues = results.map((result: any) => ({
        value: result.value,
        database_name: result.database_name,
        schema_name: result.schema_name,
        table_name: result.table_name,
        column_name: result.column_name,
      }));

      allFoundValues.push(...foundValues);
    } catch (error) {
      console.error(`Error searching for values with term "${term}":`, error);
    }
  }

  return allFoundValues;
}

async function searchValuesByEmbedding(
  dataSourceId: string,
  embedding: number[],
  limit: number
): Promise<any[]> {
  // This would need to be implemented based on your stored values/embeddings system
  // For now, returning mock data
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _unused = { dataSourceId, embedding, limit };
  return [];
}

async function rerankDatasets(
  query: string,
  datasets: PermissionedDataset[],
  documents: string[]
): Promise<RankedDataset[]> {
  if (!documents.length || !datasets.length) return [];

  try {
    // Generate query embedding
    const queryEmbedding = await generateEmbedding(query);

    // Generate document embeddings
    const docEmbeddings = await Promise.all(documents.map((doc) => generateEmbedding(doc)));

    // Calculate cosine similarity scores
    const similarities = docEmbeddings.map((docEmb) => cosineSimilarity(queryEmbedding, docEmb));

    // Create ranked results
    const rankedDatasets = datasets
      .map((dataset, index) => ({
        dataset,
        relevance_score: similarities[index] || 0,
      }))
      .filter((item) => item.relevance_score > 0.3) // Filter low relevance
      .sort((a, b) => b.relevance_score - a.relevance_score)
      .slice(0, 35); // Top 35 like in Rust version

    return rankedDatasets;
  } catch (error) {
    console.error('Reranking failed:', error);
    return [];
  }
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;

  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));

  if (magnitudeA === 0 || magnitudeB === 0) return 0;

  return dotProduct / (magnitudeA * magnitudeB);
}

async function filterDatasetsWithLLM(
  promptTemplate: string,
  queryOrTopic: string,
  userPrompt: string,
  rankedDatasets: RankedDataset[],
  allFoundValues: FoundValueInfo[],
  generationNameSuffix: string
): Promise<
  Array<{
    id: string;
    name?: string;
    yml_content?: string;
    relevance_score: number;
    match_type: 'specific' | 'exploratory' | 'value_match';
  }>
> {
  if (rankedDatasets.length === 0) return [];

  const datasetsJson = rankedDatasets.map((ranked) => ({
    id: ranked.dataset.id,
    name: ranked.dataset.name,
    yml_content: ranked.dataset.yml_content || '',
  }));

  const foundValuesJson =
    allFoundValues.length === 0
      ? 'No specific values were found in the dataset that match the search terms.'
      : allFoundValues
          .map(
            (val) =>
              `- '${val.value}' (found in ${val.database_name}.${val.table_name}.${val.column_name})`
          )
          .join('\n');

  const prompt = promptTemplate
    .replace('{user_request}', userPrompt)
    .replace('{query}', queryOrTopic)
    .replace('{topic}', queryOrTopic)
    .replace('{datasets_json}', JSON.stringify(datasetsJson, null, 2))
    .replace('{found_values_json}', foundValuesJson);

  try {
    const result = await generateText({
      model: openai('gpt-4'),
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.0,
      maxTokens: 8096,
    });

    const response = JSON.parse(result.text);

    if (!response.results || !Array.isArray(response.results)) {
      return [];
    }

    const datasetMap = new Map(rankedDatasets.map((r) => [r.dataset.id, r]));

    return response.results
      .map((datasetId: string) => {
        const rankedDataset = datasetMap.get(datasetId);
        if (!rankedDataset) return null;

        return {
          id: rankedDataset.dataset.id,
          name: rankedDataset.dataset.name,
          yml_content: rankedDataset.dataset.yml_content,
          relevance_score: rankedDataset.relevance_score,
          match_type: generationNameSuffix as 'specific' | 'exploratory',
        };
      })
      .filter(
        (
          result: any
        ): result is {
          id: string;
          name?: string;
          yml_content?: string;
          relevance_score: number;
          match_type: 'specific' | 'exploratory' | 'value_match';
        } => result !== null
      );
  } catch (error) {
    console.error('LLM filtering failed:', error);
    return [];
  }
}

function combineAndRankResults(
  specificResults: Array<{
    id: string;
    name?: string;
    yml_content?: string;
    relevance_score: number;
    match_type: 'specific' | 'exploratory' | 'value_match';
  }>,
  exploratoryResults: Array<{
    id: string;
    name?: string;
    yml_content?: string;
    relevance_score: number;
    match_type: 'specific' | 'exploratory' | 'value_match';
  }>,
  valueResults: FoundValueInfo[],
  maxResults: number
): Array<{
  id: string;
  name?: string;
  yml_content?: string;
  relevance_score: number;
  match_type: 'specific' | 'exploratory' | 'value_match';
}> {
  // Combine all results
  const allResults = [...specificResults, ...exploratoryResults];

  // Add value matches with high relevance
  const valueMatchDatasets = new Set(valueResults.map((v) => v.table_name));

  for (const result of allResults) {
    const tableName = result.name?.toLowerCase().replace(/\s+/g, '_');
    if (valueMatchDatasets.has(tableName)) {
      result.relevance_score = Math.min(result.relevance_score + 0.3, 1.0);
      result.match_type = 'value_match';
    }
  }

  // Deduplicate by dataset ID
  const uniqueResults = new Map<string, (typeof allResults)[0]>();

  for (const result of allResults) {
    const existing = uniqueResults.get(result.id);
    if (!existing || result.relevance_score > existing.relevance_score) {
      uniqueResults.set(result.id, result);
    }
  }

  // Sort by relevance score and limit results
  return Array.from(uniqueResults.values())
    .sort((a, b) => b.relevance_score - a.relevance_score)
    .slice(0, maxResults);
}

async function injectMetadata(
  results: Array<{
    id: string;
    name?: string;
    yml_content?: string;
    relevance_score: number;
    match_type: 'specific' | 'exploratory' | 'value_match';
  }>,
  valueResults: FoundValueInfo[]
): Promise<
  Array<{
    id: string;
    name?: string;
    yml_content?: string;
    relevance_score: number;
    match_type: 'specific' | 'exploratory' | 'value_match';
  }>
> {
  return results.map((result) => {
    const tableName = result.name?.toLowerCase()?.replace(/\s+/g, '_');
    const relevantValues = valueResults.filter((v) => tableName && v.table_name === tableName);

    if (relevantValues.length > 0 && result.yml_content) {
      const valueComment = `# Found values: ${relevantValues.map((v) => v.value).join(', ')}\n`;
      return {
        ...result,
        yml_content: valueComment + result.yml_content,
      };
    }

    return result;
  });
}
