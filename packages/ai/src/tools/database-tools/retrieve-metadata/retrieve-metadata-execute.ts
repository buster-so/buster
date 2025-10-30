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
    console.info('[retrieve-metadata] Starting API request', {
      dataSourceId,
      database,
      schema,
      name,
      apiUrl: context.apiUrl,
    });

    // Build query string
    const params = new URLSearchParams({
      dataSourceId,
      database,
      schema,
      name,
    });

    const apiEndpoint = `${context.apiUrl}/api/v2/tools/metadata?${params.toString()}`;

    console.info('[retrieve-metadata] Sending request to API', {
      apiEndpoint,
      dataSourceId,
    });

    const response = await fetch(apiEndpoint, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${context.apiKey}`,
      },
    });

    console.info('[retrieve-metadata] Received API response', {
      dataSourceId,
      status: response.status,
      ok: response.ok,
      statusText: response.statusText,
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

    const metadata = result.metadata as Record<string, unknown>;
    const columnProfiles = Array.isArray(metadata?.columnProfiles) ? metadata.columnProfiles : [];

    console.info('[retrieve-metadata] Successfully parsed API response', {
      dataSourceId,
      hasMetadata: !!result.metadata,
      rowCount: metadata?.rowCount,
      sampleSize: metadata?.sampleSize,
      columnCount: columnProfiles.length,
    });

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Metadata retrieval failed';

    // Log the exception for debugging
    console.error('[retrieve-metadata] Exception during API request:', {
      error,
      errorMessage,
      errorStack: error instanceof Error ? error.stack : undefined,
      errorName: error instanceof Error ? error.constructor.name : typeof error,
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

      console.info('[retrieve-metadata] Tool execute called', {
        dataSourceId,
        database,
        schema,
        name,
      });

      // Execute API request
      const result = await executeApiRequest(dataSourceId, database, schema, name, context);

      if (result.success && result.data) {
        console.info('[retrieve-metadata] Tool execution successful', {
          dataSourceId,
          database,
          schema,
          name,
        });
        return result.data;
      }

      // Throw error with clear message - API server handles logging
      console.error('[retrieve-metadata] Tool execution failed', {
        dataSourceId,
        database,
        schema,
        name,
        error: result.error,
      });
      throw new Error(result.error || 'Metadata retrieval failed');
    },
    { name: RETRIEVE_METADATA_TOOL_NAME }
  );
}
