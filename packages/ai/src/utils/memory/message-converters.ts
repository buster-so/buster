import type { AssistantContent } from 'ai';
import type {
  BusterChatMessageReasoning,
  BusterChatMessageReasoning_file,
  BusterChatMessageReasoning_files,
  BusterChatMessageReasoning_pills,
  BusterChatMessageReasoning_status,
  BusterChatMessageReasoning_text,
  BusterChatMessageResponse,
  BusterChatResponseMessage_file,
  BusterChatResponseMessage_text,
} from 'web/src/api/asset_interfaces/chat/chatMessageInterfaces';
import { z } from 'zod';

// Extract ToolCall type from AssistantContent
type ToolCall = Extract<AssistantContent, { type: 'tool-call' }>;

// Tool result schemas
const DoneToolResultSchema = z.object({
  message: z.string(),
});

const RespondWithoutAnalysisResultSchema = z.object({
  message: z.string(),
});

const SequentialThinkingResultSchema = z.object({
  thought: z.string(),
  thoughtNumber: z.number(),
  totalThoughts: z.number(),
  nextThoughtNeeded: z.boolean(),
});

const CreateMetricsFileResultSchema = z.object({
  files: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      version_number: z.number(),
      yml_content: z.string(),
    })
  ),
  failed_files: z.array(
    z.object({
      name: z.string(),
      error: z.string(),
    })
  ),
});

const CreateDashboardFileResultSchema = z.object({
  files: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      version_number: z.number(),
      yml_content: z.string(),
    })
  ),
  failed_files: z.array(
    z.object({
      name: z.string(),
      error: z.string(),
    })
  ),
});

const ModifyFilesResultSchema = z.object({
  files: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      version_number: z.number(),
      yml_content: z.string(),
    })
  ),
  failed_files: z.array(
    z.object({
      file_name: z.string(),
      error: z.string(),
    })
  ),
});

const ExecuteSqlResultSchema = z.object({
  data: z.array(z.record(z.string(), z.string().or(z.number()).or(z.boolean()).or(z.null()))),
  query: z.string(),
  rowCount: z.number(),
});

// Type for parsed tool results
type ParsedToolResult =
  | z.infer<typeof DoneToolResultSchema>
  | z.infer<typeof RespondWithoutAnalysisResultSchema>
  | z.infer<typeof SequentialThinkingResultSchema>
  | z.infer<typeof CreateMetricsFileResultSchema>
  | z.infer<typeof CreateDashboardFileResultSchema>
  | z.infer<typeof ModifyFilesResultSchema>
  | z.infer<typeof ExecuteSqlResultSchema>
  | Record<string, string | number | boolean>;

/**
 * Converts a tool call to a reasoning or response message based on the tool name
 * @param toolCall The tool call to convert
 * @param toolResult The result from executing the tool
 * @param status The current status of the tool execution
 * @returns Either a reasoning message or response message, or null if not applicable
 */
