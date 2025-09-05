import { generateSingleValueEmbedding } from '@buster/ai/embeddings/generate-embeddings';
import { type SearchResult, searchSimilarValues } from '@buster/search';
import type { ModelMessage } from 'ai';
import { z } from 'zod';
import { extractValuesWithLLM } from './extract-values-with-llm';

// Zod schemas first - following Zod-first approach
export const extractValuesSearchParamsSchema = z.object({
  messages: z.array(z.custom<ModelMessage>()).describe('The conversation history'),
  dataSourceId: z.string().optional().describe('The data source ID for stored values search'),
});

export const extractValuesSearchResultSchema = z.object({
  values: z.array(z.string()).describe('The values that were extracted from the prompt'),
  messages: z
    .array(z.custom<ModelMessage>())
    .describe('Tool call and result messages for the extraction'),
});

// Export types from schemas
export type ExtractValuesSearchParams = z.infer<typeof extractValuesSearchParamsSchema>;
export type ExtractValuesSearchResult = z.infer<typeof extractValuesSearchResultSchema>;

/**
 * Organizes search results by schema.table structure with columns and their values
 */
function organizeResultsBySchemaTable(
  results: SearchResult[]
): Record<string, Record<string, string[]>> {
  const organized: Record<string, Record<string, string[]>> = {};

  for (const result of results) {
    const schemaTable = `${result.schema}.${result.table}`;
    const column = result.column;

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
function formatSearchResults(results: SearchResult[]): string {
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
        const embedding = await generateSingleValueEmbedding(value);
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
        const searchResponse = await searchSimilarValues(
          {
            dataSourceId,
            query: value,
            limit: 50,
          },
          embedding
        );
        return searchResponse.results;
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

export async function runExtractValuesAndSearchStep(
  params: ExtractValuesSearchParams
): Promise<ExtractValuesSearchResult> {
  try {
    const { messages, dataSourceId } = params;

    // Get the last user message as the prompt
    const lastUserMessage = messages.findLast((msg) => msg.role === 'user');
    const prompt = typeof lastUserMessage?.content === 'string' ? lastUserMessage.content : '';

    // Extract values using LLM
    const extractedValues = await extractValuesWithLLM(prompt, messages);

    // Perform stored values search if we have extracted values and a dataSourceId
    const storedValuesResult = await searchStoredValues(extractedValues, dataSourceId || '');

    // Generate a unique ID for this tool call
    const toolCallId = `extract_values_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create tool call and result messages
    const resultMessages: ModelMessage[] = [];

    // Add assistant message with tool call
    resultMessages.push({
      role: 'assistant',
      content: [
        {
          type: 'tool-call',
          toolCallId,
          toolName: 'extractValues',
          input: { prompt },
        },
      ],
    });

    // Add tool result message
    resultMessages.push({
      role: 'tool',
      content: [
        {
          type: 'tool-result',
          toolCallId,
          toolName: 'extractValues',
          output: {
            type: 'text',
            value: JSON.stringify({
              values: extractedValues,
              searchResults: storedValuesResult.searchResults || '',
            }),
          },
        },
      ],
    });

    return {
      values: extractedValues,
      messages: resultMessages,
    };
  } catch (error) {
    // Handle AbortError gracefully
    if (error instanceof Error && error.name === 'AbortError') {
      console.info('[ExtractValues] Operation was aborted');
      // Return empty object when aborted
      return {
        values: [],
        messages: [],
      };
    }

    console.error('[ExtractValues] Unexpected error:', error);
    // Return empty object instead of crashing
    return {
      values: [],
      messages: [],
    };
  }
}
