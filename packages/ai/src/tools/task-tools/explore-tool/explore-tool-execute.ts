import { randomUUID } from 'node:crypto';
import type { ModelMessage } from 'ai';
import { wrapTraced } from 'braintrust';
import { Haiku35 } from '../../../llm/haiku-3-5';
import type { ExploreToolContext, ExploreToolInput, ExploreToolOutput } from './explore-tool';

/**
 * Creates the execute function for the explore tool
 * This function creates a new agent instance configured with Haiku 3.5
 * optimized for fast, cost-effective search, research, and exploration tasks
 */
export function createExploreToolExecute(context: ExploreToolContext) {
  return wrapTraced(
    async function execute(input: ExploreToolInput): Promise<ExploreToolOutput> {
      const { createAgent } = context;
      const { prompt } = input;

      try {
        // Create a new agent instance for exploration using Haiku 3.5
        const exploreAgent = createAgent({
          folder_structure: '',
          userId: 'explore',
          chatId: randomUUID(),
          dataSourceId: '',
          organizationId: 'explore',
          messageId: randomUUID(),
          // Pass flag to indicate this is a subagent (prevents infinite recursion)
          isSubagent: true,
          // Use Haiku 3.5 for fast, cost-effective exploration
          model: Haiku35,
        });

        // Create the user message with the exploration prompt
        const messages: ModelMessage[] = [
          {
            role: 'user',
            content: prompt,
          },
        ];

        // Run the explore agent
        const stream = await exploreAgent.stream({ messages });

        // Consume the stream to trigger tool execution and collect text response
        let fullResponse = '';
        for await (const part of stream.fullStream) {
          if (part.type === 'text-delta') {
            fullResponse += part.text;
          }
        }

        // Generate findings from the final response
        const findings = fullResponse || 'Exploration completed';

        return {
          status: 'success',
          findings,
        };
      } catch (error) {
        return {
          status: 'error',
          error_message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    },
    { name: 'explore-execute' }
  );
}