export function convertToolCallToMessage(
  toolCall: ToolCall,
  toolResult: ParsedToolResult | string | null,
  status: BusterChatMessageReasoning_status = 'completed'
): {
  type: 'reasoning' | 'response';
  message: BusterChatMessageReasoning | BusterChatMessageResponse;
} | null {
  if (!toolCall || typeof toolCall !== 'object') {
    console.error('convertToolCallToMessage: Invalid toolCall:', toolCall);
    return null;
  }

  const toolName =
    'toolName' in toolCall && typeof toolCall.toolName === 'string' ? toolCall.toolName : '';
  const toolId =
    'toolCallId' in toolCall && typeof toolCall.toolCallId === 'string' ? toolCall.toolCallId : '';

  switch (toolName) {
    case 'doneTool':
    case 'done-tool': {
      // DUN tool generates a response message
      try {
        const parsed = DoneToolResultSchema.parse(toolResult);
        const responseMessage: BusterChatResponseMessage_text = {
          id: toolId,
          type: 'text',
          message: parsed.message,
        };
        return { type: 'response', message: responseMessage };
      } catch (error) {
        console.error('Failed to parse tool result:', error, toolResult);
        return null;
      }
    }

    case 'respondWithoutAnalysis':
    case 'respond-without-analysis': {
      // Respond Without Analysis generates a response message
      try {
        const parsed = RespondWithoutAnalysisResultSchema.parse(toolResult);
        const responseMessage: BusterChatResponseMessage_text = {
          id: toolId,
          type: 'text',
          message: parsed.message
        };
        return { type: 'response', message: responseMessage };
      } catch (error) {
        console.error(`Failed to parse tool result:`, error, toolResult);
        return null;
      }
    }

    case 'sequentialThinking':
    case 'sequential-thinking': {
      // Sequential thinking generates a reasoning text message
      try {
        const parsed = SequentialThinkingResultSchema.parse(toolResult);
        const reasoningMessage: BusterChatMessageReasoning_text = {
          id: toolId,
          type: 'text',
          title: `Thought ${parsed.thoughtNumber} of ${parsed.totalThoughts}`,
          secondary_title: undefined,
          message: parsed.thought,
          status,
          finished_reasoning: !parsed.nextThoughtNeeded,
        };
        return { type: 'reasoning', message: reasoningMessage };
      } catch (error) {
        console.error(`Failed to parse tool result:`, error, toolResult);
        return null;
      }
    }

    case 'createMetricsFile':
    case 'create-metrics-file': {
      // Create metrics generates a reasoning files message
      try {
        const parsed = CreateMetricsFileResultSchema.parse(toolResult);
        const files: Record<string, BusterChatMessageReasoning_file> = {};
        const fileIds: string[] = [];

        // Process successful files
        for (const file of parsed.files) {
          fileIds.push(file.id);
          files[file.id] = {
            id: file.id,
            file_type: 'metric' as const,
            file_name: file.name,
            version_number: file.version_number,
            status: 'completed',
            file: {
              text: file.yml_content,
              text_chunk: undefined,
              modified: undefined,
            },
          };
        }

        // Process failed files
        for (const failedFile of parsed.failed_files) {
          const failedId = `failed-${Date.now()}-${failedFile.name}`;
          fileIds.push(failedId);
          files[failedId] = {
            id: failedId,
            file_type: 'metric' as const,
            file_name: failedFile.name,
            version_number: 0,
            status: 'failed',
            file: {
              text: `Error: ${failedFile.error}`,
            },
          };
        }

        const reasoningMessage: BusterChatMessageReasoning_files = {
          id: toolId,
          type: 'files',
          title: `Created ${parsed.files.length} metric${parsed.files.length === 1 ? '' : 's'}`,
          status,
          secondary_title:
            parsed.failed_files.length > 0 ? `${parsed.failed_files.length} failed` : undefined,
          file_ids: fileIds,
          files,
        };
        return { type: 'reasoning', message: reasoningMessage };
      } catch (error) {
        console.error(`Failed to parse tool result:`, error, toolResult);
        return null;
      }
    }

    case 'executeSql':
    case 'execute-sql': {
      // Execute SQL generates a reasoning text message
      try {
        const parsed = ExecuteSqlResultSchema.parse(toolResult);
        const reasoningMessage: BusterChatMessageReasoning_text = {
          id: toolId,
          type: 'text',
          title: 'Executed SQL Query',
          secondary_title: `${parsed.rowCount} rows returned`,
          message: `Query: ${parsed.query}\n\nReturned ${parsed.rowCount} rows`,
          status,
        };
        return { type: 'reasoning', message: reasoningMessage };
      } catch (error) {
        console.error(`Failed to parse tool result:`, error, toolResult);
        return null;
      }
    }

    case 'createDashboardsFile':
    case 'create-dashboards-file': {
      // Create dashboards generates a reasoning files message
      try {
        const parsed = CreateDashboardFileResultSchema.parse(toolResult);
        const files: Record<string, BusterChatMessageReasoning_file> = {};
        const fileIds: string[] = [];

        // Process successful files
        for (const file of parsed.files) {
          fileIds.push(file.id);
          files[file.id] = {
            id: file.id,
            file_type: 'dashboard' as const,
            file_name: file.name,
            version_number: file.version_number,
            status: 'completed',
            file: {
              text: file.yml_content,
              text_chunk: undefined,
              modified: undefined,
            },
          };
        }

        // Process failed files
        for (const failedFile of parsed.failed_files) {
          const failedId = `failed-${Date.now()}-${failedFile.name}`;
          fileIds.push(failedId);
          files[failedId] = {
            id: failedId,
            file_type: 'dashboard' as const,
            file_name: failedFile.name,
            version_number: 0,
            status: 'failed',
            file: {
              text: `Error: ${failedFile.error}`,
            },
          };
        }

        const reasoningMessage: BusterChatMessageReasoning_files = {
          id: toolId,
          type: 'files',
          title: `Created ${parsed.files.length} dashboard${parsed.files.length === 1 ? '' : 's'}`,
          status,
          secondary_title:
            parsed.failed_files.length > 0 ? `${parsed.failed_files.length} failed` : undefined,
          file_ids: fileIds,
          files,
        };
        return { type: 'reasoning', message: reasoningMessage };
      } catch (error) {
        console.error(`Failed to parse tool result:`, error, toolResult);
        return null;
      }
    }

    case 'modifyMetricsFile':
    case 'modify-metrics-file': {
      // Modify metrics generates a reasoning files message
      try {
        const parsed = ModifyFilesResultSchema.parse(toolResult);
        const files: Record<string, BusterChatMessageReasoning_file> = {};
        const fileIds: string[] = [];

        // Process successful files
        for (const file of parsed.files) {
          fileIds.push(file.id);
          files[file.id] = {
            id: file.id,
            file_type: 'metric' as const,
            file_name: file.name,
            version_number: file.version_number,
            status: 'completed',
            file: {
              text: file.yml_content,
              text_chunk: undefined,
              modified: undefined,
            },
          };
        }

        // Process failed files
        for (const failedFile of parsed.failed_files) {
          const failedId = `failed-${Date.now()}-${failedFile.file_name}`;
          fileIds.push(failedId);
          files[failedId] = {
            id: failedId,
            file_type: 'metric' as const,
            file_name: failedFile.file_name,
            version_number: 0,
            status: 'failed',
            file: {
              text: `Error: ${failedFile.error}`,
            },
          };
        }

        const reasoningMessage: BusterChatMessageReasoning_files = {
          id: toolId,
          type: 'files',
          title: `Modified ${parsed.files.length} metric${parsed.files.length === 1 ? '' : 's'}`,
          status,
          secondary_title:
            parsed.failed_files.length > 0 ? `${parsed.failed_files.length} failed` : undefined,
          file_ids: fileIds,
          files,
        };
        return { type: 'reasoning', message: reasoningMessage };
      } catch (error) {
        console.error(`Failed to parse tool result:`, error, toolResult);
        return null;
      }
    }

    case 'modifyDashboardsFile':
    case 'modify-dashboards-file': {
      // Modify dashboards generates a reasoning files message
      try {
        const parsed = ModifyFilesResultSchema.parse(toolResult);
        const files: Record<string, BusterChatMessageReasoning_file> = {};
        const fileIds: string[] = [];

        // Process successful files
        for (const file of parsed.files) {
          fileIds.push(file.id);
          files[file.id] = {
            id: file.id,
            file_type: 'dashboard' as const,
            file_name: file.name,
            version_number: file.version_number,
            status: 'completed',
            file: {
              text: file.yml_content,
              text_chunk: undefined,
              modified: undefined,
            },
          };
        }

        // Process failed files
        for (const failedFile of parsed.failed_files) {
          const failedId = `failed-${Date.now()}-${failedFile.file_name}`;
          fileIds.push(failedId);
          files[failedId] = {
            id: failedId,
            file_type: 'dashboard' as const,
            file_name: failedFile.file_name,
            version_number: 0,
            status: 'failed',
            file: {
              text: `Error: ${failedFile.error}`,
            },
          };
        }

        const reasoningMessage: BusterChatMessageReasoning_files = {
          id: toolId,
          type: 'files',
          title: `Modified ${parsed.files.length} dashboard${parsed.files.length === 1 ? '' : 's'}`,
          status,
          secondary_title:
            parsed.failed_files.length > 0 ? `${parsed.failed_files.length} failed` : undefined,
          file_ids: fileIds,
          files,
        };
        return { type: 'reasoning', message: reasoningMessage };
      } catch (error) {
        console.error(`Failed to parse tool result:`, error, toolResult);
        return null;
      }
    }

    default:
      // Unknown tool, return null
      return null;
  }
}

