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
      const { projectDirectory, createAgent } = context;
      const { description, prompt } = input;

      console.info(`Starting task: ${description}`);

      try {
        // Create a new agent instance for the task
        const taskAgent = createAgent({
          folder_structure: projectDirectory,
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
        const summary = fullResponse || 'Task completed';

        console.info(`Task completed successfully: ${description}`);

        return {
          status: 'success',
          summary: summary.substring(0, 2000), // Limit summary length
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Task error (${description}):`, errorMessage);

        return {
          status: 'error',
          error_message: errorMessage,
        };
      }
    },
    { name: 'task-execute' }
  );
}
