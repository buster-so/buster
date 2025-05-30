# Search Data Catalog Tool Implementation Plan

## Overview

Migrate the Rust `search_data_catalog.rs` to TypeScript using Mastra framework. This is one of the most complex tools, handling semantic search across data catalogs with LLM filtering and value injection.

## Current Rust Implementation Analysis

- **File**: `api/libs/agents/src/tools/categories/file_tools/search_data_catalog.rs` 
- **Purpose**: Search and filter datasets based on user queries using semantic ranking and LLM filtering
- **Input**: Specific queries, exploratory topics, value search terms
- **Output**: Filtered datasets with injected relevant values
- **Key Features**:
  - Semantic dataset ranking with reranking library
  - LLM-based filtering with different prompts for specific vs exploratory searches
  - Embedding-based value search with stored values
  - YAML parsing and modification for searchable dimensions
  - Concurrent processing of multiple search strategies
  - Database integration for permissions and metadata

## Dependencies
- @database for data persistence
- @data-source for database connectivity
- @rerank for semantic ranking
- @stored-values for value search
- @ai-sdk/openai for LLM filtering
- @mastra/core/workflows for orchestration
- @mastra/core for tool framework
- Braintrust for tracing

## Implementation Pattern
**Type**: Workflow-based
**Wave**: 5
**AI Agent Time**: 5 minutes
**Depends on**: All other tools (most complex)

## TypeScript Implementation

### Tool Definition

```typescript
export const searchDataCatalogTool = createTool({
  id: 'search-data-catalog',
  description: 'Search the data catalog for relevant datasets using semantic search and LLM filtering',
  inputSchema: z.object({
    specific_queries: z.array(z.string()).optional()
      .describe('Specific search queries targeting particular data assets'),
    exploratory_topics: z.array(z.string()).optional()
      .describe('Broader topics for discovering related datasets'),
    value_search_terms: z.array(z.string()).optional()
      .describe('Specific values to search for within dataset columns')
  }),
  outputSchema: z.object({
    message: z.string(),
    specific_queries: z.array(z.string()).optional(),
    exploratory_topics: z.array(z.string()).optional(),
    duration: z.number(),
    results: z.array(z.object({
      id: z.string().uuid(),
      name: z.string().optional(),
      yml_content: z.string().optional()
    })),
    data_source_id: z.string().uuid().optional()
  }),
  execute: async ({ context }) => {
    return await executeSearchWorkflow(context);
  },
});
```

### Dependencies Required

```typescript
import { db } from '@database';
import { DataSourceAdapter } from '@data-source';
import { eq, and, inArray } from 'drizzle-orm';
import { datasets, dataSources, assetPermissions } from '@database/schema';
import { Agent } from '@mastra/core/agent';
import { createWorkflow, createStep } from '@mastra/core/workflows';
import { openai } from '@ai-sdk/openai';
import { rerank } from '@rerank/client';
import { storedValues } from '@stored-values';
import yaml from 'yaml';
import { wrapTraced } from 'braintrust';
```

### Workflow-Based Implementation (Recommended)

This tool benefits significantly from Mastra workflows due to its parallel LLM filtering and complex data processing:

