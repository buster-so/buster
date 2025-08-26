import { generateObject } from 'ai';
import type { ModelMessage } from 'ai';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';
import { Sonnet4 } from '../../../llm/sonnet-4';
import { getCreateDocsTodosSystemMessage } from './get-create-docs-todos-system-message';

// Zod schemas first - following Zod-first approach
export const createDocsTodosParamsSchema = z.object({
  messages: z.array(z.custom<ModelMessage>()).describe('The conversation history'),
  repositoryTree: z.string().optional().describe('The tree structure of the repository'),
});

export const createDocsTodosResultSchema = z.object({
  todos: z.string().describe('The TODO list in markdown format with checkboxes'),
  todosMessage: z.custom<ModelMessage>().describe('The TODO list message'),
});

// Export types from schemas
export type CreateDocsTodosParams = z.infer<typeof createDocsTodosParamsSchema>;
export type CreateDocsTodosResult = z.infer<typeof createDocsTodosResultSchema>;

// Schema for what the LLM returns
const llmOutputSchema = z.object({
  todos: z
    .string()
    .describe(
      'The TODO list in markdown format for the Documentation Agent. This should be a comprehensive breakdown of the user request into phased, actionable items. Format with markdown headers and checkboxes. Example: "# DBT Documentation Todo\\n\\n## Phase 1: Initial Setup\\n- [ ] Review repository structure\\n- [ ] Identify core models"'
    ),
});

/**
 * Generates a TODO list for documentation tasks using the LLM with structured output
 */
async function generateDocsTodosWithLLM(
  messages: ModelMessage[],
  repositoryTree?: string
): Promise<string> {
  try {
    // Prepare the system message
    const systemMessage: ModelMessage = {
      role: 'system',
      content: getCreateDocsTodosSystemMessage(),
    };

    // If repository tree is provided, append it to the last user message
    const messagesWithContext = [...messages];
    if (repositoryTree && messagesWithContext.length > 0) {
      const lastMessage = messagesWithContext[messagesWithContext.length - 1];
      if (lastMessage?.role === 'user') {
        messagesWithContext[messagesWithContext.length - 1] = {
          ...lastMessage,
          content: `${lastMessage.content}\n\n---\n\nREPOSITORY STRUCTURE:\n\`\`\`\n${repositoryTree}\n\`\`\``,
        };
      }
    }

    messagesWithContext.unshift(systemMessage);

    const tracedTodosGeneration = wrapTraced(
      async () => {
        const { object } = await generateObject({
          model: await Sonnet4,
          schema: llmOutputSchema,
          messages: messagesWithContext,
          temperature: 0,
        });

        return object;
      },
      {
        name: 'Generate Docs Todos',
      }
    );

    const result = await tracedTodosGeneration();
    return result.todos ?? '';
  } catch (llmError) {
    console.warn('[CreateDocsTodos] LLM failed to generate valid response:', {
      error: llmError instanceof Error ? llmError.message : 'Unknown error',
      errorType: llmError instanceof Error ? llmError.name : 'Unknown',
    });

    return '';
  }
}

export async function runCreateDocsTodosStep(
  params: CreateDocsTodosParams
): Promise<CreateDocsTodosResult> {
  try {
    const todos = await generateDocsTodosWithLLM(params.messages, params.repositoryTree);

    const todosMessage: ModelMessage = {
      role: 'assistant',
      content: todos,
    };

    return {
      todos,
      todosMessage,
    };
  } catch (error) {
    console.error('[create-docs-todos-step] Unexpected error:', error);
    throw new Error('Unable to create documentation todos. Please try again.');
  }
}
