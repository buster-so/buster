import type { StoredValueResult } from '@buster/stored-values';
import { generateEmbedding, searchValuesByEmbedding } from '@buster/stored-values/search';
import { Agent, createStep } from '@mastra/core';
import type { RuntimeContext } from '@mastra/core/runtime-context';
import type { CoreMessage } from 'ai';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';
import { thinkAndPrepWorkflowInputSchema } from '../schemas/workflow-schemas';
import { anthropicCachedModel } from '../utils/models/anthropic-cached';
import { appendToConversation, standardizeMessages } from '../utils/standardizeMessages';
import type { AnalystRuntimeContext } from '../workflows/analyst-workflow';

const inputSchema = thinkAndPrepWorkflowInputSchema;

// Agent output schema - only for extracting values
const extractValuesAgentOutputSchema = z.object({
  values: z.array(z.string()).describe('The values that the agent will search for.'),
});

// Step output schema - what the step returns after performing the search
export const extractValuesSearchOutputSchema = z.object({
  values: z.array(z.string()).describe('The values that the agent will search for.'),
  searchResults: z
    .string()
    .describe('Formatted search results message for relevant database values.'),
  foundValues: z
    .record(z.record(z.array(z.string())))
    .describe('Structured results organized by schema.table.column'),
  searchPerformed: z.boolean().describe('Whether stored values search was actually performed'),
  // Pass through dashboard context
  dashboardFiles: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        versionNumber: z.number(),
        metricIds: z.array(z.string()),
      })
    )
    .optional(),
});

const extractValuesInstructions = `
You are a Values Parser Agent. Your primary goal is to identify and extract concrete values/entities mentioned in the user request that are likely to appear as actual values in database columns.

**Core Task**: Extract specific, meaningful values from the user's request that could be used for database searches.

**What TO Extract (Focus on these types of values)**:
- **Product names**: "Red Bull", "iPhone 15", "Nike Air Max"
- **Company names**: "Acme Corp", "Google", "Microsoft"
- **People's names**: "John Smith", "Sarah Johnson"
- **Locations**: "California", "Europe", "New York", "San Francisco"
- **Categories/Segments**: "Premium tier", "Enterprise", "VIP"
- **Status values**: "completed", "pending", "active", "cancelled"
- **Features**: "waterproof", "wireless", "organic"
- **Industry terms**: "B2B", "SaaS", "e-commerce"
- **Brand names**: "Nike", "Adidas", "Apple"
- **Specific models/versions**: "Version 2.0", "Model X"

**What NOT TO Extract (Avoid these)**:
- **General concepts**: "revenue", "customers", "sales", "profit"
- **Time periods**: "last month", "Q1", "yesterday", "2024"
- **Generic attributes**: "name", "id", "description", "count"
- **Common words**: "the", "and", "with", "for"
- **Numbers without context**: "123", "45.6", "1000"
- **Generic IDs**: UUIDs like "9711ca55-...", database keys like "cust_12345"
- **Composite strings with non-semantic identifiers**: For "ticket 1a2b3c", only extract "ticket" if it's meaningful as a category

**Instructions**:
1. Carefully read the user's request
2. Identify any specific, distinctive values that have inherent business meaning
3. Extract only values that could realistically appear as data in database columns
4. Return an array of these extracted values
5. If no meaningful values are found, return an empty array

**Examples**:
- Input: "Show me sales for Red Bull in California"
  Output: ["Red Bull", "California"]
  
- Input: "What's the revenue trend for our Premium tier customers?"
  Output: ["Premium tier"]
  
- Input: "Compare Nike vs Adidas performance"
  Output: ["Nike", "Adidas"]
  
- Input: "Show me last month's revenue"
  Output: [] (no specific values, just time period and metric)

Focus only on extracting meaningful, specific values that could be searched for in a database.
`;

/**
 * Organizes search results by schema.table structure with columns and their values
 */
function organizeResultsBySchemaTable(
  results: StoredValueResult[]
): Record<string, Record<string, string[]>> {
  const organized: Record<string, Record<string, string[]>> = {};

  for (const result of results) {
    const schemaTable = `${result.schema_name}.${result.table_name}`;
    const column = result.column_name;

    if (!organized[schemaTable]) {
      organized[schemaTable] = {};
    }

    if (!organized[schemaTable][column]) {
      organized[schemaTable][column] = [];
    }

    // Add value if not already present - show all results
    if (!organized[schemaTable][column].includes(result.value)) {
      organized[schemaTable][column].push(result.value);
    }
  }

  return organized;
}

/**
 * Formats search results into the specified message format
 */
function formatSearchResults(results: StoredValueResult[]): string {
  const organized = organizeResultsBySchemaTable(results);

  if (Object.keys(organized).length === 0) {
    return '';
  }

  let message = 'Searched for and found these relevant values:\n\n';

  for (const [schemaTable, columns] of Object.entries(organized)) {
    message += `${schemaTable}\n`;
    for (const [column, values] of Object.entries(columns)) {
      if (values.length > 0) {
        message += `${column} [${values.join(', ')}]\n`;
      }
    }
    message += '\n';
  }

  return message.trim();
}

/**
 * Searches for stored values for all extracted keywords concurrently
 * Designed to never throw errors - will always return a valid response
 */
