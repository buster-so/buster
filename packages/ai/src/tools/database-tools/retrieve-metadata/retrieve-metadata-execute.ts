import { wrapTraced } from 'braintrust';
import {
  RETRIEVE_METADATA_TOOL_NAME,
  type RetrieveMetadataContext,
  type RetrieveMetadataInput,
  type RetrieveMetadataOutput,
} from './retrieve-metadata';

/**
 * Retrieve dataset metadata via API endpoint
 */
async function executeApiRequest(
  dataSourceId: string,
  database: string,
  schema: string,
  name: string,
  context: RetrieveMetadataContext
): Promise<{
  success: boolean;
  data?: RetrieveMetadataOutput;
  error?: string;
}> {
  try {
    // Build query string
    const params = new URLSearchParams({
      dataSourceId,
      database,
      schema,
      name,
    });

    const apiEndpoint = `${context.apiUrl}/api/v2/tools/metadata?${params.toString()}`;

    const response = await fetch(apiEndpoint, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${context.apiKey}`,
      },
    });

    if (!response.ok) {
      // Extract error message from response body
      // API returns errors in format: { error: "detailed message" }
      let errorMessage: string;
      try {
        const errorData = (await response.json()) as { error?: string };
        errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
      } catch {
        // If JSON parsing fails, use status text
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }

      // Log the full error for debugging
      console.error('[retrieve-metadata] API error response:', {
        status: response.status,
        error: errorMessage,
        dataSourceId,
        database,
        schema,
        name,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }

    const result = (await response.json()) as RetrieveMetadataOutput;

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Metadata retrieval failed';

    // Log the exception for debugging
    console.error('[retrieve-metadata] Exception during API request:', {
      error: errorMessage,
      dataSourceId,
      database,
      schema,
      name,
    });

    return {
      success: false,
      error: errorMessage,
    };
  }
}

// Factory function that creates the execute function with proper context typing
export function createRetrieveMetadataExecute(context: RetrieveMetadataContext) {
  return wrapTraced(
    async (input: RetrieveMetadataInput): Promise<RetrieveMetadataOutput> => {
      const { dataSourceId, database, schema, name } = input;

      // Execute API request
      const result = await executeApiRequest(dataSourceId, database, schema, name, context);

      if (result.success && result.data) {
        return result.data;
      }

      // Throw error with clear message - API server handles logging
      throw new Error(result.error || 'Metadata retrieval failed');
    },
    { name: RETRIEVE_METADATA_TOOL_NAME }
  );
}