/**
 * Extract tool calls from a step result and convert them to messages
 * @param toolCalls Array of tool calls from the step
 * @param toolResults Map of tool call IDs to their results
 * @returns Object containing arrays of reasoning and response messages
 */
export function extractMessagesFromToolCalls(
  toolCalls: ToolCall[],
  toolResults: Map<string, ParsedToolResult | string | null> = new Map()
): {
  reasoningMessages: BusterChatMessageReasoning[];
  responseMessages: BusterChatMessageResponse[];
} {
  const reasoningMessages: BusterChatMessageReasoning[] = [];
  const responseMessages: BusterChatMessageResponse[] = [];

  for (const toolCall of toolCalls) {
    if (!toolCall || !('toolCallId' in toolCall)) {
      console.error('extractMessagesFromToolCalls: Invalid toolCall:', toolCall);
      continue;
    }

    const toolResult = toolResults.get(toolCall.toolCallId);
    const converted = convertToolCallToMessage(toolCall, toolResult || null, 'completed');

    if (converted) {
      if (converted.type === 'reasoning') {
        reasoningMessages.push(converted.message as BusterChatMessageReasoning);
      } else {
        responseMessages.push(converted.message as BusterChatMessageResponse);
      }
    }
  }

  return { reasoningMessages, responseMessages };
}