```typescript
// Create specialized agents for different search contexts
const specificFilterAgent = new Agent({
  name: 'SpecificFilterAgent',
  model: openai('gpt-4o'),
  instructions: 'Filter datasets based on specific queries. Be precise and selective.'
});

const exploratoryFilterAgent = new Agent({
  name: 'ExploratoryFilterAgent', 
  model: openai('gpt-4o'),
  instructions: 'Find datasets related to broad topics. Be inclusive for discovery.'
});

// Define reusable workflow steps
const filterStep = createStep({
  id: 'filter-datasets',
  description: 'Filter datasets using LLM',
  inputSchema: z.object({
    query: z.string(),
    queryType: z.enum(['specific', 'exploratory']),
    datasets: z.array(z.object({
      id: z.string(),
      name: z.string().optional(),
      yml_content: z.string().optional()
    })),
    foundValues: z.array(z.any()).optional()
  }),
  outputSchema: z.object({
    filteredDatasets: z.array(z.object({
      id: z.string(),
      relevance_score: z.number()
    }))
  }),
  execute: async ({ inputData, mastra }) => {
    const agent = inputData.queryType === 'specific' 
      ? mastra.getAgent('SpecificFilterAgent')
      : mastra.getAgent('ExploratoryFilterAgent');
      
    const prompt = buildFilterPrompt(inputData.query, inputData.datasets, inputData.foundValues || []);
    
    const response = await agent.generate([
      { role: 'user', content: prompt }
    ], { output: 'json' });
    
    return { 
      filteredDatasets: JSON.parse(response.choices[0].message.content).results 
    };
  }
});

const valueSearchStep = createStep({
  id: 'search-values',
  description: 'Search for specific values in datasets',
  inputSchema: z.object({
    searchTerms: z.array(z.string()),
    datasets: z.array(z.any())
  }),
  outputSchema: z.object({
    foundValues: z.array(z.object({
      value: z.string(),
      database_name: z.string(),
      table_name: z.string(),
      column_name: z.string()
    }))
  }),
  execute: async ({ inputData }) => {
    return { 
      foundValues: await searchStoredValues(inputData.searchTerms, inputData.datasets) 
    };
  }
});

// Main search workflow with parallel execution
const searchWorkflow = createWorkflow({
  id: 'search-data-catalog-workflow',
  inputSchema: z.object({
    specific_queries: z.array(z.string()).optional(),
    exploratory_topics: z.array(z.string()).optional(),
    value_search_terms: z.array(z.string()).optional(),
    permissionedDatasets: z.array(z.any())
  }),
  steps: []
})
.parallel(({ inputData }) => {
  const steps = [];
  
  // Parallel filtering for each specific query
  if (inputData.specific_queries?.length) {
    steps.push(...inputData.specific_queries.map((query, idx) =>
      filterStep.withInput({
        query,
        queryType: 'specific',
        datasets: inputData.permissionedDatasets,
        foundValues: []
      }).withId(`specific-filter-${idx}`)
    ));
  }
  
  // Parallel filtering for each exploratory topic
  if (inputData.exploratory_topics?.length) {
    steps.push(...inputData.exploratory_topics.map((topic, idx) =>
      filterStep.withInput({
        query: topic,
        queryType: 'exploratory',
        datasets: inputData.permissionedDatasets,
        foundValues: []
      }).withId(`exploratory-filter-${idx}`)
    ));
  }
  
  // Value search in parallel
  if (inputData.value_search_terms?.length) {
    steps.push(
      valueSearchStep.withInput({
        searchTerms: inputData.value_search_terms,
        datasets: inputData.permissionedDatasets
      }).withId('value-search')
    );
  }
  
  return steps;
})
.then({
  id: 'aggregate-and-rerank',
  description: 'Combine results and apply semantic reranking',
  execute: async ({ inputData }) => {
    // Aggregate all filtered results
    const allFilterResults = inputData.responses
      .filter(r => r.filteredDatasets)
      .flatMap(r => r.filteredDatasets);
    
    const valueResults = inputData.responses
      .find(r => r.foundValues)?.foundValues || [];
    
    // Apply semantic reranking
    const rerankedResults = await rerankResults(allFilterResults);
    
    // Inject found values into relevant datasets
    const finalResults = await injectFoundValues(rerankedResults, valueResults);
    
    return {
      results: finalResults,
      message: `Found ${finalResults.length} relevant datasets`,
      value_matches: valueResults.length
    };
  }
})
.commit();

async function executeSearchWorkflow(params: SearchDataCatalogParams) {
  const startTime = Date.now();
  
  // Get user permissions first
  const permissionedDatasets = await getPermissionedDatasets(params.user_id);
  
  // Execute the workflow
  const result = await searchWorkflow.execute({
    ...params,
    permissionedDatasets
  });
  
  return {
    ...result,
    duration: Date.now() - startTime,
    specific_queries: params.specific_queries,
    exploratory_topics: params.exploratory_topics
  };
}
```

