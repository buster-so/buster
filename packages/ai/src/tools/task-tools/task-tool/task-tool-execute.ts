import { randomUUID } from 'node:crypto';
import type { ModelMessage } from 'ai';
import { wrapTraced } from 'braintrust';
import type { TaskToolContext, TaskToolInput, TaskToolOutput } from './task-tool';

/**
 * Creates the execute function for the task tool
 * This function creates a new agent instance and runs it with the provided instructions
 */
export function createTaskToolExecute(context: TaskToolContext) {
  return wrapTraced(
    async function execute(input: TaskToolInput): Promise<TaskToolOutput> {
      const { createAgent } = context;
      const { prompt } = input;

      try {
        // Create a new agent instance for the task
        const taskAgent = createAgent({
          folder_structure: '',
          userId: 'task',
          chatId: randomUUID(),
          dataSourceId: '',
          organizationId: 'task',
          messageId: randomUUID(),
          // Pass flag to indicate this is a subagent (prevents infinite recursion)
          isSubagent: true,
        });

        // Create the user message with the task prompt
        const messages: ModelMessage[] = [
          {
            role: 'user',
            content: prompt,
          },
        ];

        // Run the task agent
        const stream = await taskAgent.stream({ messages });

        // Consume the stream to trigger tool execution and collect text response
        let fullResponse = '';
        for await (const part of stream.fullStream) {
          if (part.type === 'text-delta') {
            fullResponse += part.text;
          }
        }

        // Generate a summary from the final response
        const _summary = fullResponse || 'Task completed'

        return {
          status: 'success',
          summary: _summary,
        };
      } catch (error) {
        return {
          status: 'error',
          error_message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    },
    { name: 'task-execute' }
  );
}
