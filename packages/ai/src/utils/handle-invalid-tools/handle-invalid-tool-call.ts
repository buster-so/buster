import type { LanguageModelV1FunctionToolCall } from '@ai-sdk/provider';
import {
  APICallError,
  EmptyResponseBodyError,
  InvalidResponseDataError,
  type InvalidToolArgumentsError,
  JSONParseError,
  NoContentGeneratedError,
  NoObjectGeneratedError,
  NoSuchToolError,
  RetryError,
  type ToolSet,
} from 'ai';

const handleInvalidToolCall = async <TOOLS extends ToolSet>({
  toolCall,
  tools,
  error,
}: {
  toolCall: LanguageModelV1FunctionToolCall;
  tools: TOOLS;
  error:
    | NoSuchToolError
    | InvalidToolArgumentsError
    | EmptyResponseBodyError
    | APICallError
    | NoContentGeneratedError
    | NoObjectGeneratedError
    | RetryError
    | JSONParseError
    | InvalidResponseDataError;
}): Promise<LanguageModelV1FunctionToolCall | null> => {
  // Handle NoSuchToolError - LLM called a non-existent tool
  if (NoSuchToolError.isInstance(error)) {
    const availableTools = Object.keys(tools).join(', ');
    return {
      ...toolCall,
      args: JSON.stringify({
        message: `That tool isn't available right now, but you can access: ${availableTools}. Please use one of the available tools instead.`,
      }),
    };
  }

  // Handle EmptyResponseBodyError - Server returned empty response
  if (EmptyResponseBodyError.isInstance(error)) {
    return {
      ...toolCall,
      args: JSON.stringify({
        message:
          'The service returned an empty response. This might be due to a temporary issue or your request being too complex. Please try rephrasing your request or breaking it into smaller, simpler parts.',
        suggestion: 'Try a simpler or more specific request',
        error_type: 'empty_response',
      }),
    };
  }

  // Handle APICallError - Check if it's recoverable based on status code
  if (APICallError.isInstance(error)) {
    const statusCode = (error as any).statusCode;

    // Critical errors - service issues that LLM can't fix
    if (!statusCode || statusCode >= 500 || statusCode === 401 || statusCode === 403) {
      console.error('Critical API error, stopping stream:', error);
      throw error; // Let this error propagate to stop the stream
    }

    // Recoverable errors - request issues the LLM might fix
    if (statusCode >= 400 && statusCode < 500) {
      return {
        ...toolCall,
        args: JSON.stringify({
          message: `The API request failed with status ${statusCode}. This suggests an issue with the request format or parameters. Please review your request and try again with different parameters or a simpler approach.`,
          suggestion: 'Modify your request parameters or try a different approach',
          error_type: 'api_call_error',
          status_code: statusCode,
        }),
      };
    }
  }

  // Handle NoContentGeneratedError - LLM failed to generate content
  if (NoContentGeneratedError.isInstance(error)) {
    return {
      ...toolCall,
      args: JSON.stringify({
        message:
          'No content was generated for your request. This could be due to the request being too vague, too complex, or hitting content filters. Please try rephrasing your request with more specific details or a different approach.',
        suggestion: 'Be more specific in your request or try a different approach',
        error_type: 'no_content_generated',
      }),
    };
  }

  // Handle NoObjectGeneratedError - LLM failed to generate structured data
  if (NoObjectGeneratedError.isInstance(error)) {
    return {
      ...toolCall,
      args: JSON.stringify({
        message:
          'Failed to generate the requested structured data. This might be because the request was too complex or the format requirements were unclear. Please try simplifying your request or being more explicit about the expected format.',
        suggestion: 'Simplify your request or provide clearer format requirements',
        error_type: 'no_object_generated',
      }),
    };
  }

  // Handle JSONParseError - Response couldn't be parsed as JSON
  if (JSONParseError.isInstance(error)) {
    return {
      ...toolCall,
      args: JSON.stringify({
        message:
          "The response couldn't be parsed as valid JSON. This suggests the generated content wasn't properly formatted. Please try generating your response in a simpler, more structured format.",
        suggestion: 'Generate simpler, well-formatted JSON or use a different output format',
        error_type: 'json_parse_error',
      }),
    };
  }

  // Handle InvalidResponseDataError - Response data doesn't match expected format
  if (InvalidResponseDataError.isInstance(error)) {
    return {
      ...toolCall,
      args: JSON.stringify({
        message:
          "The response data doesn't match the expected format. Please review the requirements and try generating content that follows the expected structure more closely.",
        suggestion: 'Review format requirements and try again with proper structure',
        error_type: 'invalid_response_data',
      }),
    };
  }

  // Handle RetryError - Multiple attempts failed (usually critical)
  if (RetryError.isInstance(error)) {
    console.error('Retry error after multiple attempts, stopping stream:', error);
    throw error; // Let this error propagate as it indicates persistent issues
  }

  // Handle InvalidToolArgumentsError by providing corrected arguments
  if (error instanceof Error && error.message.includes('Invalid tool arguments')) {
    try {
      return {
        ...toolCall,
        args: JSON.stringify({
          message: `Invalid arguments provided. Error: ${error.message}. Please retry with valid arguments that match the tool's expected format.`,
          originalArgs: toolCall.args,
          error: error.message,
          suggestion: 'Check the tool definition and provide arguments in the correct format',
          error_type: 'invalid_tool_arguments',
        }),
      };
    } catch (fallbackError) {
      console.error('Failed to create fallback tool call:', fallbackError);
      return {
        ...toolCall,
        args: JSON.stringify({
          message:
            'Tool call failed with invalid arguments. Please retry with properly formatted arguments.',
          error_type: 'invalid_tool_arguments',
        }),
      };
    }
  }

  // For any other error types, provide a generic recovery message
  return {
    ...toolCall,
    args: JSON.stringify({
      message: `An unexpected error occurred: ${error.message}. Please try a different approach or simplify your request.`,
      error: error.message,
      suggestion: 'Try a different approach or contact support if the issue persists',
      error_type: 'unknown',
    }),
  };
};

export { handleInvalidToolCall };