async function searchStoredValues(
  values: string[],
  dataSourceId: string
): Promise<{
  searchResults: string;
  foundValues: Record<string, Record<string, string[]>>;
  searchPerformed: boolean;
}> {
  // Early return for missing inputs - not an error condition
  if (values.length === 0 || !dataSourceId) {
    return {
      searchResults: '',
      foundValues: {},
      searchPerformed: false,
    };
  }

  try {
    // Generate embeddings for all keywords concurrently with individual error handling
    const embeddingPromises = values.map(async (value) => {
      try {
        const embedding = await generateEmbedding([value]);
        return { value, embedding };
      } catch (error) {
        console.error(
          `[StoredValues] Failed to generate embedding for "${value}":`,
          error instanceof Error ? error.message : 'Unknown error'
        );
        return null;
      }
    });

    const embeddingResults = await Promise.all(embeddingPromises);
    const validEmbeddings = embeddingResults.filter(
      (result): result is { value: string; embedding: number[] } => result !== null
    );

    if (validEmbeddings.length === 0) {
      console.warn('[StoredValues] No valid embeddings generated, skipping search');
      return {
        searchResults: '',
        foundValues: {},
        searchPerformed: false,
      };
    }

    // Search for values using each embedding concurrently with individual error handling
    const searchPromises = validEmbeddings.map(async ({ value, embedding }) => {
      try {
        const results = await searchValuesByEmbedding(dataSourceId, embedding, { limit: 30 });
        return results;
      } catch (error) {
        console.error(
          `[StoredValues] Failed to search stored values for "${value}":`,
          error instanceof Error ? error.message : 'Unknown error'
        );
        return [];
      }
    });

    const searchResults = await Promise.all(searchPromises);
    const allResults = searchResults.flat();

    // Format results (these functions are pure and shouldn't throw)
    const searchMessage = formatSearchResults(allResults);
    const structuredResults = organizeResultsBySchemaTable(allResults);

    return {
      searchResults: searchMessage,
      foundValues: structuredResults,
      searchPerformed: true,
    };
  } catch (error) {
    // Catch-all for any unexpected errors - should never break the workflow
    console.error('[StoredValues] Unexpected error during stored values search:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      valuesCount: values.length,
      dataSourceId: dataSourceId ? `${dataSourceId.substring(0, 8)}...` : 'undefined',
    });

    return {
      searchResults: '',
      foundValues: {},
      searchPerformed: false,
    };
  }
}

const valuesAgent = new Agent({
  name: 'Extract Values',
  instructions: extractValuesInstructions,
  model: anthropicCachedModel('claude-3-5-haiku-20241022'),
});

const extractValuesSearchStepExecution = async ({
  inputData,
  runtimeContext,
}: {
  inputData: z.infer<typeof inputSchema>;
  runtimeContext: RuntimeContext<AnalystRuntimeContext>;
}): Promise<z.infer<typeof extractValuesSearchOutputSchema>> => {
  try {
    // Use the input data directly
    const prompt = inputData.prompt;
    const conversationHistory = inputData.conversationHistory;

    // Prepare messages for the agent
    let messages: CoreMessage[];
    if (conversationHistory && conversationHistory.length > 0) {
      // Use conversation history as context + append new user message
      messages = appendToConversation(conversationHistory as CoreMessage[], prompt);
    } else {
      // Otherwise, use just the prompt
      messages = standardizeMessages(prompt);
    }

    const tracedValuesExtraction = wrapTraced(
      async () => {
        const response = await valuesAgent.generate(messages, {
          maxSteps: 0,
          output: extractValuesAgentOutputSchema, // Use the agent-specific schema
        });

        return response.object;
      },
      {
        name: 'Extract Values',
      }
    );

    const extractedValues = await tracedValuesExtraction();

    // Get dataSourceId from runtime context for stored values search
    const dataSourceId = runtimeContext.get('dataSourceId') as string | undefined;

    // Perform stored values search if we have extracted values and a dataSourceId
    const storedValuesResult = await searchStoredValues(extractedValues.values, dataSourceId || '');

    return {
      values: extractedValues.values,
      searchResults: storedValuesResult.searchResults,
      foundValues: storedValuesResult.foundValues,
      searchPerformed: storedValuesResult.searchPerformed,
      dashboardFiles: inputData.dashboardFiles, // Pass through dashboard context
    };
  } catch (error) {
    // Handle AbortError gracefully
    if (error instanceof Error && error.name === 'AbortError') {
      // Return empty values when aborted
      return {
        values: [],
        searchResults: '',
        foundValues: {},
        searchPerformed: false,
        dashboardFiles: inputData.dashboardFiles, // Pass through dashboard context
      };
    }

    console.error('Failed to extract values:', error);
    // Return empty values array instead of crashing
    return {
      values: [],
      searchResults: '',
      foundValues: {},
      searchPerformed: false,
    };
  }
};

export const extractValuesSearchStep = createStep({
  id: 'extract-values-search',
  description: 'This step is a single llm call to quickly extract values from the user request.',
  inputSchema,
  outputSchema: extractValuesSearchOutputSchema,
  execute: extractValuesSearchStepExecution,
});
