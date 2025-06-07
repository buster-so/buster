import { createStep } from '@mastra/core';
import type { RuntimeContext } from '@mastra/core/runtime-context';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';
import { analystAgent } from '../agents/analyst-agent/analyst-agent';
import { saveConversationHistoryFromStep } from '../utils/database/saveConversationHistory';
import { ThinkAndPrepOutputSchema } from '../utils/memory/types';
import type {
  AnalystRuntimeContext,
  thinkAndPrepWorkflowInputSchema,
} from '../workflows/analyst-workflow';

const inputSchema = ThinkAndPrepOutputSchema;

const outputSchema = z.object({});

const analystExecution = async ({
  inputData,
  runtimeContext,
}: {
  inputData: z.infer<typeof inputSchema>;
  getInitData: () => Promise<z.infer<typeof thinkAndPrepWorkflowInputSchema>>;
  runtimeContext: RuntimeContext<AnalystRuntimeContext>;
}): Promise<z.infer<typeof outputSchema>> => {
  const abortController = new AbortController();

  try {
    const resourceId = runtimeContext.get('userId');
    const threadId = runtimeContext.get('threadId');

    if (!resourceId || !threadId) {
      throw new Error('Unable to access your session. Please refresh and try again.');
    }

    // Messages come directly from think-and-prep step output
    // They are already in CoreMessage[] format
    const messages = inputData.outputMessages;

    const wrappedStream = wrapTraced(
      async () => {
        const stream = await analystAgent.stream(messages, {
          threadId,
          resourceId,
          runtimeContext,
          toolChoice: 'required',
          abortSignal: abortController.signal,
          onStepFinish: async (step) => {
            // Save conversation history to database on each step
            await saveConversationHistoryFromStep(runtimeContext, step.response.messages);
          },
        });

        return stream;
      },
      {
        name: 'Analyst',
        spanAttributes: {
          messageCount: messages.length,
          previousStep: {
            toolsUsed: inputData.metadata?.toolsUsed,
            finalTool: inputData.metadata?.finalTool,
            hasReasoning: !!inputData.metadata?.reasoning,
          },
        },
      }
    );

    const stream = await wrappedStream();

    for await (const chunk of stream.fullStream) {
      if (chunk.type === 'tool-result' && chunk.toolName === 'doneTool') {
        abortController.abort();
        return {};
      }
    }

    return {};
  } catch (error) {
    // Handle abort errors gracefully
    if (error instanceof Error && error.name === 'AbortError') {
      // This is expected when we abort the stream
      return {};
    }

    console.error('Error in analyst step:', error);

    // Check if it's a database connection error
    if (error instanceof Error && error.message.includes('DATABASE_URL')) {
      throw new Error('Unable to connect to the analysis service. Please try again later.');
    }

    // Check if it's an API/model error
    if (
      error instanceof Error &&
      (error.message.includes('API') || error.message.includes('model'))
    ) {
      throw new Error(
        'The analysis service is temporarily unavailable. Please try again in a few moments.'
      );
    }

    // For unexpected errors, provide a generic friendly message
    throw new Error(
      'Something went wrong during the analysis. Please try again or contact support if the issue persists.'
    );
  }
};

export const analystStep = createStep({
  id: 'analyst',
  description: 'This step runs the analyst agent to analyze data and create metrics or dashboards.',
  inputSchema,
  outputSchema,
  execute: analystExecution,
});