### Alternative Simple Implementation Structure

```typescript
interface SearchDataCatalogParams {
  specific_queries?: string[];
  exploratory_topics?: string[];
  value_search_terms?: string[];
}

interface PermissionedDataset {
  id: string;
  name: string;
  yml_content?: string;
  data_source_id: string;
}

interface FoundValueInfo {
  value: string;
  database_name: string;
  schema_name: string;
  table_name: string;
  column_name: string;
}

const searchDataCatalog = wrapTraced(
  async (params: SearchDataCatalogParams) => {
    const startTime = Date.now();
    
    // 1. Get user permissions and datasets
    const datasets = await getPermissionedDatasets(userId);
    
    if (datasets.length === 0) {
      return {
        message: "No datasets available to search",
        duration: Date.now() - startTime,
        results: [],
        data_source_id: null
      };
    }
    
    // 2. Extract data source ID and cache syntax info
    const dataSourceId = datasets[0].data_source_id;
    await cacheDataSourceInfo(dataSourceId);
    
    // 3. Perform value searches concurrently
    const foundValues = await performValueSearches(
      params.value_search_terms || [],
      dataSourceId
    );
    
    // 4. Rank datasets for each query/topic
    const { specificResults, exploratoryResults } = await rankDatasets(
      params.specific_queries || [],
      params.exploratory_topics || [],
      datasets
    );
    
    // 5. Filter with LLM
    const filteredResults = await filterWithLLM(
      specificResults,
      exploratoryResults,
      foundValues,
      userPrompt
    );
    
    // 6. Inject values into YML
    const finalResults = await injectValuesIntoResults(
      filteredResults,
      foundValues
    );
    
    return {
      message: `Found ${finalResults.length} relevant datasets`,
      specific_queries: params.specific_queries,
      exploratory_topics: params.exploratory_topics,
      duration: Date.now() - startTime,
      results: finalResults,
      data_source_id: dataSourceId
    };
  },
  { name: 'search-data-catalog' }
);
```

### Database Integration

```typescript
async function getPermissionedDatasets(userId: string): Promise<PermissionedDataset[]> {
  // This would integrate with the TypeScript database package
  const userDatasets = await db
    .select({
      id: datasets.id,
      name: datasets.name,
      yml_content: datasets.ymlContent,
      data_source_id: datasets.dataSourceId
    })
    .from(datasets)
    .innerJoin(assetPermissions, eq(assetPermissions.assetId, datasets.id))
    .where(
      and(
        eq(assetPermissions.userId, userId),
        eq(assetPermissions.assetType, 'dataset')
      )
    );
    
  return userDatasets.filter(d => d.yml_content);
}

async function cacheDataSourceInfo(dataSourceId: string): Promise<void> {
  const dataSource = await db
    .select({
      type: dataSources.type
    })
    .from(dataSources)
    .where(eq(dataSources.id, dataSourceId))
    .limit(1);
    
  if (dataSource[0]) {
    // Cache the syntax information in agent state
    await agent.setState('data_source_syntax', dataSource[0].type);
    await agent.setState('data_source_id', dataSourceId);
  }
}
```

### Semantic Search and Ranking

```typescript
async function rankDatasets(
  specificQueries: string[],
  exploratoryTopics: string[],
  datasets: PermissionedDataset[]
) {
  const documents = datasets
    .map(d => d.yml_content)
    .filter(Boolean) as string[];
    
  if (documents.length === 0) {
    return { specificResults: [], exploratoryResults: [] };
  }
  
  // Rank datasets for specific queries
  const specificResults = await Promise.all(
    specificQueries.map(async (query) => {
      const rankedResults = await rerank(query, documents, 35);
      return {
        query,
        datasets: rankedResults.map(r => datasets[r.index])
      };
    })
  );
  
  // Rank datasets for exploratory topics
  const exploratoryResults = await Promise.all(
    exploratoryTopics.map(async (topic) => {
      const rankedResults = await rerank(topic, documents, 35);
      return {
        topic,
        datasets: rankedResults.map(r => datasets[r.index])
      };
    })
  );
  
  return { specificResults, exploratoryResults };
}
```

