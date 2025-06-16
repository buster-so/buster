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
    typeof (content as any).text === 'string'
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
 * Type predicates for streaming chunk types
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
    return !!(
      resultObj.error ||
      resultObj.success === false ||
      resultObj.status === 'error'
    );
  }

  return false;
}

export function determineToolStatus(result: unknown): 'completed' | 'failed' {
  return isErrorResult(result) ? 'failed' : 'completed';
}

/**
 * Zod schemas for runtime validation
 */
export const TextContentSchema = z.object({
  type: z.literal('text'),
  text: z.string(),
});

export const ToolCallContentSchema = z.object({
  type: z.literal('tool-call'),
  toolCallId: z.string(),
  toolName: z.string(),
  args: z.record(z.unknown()),
});

export const ToolResultContentSchema = z.object({
  type: z.literal('tool-result'),
  toolCallId: z.string(),
  toolName: z.string(),
  result: z.unknown(),
});

export const AssistantMessageContentSchema = z.union([
  TextContentSchema,
  ToolCallContentSchema,
]);

/**
 * Safe type assertion helpers
 */
export function assertTextContent(content: unknown): TextContent {
  const result = TextContentSchema.safeParse(content);
  if (!result.success) {
    throw new Error(`Invalid text content: ${result.error.message}`);
  }
  return result.data;
}

export function assertToolCallContent(content: unknown): ToolCallContent {
  const result = ToolCallContentSchema.safeParse(content);
  if (!result.success) {
    throw new Error(`Invalid tool call content: ${result.error.message}`);
  }
  return result.data;
}

export function assertToolResultContent(content: unknown): ToolResultContent {
  const result = ToolResultContentSchema.safeParse(content);
  if (!result.success) {
    throw new Error(`Invalid tool result content: ${result.error.message}`);
  }
  return result.data;
}