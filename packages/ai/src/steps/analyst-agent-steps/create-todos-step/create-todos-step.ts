import { streamObject } from 'ai';
import type { ModelMessage } from 'ai';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';
import { Sonnet4 } from '../../../llm/sonnet-4';
import { getCreateTodosSystemMessage } from './get-create-todos-system-message';

// Zod schemas first - following Zod-first approach
export const createTodosParamsSchema = z.object({
  messages: z.array(z.custom<ModelMessage>()).describe('The conversation history'),
  messageId: z.string().describe('The message ID for database updates'),
});

export const createTodosResultSchema = z.object({
  todos: z.string().describe('The TODO list in markdown format with checkboxes'),
  messages: z
    .array(z.custom<ModelMessage>())
    .describe('Tool call and result messages for the TODO creation'),
});

// Context schema for passing to streaming handlers
export const createTodosContextSchema = z.object({
  messageId: z.string().describe('The message ID for database updates'),
});

// State schema for tracking streaming progress
export const createTodosStateSchema = z.object({
  entry_id: z.string().optional().describe('The unique ID for this TODO creation'),
  args: z.string().optional().describe('Accumulated streaming arguments'),
  todos: z.string().optional().describe('The extracted TODO list'),
  is_complete: z.boolean().optional().describe('Whether streaming is complete'),
  startTime: z.number().optional().describe('The start time of the TODO creation'),
});

// Schema for what the LLM returns
const llmOutputSchema = z.object({
  todos: z
    .string()
    .describe(
      'The TODO list in markdown format with checkboxes. Example: "[ ] Todo 1\n[ ] Todo 2\n[ ] Todo 3"'
    ),
});

// Export types from schemas
export type CreateTodosParams = z.infer<typeof createTodosParamsSchema>;
export type CreateTodosResult = z.infer<typeof createTodosResultSchema>;
export type CreateTodosContext = z.infer<typeof createTodosContextSchema>;
export type CreateTodosState = z.infer<typeof createTodosStateSchema>;
export type CreateTodosInput = z.infer<typeof llmOutputSchema>;

import { createTodosStepDelta } from './create-todos-step-delta';
import { createTodosStepFinish } from './create-todos-step-finish';
import { createTodosStepStart } from './create-todos-step-start';

/**
 * Generates a TODO list using the LLM with structured output and streaming
 */
async function generateTodosWithLLM(
  messages: ModelMessage[],
  context: CreateTodosContext
): Promise<string> {
  try {
    // Prepare messages for the LLM
    const systemMessage: ModelMessage = {
      role: 'system',
      content: getCreateTodosSystemMessage(),
    };

    const todosMessages: ModelMessage[] = [systemMessage, ...messages];

    // Initialize state for streaming
    const state: CreateTodosState = {
      entry_id: undefined,
      args: '',
      todos: '',
      is_complete: false,
    };

    // Create streaming handlers
    const onStreamStart = createTodosStepStart(state, context);
    const onTextDelta = createTodosStepDelta(state, context);
    const onStreamFinish = createTodosStepFinish(state, context);

    const tracedTodosGeneration = wrapTraced(
      async () => {
        // Start streaming
        await onStreamStart();

        const { object, textStream } = streamObject({
          model: await Sonnet4,
          schema: llmOutputSchema,
          messages: todosMessages,
          temperature: 0,
        });

        // Process text deltas for optimistic updates
        const deltaProcessing = (async () => {
          for await (const delta of textStream) {
            await onTextDelta(delta);
          }
        })();

        // Wait for the final object
        const result = await object;

        // Ensure all delta processing is complete before finalizing
        await deltaProcessing;

        // Finalize the reasoning message
        await onStreamFinish(result);

        return result;
      },
      {
        name: 'Generate Todos with Streaming',
      }
    );

    const result = await tracedTodosGeneration();
    return result.todos ?? '';
  } catch (llmError) {
    console.warn('[CreateTodos] LLM failed to generate valid response:', {
      error: llmError instanceof Error ? llmError.message : 'Unknown error',
      errorType: llmError instanceof Error ? llmError.name : 'Unknown',
    });

    return '';
  }
}

export async function runCreateTodosStep(params: CreateTodosParams): Promise<CreateTodosResult> {
  try {
    const context: CreateTodosContext = {
      messageId: params.messageId,
    };

    const todos = await generateTodosWithLLM(params.messages, context);

    // Generate a unique ID for this tool call
    const toolCallId = `create_todos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create tool call and result messages
    const resultMessages: ModelMessage[] = [];

    // Add assistant message with tool call
    resultMessages.push({
      role: 'assistant',
      content: [
        {
          type: 'tool-call',
          toolCallId,
          toolName: 'createTodos',
          input: {},
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
          toolName: 'createTodos',
          output: {
            type: 'text',
            value: todos,
          },
        },
      ],
    });

    return {
      todos,
      messages: resultMessages,
    };
  } catch (error) {
    console.error('[create-todos-step] Unexpected error:', error);
    throw new Error(
      'Unable to create the analysis plan. Please try again or rephrase your request.'
    );
  }
}