### LLM Filtering

```typescript
async function filterWithLLM(
  specificResults: any[],
  exploratoryResults: any[],
  foundValues: FoundValueInfo[],
  userPrompt: string
) {
  // Create specialized agents for different filtering tasks
  const specificFilterAgent = new Agent({
    name: 'SpecificFilterAgent',
    model: openai('gpt-4o'),
    instructions: `You are a data catalog expert. Filter datasets based on specific user queries.
    Return only datasets that directly match the user's requirements. Be precise and selective.`
  });

  const exploratoryFilterAgent = new Agent({
    name: 'ExploratoryFilterAgent',
    model: openai('gpt-4o'), 
    instructions: `You are a data discovery expert. Find datasets related to broad topics.
    Include datasets that might be tangentially related. Be more inclusive for exploration.`
  });
  
  // Filter specific query results
  const specificFiltered = await Promise.all(
    specificResults.map(async ({ query, datasets: rankedDatasets }) => {
      return await filterSpecificDatasets(
        query,
        userPrompt,
        rankedDatasets,
        foundValues,
        specificFilterAgent
      );
    })
  );
  
  // Filter exploratory results
  const exploratoryFiltered = await Promise.all(
    exploratoryResults.map(async ({ topic, datasets: rankedDatasets }) => {
      return await filterExploratoryDatasets(
        topic,
        userPrompt,
        rankedDatasets,
        foundValues,
        exploratoryFilterAgent
      );
    })
  );
  
  // Combine and deduplicate results
  const allFiltered = [...specificFiltered.flat(), ...exploratoryFiltered.flat()];
  const uniqueResults = Array.from(
    new Map(allFiltered.map(r => [r.id, r])).values()
  );
  
  return uniqueResults;
}

async function filterSpecificDatasets(
  query: string,
  userPrompt: string,
  datasets: PermissionedDataset[],
  foundValues: FoundValueInfo[],
  agent: Agent
) {
  const prompt = SPECIFIC_LLM_FILTER_PROMPT
    .replace('{user_request}', userPrompt)
    .replace('{query}', query)
    .replace('{datasets_json}', JSON.stringify(datasets, null, 2))
    .replace('{found_values_json}', formatFoundValues(foundValues));
    
  const response = await agent.generate([
    { role: 'user', content: prompt }
  ], {
    output: 'json',
    temperature: 0.0
  });
  
  const result = JSON.parse(response.choices[0].message.content);
  return result.results.map((id: string) => 
    datasets.find(d => d.id === id)
  ).filter(Boolean);
}
```

### Value Search Integration

```typescript
async function performValueSearches(
  searchTerms: string[],
  dataSourceId: string
): Promise<FoundValueInfo[]> {
  if (searchTerms.length === 0) return [];
  
  // Filter out invalid terms
  const validTerms = searchTerms.filter(term => 
    term.length >= 2 && !isTimePeriodTerm(term)
  );
  
  if (validTerms.length === 0) return [];
  
  // Generate embeddings for all terms
  const embeddings = await generateEmbeddingsBatch(validTerms);
  
  // Search values concurrently
  const searchResults = await Promise.all(
    Object.entries(embeddings).map(async ([term, embedding]) => {
      return await storedValues.searchByEmbedding(
        dataSourceId,
        embedding,
        20
      );
    })
  );
  
  // Flatten and deduplicate results
  return searchResults.flat().map(result => ({
    value: result.value,
    database_name: result.database_name,
    schema_name: result.schema_name,
    table_name: result.table_name,
    column_name: result.column_name
  }));
}

