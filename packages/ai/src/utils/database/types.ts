import type { CoreMessage, TextStreamPart, ToolSet } from 'ai';
import { z } from 'zod';

/**
 * Type-safe ToolSet definition for our use case
 * Allows any record of tool names to tool definitions
 */
export type GenericToolSet = ToolSet;

/**
 * Specific content types for assistant messages
 * These replace the loose `Array<{ type: string; [key: string]: unknown }>` typing
 */
export type TextContent = {
  type: 'text';
  text: string;
};

export type ToolCallContent = {
  type: 'tool-call';
  toolCallId: string;
  toolName: string;
  args: Record<string, unknown>;
};

export type ToolResultContent = {
  type: 'tool-result';
  toolCallId: string;
  toolName: string;
  result: unknown;
};

/**
 * Union type for all possible content types in assistant messages
 */
export type AssistantMessageContent = TextContent | ToolCallContent;

/**
 * Type-safe assistant message with proper content typing
 */
export type TypedAssistantMessage = {
  role: 'assistant';
  content: AssistantMessageContent[];
};

/**
 * Type-safe tool result message
 */
export type TypedToolMessage = {
  role: 'tool';
  content: ToolResultContent[];
};

/**
 * Tool call tracking interface with proper typing
 */
export interface ToolCallInProgress {
  toolCallId: string;
  toolName: string;
  argsText: string;
  args?: Record<string, unknown>;
}

/**
 * Type guards for content types
 */
export function isTextContent(content: unknown): content is TextContent {
  return (
    typeof content === 'object' &&
    content !== null &&
    'type' in content &&
    content.type === 'text' &&
    'text' in content &&
    typeof (content as { text: unknown }).text === 'string'
  );
}

export function isToolCallContent(content: unknown): content is ToolCallContent {
  return (
    typeof content === 'object' &&
    content !== null &&
    'type' in content &&
    content.type === 'tool-call' &&
    'toolCallId' in content &&
    'toolName' in content &&
    'args' in content
  );
}

export function isToolResultContent(content: unknown): content is ToolResultContent {
  return (
    typeof content === 'object' &&
    content !== null &&
    'type' in content &&
    content.type === 'tool-result' &&
    'toolCallId' in content &&
    'toolName' in content &&
    'result' in content
  );
}

/**
 * Type predicates for streaming chunk types based on AI SDK structure
 */
export type TextDeltaChunk<T extends ToolSet = GenericToolSet> = Extract<
  TextStreamPart<T>,
  { type: 'text-delta' }
>;

export type ToolCallChunk<T extends ToolSet = GenericToolSet> = Extract<
  TextStreamPart<T>,
  { type: 'tool-call' }
>;

export type ToolCallStreamingStartChunk<T extends ToolSet = GenericToolSet> = Extract<
  TextStreamPart<T>,
  { type: 'tool-call-streaming-start' }
>;

export type ToolCallDeltaChunk<T extends ToolSet = GenericToolSet> = Extract<
  TextStreamPart<T>,
  { type: 'tool-call-delta' }
>;

export type ToolResultChunk<T extends ToolSet = GenericToolSet> = Extract<
  TextStreamPart<T>,
  { type: 'tool-result' }
>;

export type StepFinishChunk<T extends ToolSet = GenericToolSet> = Extract<
  TextStreamPart<T>,
  { type: 'step-finish' }
>;

export type FinishChunk<T extends ToolSet = GenericToolSet> = Extract<
  TextStreamPart<T>,
  { type: 'finish' }
>;

/**
 * Tool result validation helpers
 * These provide safe ways to determine tool status from results
 */
export function isErrorResult(result: unknown): boolean {
  // String-based error detection
  if (typeof result === 'string') {
    const lowerResult = result.toLowerCase();
    return (
      lowerResult.includes('error') ||
      lowerResult.includes('failed') ||
      lowerResult.includes('exception')
    );
  }

  // Object-based error detection
  if (result && typeof result === 'object') {
    const resultObj = result as Record<string, unknown>;
    return !!(resultObj.error || resultObj.success === false || resultObj.status === 'error');
  }

  return false;
}

export function determineToolStatus(result: unknown): 'completed' | 'failed' {
  return isErrorResult(result) ? 'failed' : 'completed';
}

/**
 * Zod schemas for runtime validation
 */
export const TextContentSchema = z
  .object({
    type: z.literal('text'),
    text: z.string(),
  })
  .strict();

export const ToolCallContentSchema = z
  .object({
    type: z.literal('tool-call'),
    toolCallId: z.string(),
    toolName: z.string(),
    args: z.record(z.unknown()),
  })
  .strict();

export const ToolResultContentSchema = z
  .object({
    type: z.literal('tool-result'),
    toolCallId: z.string(),
    toolName: z.string(),
    result: z.unknown(),
  })
  .strict();