async function generateEmbeddingsBatch(texts: string[]): Promise<Record<string, number[]>> {
  // Create specialized agents for different filtering tasks
  const specificFilterAgent = new Agent({
    name: 'SpecificFilterAgent',
    model: openai('gpt-4o'),
    instructions: `You are a data catalog expert. Filter datasets based on specific user queries.
    Return only datasets that directly match the user's requirements. Be precise and selective.`
  });

  const exploratoryFilterAgent = new Agent({
    name: 'ExploratoryFilterAgent',
    model: openai('gpt-4o'), 
    instructions: `You are a data discovery expert. Find datasets related to broad topics.
    Include datasets that might be tangentially related. Be more inclusive for exploration.`
  });
  
  const response = await llmClient.generateEmbeddings({
    model: 'text-embedding-3-small',
    input: texts,
    dimensions: 1536
  });
  
  const result: Record<string, number[]> = {};
  texts.forEach((text, index) => {
    if (response.data[index]) {
      result[text] = response.data[index].embedding;
    }
  });
  
  return result;
}
```

### YAML Processing

```typescript
async function injectValuesIntoResults(
  results: PermissionedDataset[],
  foundValues: FoundValueInfo[]
): Promise<any[]> {
  return await Promise.all(
    results.map(async (result) => {
      if (!result.yml_content) return result;
      
      try {
        const updatedYml = await injectValuesIntoYml(
          result.yml_content,
          foundValues
        );
        
        return {
          ...result,
          yml_content: updatedYml
        };
      } catch (error) {
        console.warn(`Failed to inject values into YML for ${result.id}:`, error);
        return result;
      }
    })
  );
}

async function injectValuesIntoYml(
  ymlContent: string,
  foundValues: FoundValueInfo[]
): Promise<string> {
  const parsedYml = yaml.parse(ymlContent);
  
  // Extract searchable dimensions
  const searchableDimensions = extractSearchableDimensions(parsedYml);
  
  if (searchableDimensions.length === 0) {
    return ymlContent;
  }
  
  // Inject relevant values into searchable dimensions
  for (const dimension of searchableDimensions) {
    const relevantValues = foundValues
      .filter(v => 
        v.table_name === dimension.model_name &&
        v.column_name === dimension.dimension_name
      )
      .map(v => v.value)
      .slice(0, 20); // Limit to 20 values
      
    if (relevantValues.length > 0) {
      // Navigate to the dimension in the YAML and add relevant_values
      const dimensionPath = dimension.dimension_path;
      let current = parsedYml;
      
      for (let i = 0; i < dimensionPath.length - 1; i++) {
        current = current[dimensionPath[i]];
      }
      
      current.relevant_values = relevantValues;
    }
  }
  
  return yaml.stringify(parsedYml);
}
```

## Test Strategy

### Unit Tests (`search-data-catalog.unit.test.ts`)
- Input validation and schema compliance
- Core business logic testing
- Error handling scenarios
- Mock dependency testing
- Semantic ranking logic
- LLM filtering workflows
- Value search functionality
- YAML processing and injection

### Integration Tests (`search-data-catalog.integration.test.ts`)
- Real database/filesystem/API integration
- End-to-end workflow testing
- Performance and concurrent execution
- Security validation
- Cross-tool integration scenarios
- Complex multi-query searches
- Full workflow orchestration

## Implementation Dependencies

### New TypeScript Packages

```json
{
  "dependencies": {
    "yaml": "^2.3.4",
    "@huggingface/inference": "^2.6.4",
    "cohere-ai": "^7.4.0"
  }
}
```

### Missing from TypeScript

1. **Stored Values Search**: Need to implement TypeScript equivalent of Rust stored_values library
2. **Rerank Service**: Need TypeScript client for reranking API
3. **Permission System**: Need to implement dataset_security equivalent
4. **LLM Prompt Management**: Need Braintrust integration for prompt management

## AI Agent Implementation Time

**Estimated Time**: 5 minutes
**Complexity**: Very High

## Implementation Priority

**Very High** - Critical tool for data discovery and analysis workflows.

## Notes

- This tool will require the most coordination across TypeScript packages
- Consider breaking into smaller, composable functions
- Will need extensive performance optimization for large dataset catalogs
- LLM filtering prompts are critical and should be carefully tested
- Value injection into YAML is complex and needs robust error handling
- Consider implementing caching for frequently accessed datasets