export const AssistantMessageContentSchema = z.union([TextContentSchema, ToolCallContentSchema]);

/**
 * Safe type assertion helpers
 */
export function assertTextContent(content: unknown): TextContent {
  const result = TextContentSchema.safeParse(content);
  if (!result.success) {
    throw new Error(`Invalid text content: ${result.error.message}`);
  }
  return result.data as TextContent;
}

export function assertToolCallContent(content: unknown): ToolCallContent {
  const result = ToolCallContentSchema.safeParse(content);
  if (!result.success) {
    throw new Error(`Invalid tool call content: ${result.error.message}`);
  }
  return result.data as ToolCallContent;
}

export function assertToolResultContent(content: unknown): ToolResultContent {
  const result = ToolResultContentSchema.safeParse(content);
  if (!result.success) {
    throw new Error(`Invalid tool result content: ${result.error.message}`);
  }
  return result.data as ToolResultContent;
}

/**
 * Type-safe interfaces for tool arguments
 */
export interface SequentialThinkingArgs {
  thought: string;
  nextThoughtNeeded?: boolean;
}

export interface CreateMetricsArgs {
  files: Array<{
    name?: string;
    yml_content?: string;
  }>;
}

export interface CreateDashboardsArgs {
  files: Array<{
    name?: string;
    yml_content?: string;
  }>;
}

export interface ModifyMetricsArgs {
  files: Array<{
    id: string;
    name: string;
    yml_content?: string;
  }>;
}

export interface ModifyDashboardsArgs {
  files: Array<{
    id: string;
    name: string;
    yml_content?: string;
  }>;
}

export interface ExecuteSqlArgs {
  sql?: string;
  queries?: Array<string | { sql: string }>;
}

export interface SubmitThoughtsArgs {
  thoughts: string;
}

/**
 * Type guards for tool arguments
 */
export function isSequentialThinkingArgs(args: unknown): args is SequentialThinkingArgs {
  return (
    typeof args === 'object' &&
    args !== null &&
    'thought' in args &&
    typeof (args as { thought: unknown }).thought === 'string'
  );
}

export function isCreateMetricsArgs(args: unknown): args is CreateMetricsArgs {
  return (
    typeof args === 'object' &&
    args !== null &&
    'files' in args &&
    Array.isArray((args as { files: unknown }).files)
  );
}

export function isCreateDashboardsArgs(args: unknown): args is CreateDashboardsArgs {
  return (
    typeof args === 'object' &&
    args !== null &&
    'files' in args &&
    Array.isArray((args as { files: unknown }).files)
  );
}

export function isModifyMetricsArgs(args: unknown): args is ModifyMetricsArgs {
  return (
    typeof args === 'object' &&
    args !== null &&
    'files' in args &&
    Array.isArray((args as { files: unknown }).files)
  );
}

export function isModifyDashboardsArgs(args: unknown): args is ModifyDashboardsArgs {
  return (
    typeof args === 'object' &&
    args !== null &&
    'files' in args &&
    Array.isArray((args as { files: unknown }).files)
  );
}

export function isExecuteSqlArgs(args: unknown): args is ExecuteSqlArgs {
  return typeof args === 'object' && args !== null && ('sql' in args || 'queries' in args);
}

export function isSubmitThoughtsArgs(args: unknown): args is SubmitThoughtsArgs {
  return (
    typeof args === 'object' &&
    args !== null &&
    'thoughts' in args &&
    typeof (args as { thoughts: unknown }).thoughts === 'string'
  );
}

/**
 * Helper to safely access SQL query string from unknown query
 */
export function extractSqlFromQuery(query: unknown): string {
  if (typeof query === 'string') {
    return query;
  }
  if (typeof query === 'object' && query !== null && 'sql' in query) {
    const sqlObj = query as { sql: unknown };
    return typeof sqlObj.sql === 'string' ? sqlObj.sql : String(sqlObj.sql);
  }
  return String(query);
}

/**
 * Type guards for reasoning entry types
 */
export function hasStatus(entry: unknown): entry is { status: 'loading' | 'completed' | 'failed' } {
  return (
    typeof entry === 'object' &&
    entry !== null &&
    'status' in entry &&
    typeof (entry as { status: unknown }).status === 'string'
  );
}

export function hasSecondaryTitle(entry: unknown): entry is { secondary_title?: string } {
  return typeof entry === 'object' && entry !== null && 'secondary_title' in entry;
}

export function hasFiles(entry: unknown): entry is { files: Record<string, { status?: string }> } {
  return (
    typeof entry === 'object' &&
    entry !== null &&
    'files' in entry &&
    typeof (entry as { files: unknown }).files === 'object' &&
    (entry as { files: unknown }).files !== null
  );
}
