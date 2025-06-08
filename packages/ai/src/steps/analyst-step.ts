import { createStep } from '@mastra/core';
import type { RuntimeContext } from '@mastra/core/runtime-context';
import type { CoreMessage } from 'ai';
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

const outputSchema = z.object({
  conversationHistory: z.array(z.any()), // CoreMessage[] from combined history
  finished: z.boolean().optional(),
  outputMessages: z.array(z.any()).optional(),
  stepData: z.any().optional(),
  metadata: z.any().optional(),
});

const analystExecution = async ({
  inputData,
  runtimeContext,
}: {
  inputData: z.infer<typeof inputSchema>;
  getInitData: () => Promise<z.infer<typeof thinkAndPrepWorkflowInputSchema>>;
  runtimeContext: RuntimeContext<AnalystRuntimeContext>;
}): Promise<z.infer<typeof outputSchema>> => {
  const abortController = new AbortController();
  let completeConversationHistory: CoreMessage[] = [];

  try {
    const resourceId = runtimeContext.get('userId');
    const threadId = runtimeContext.get('threadId');

    if (!resourceId || !threadId) {
      throw new Error('Unable to access your session. Please refresh and try again.');
    }

    console.log('=== ANALYST STEP INPUT ===');
    console.log('Input data keys:', Object.keys(inputData));
    console.log('Input data outputMessages length:', inputData.outputMessages?.length || 0);
    console.log('Input data outputMessages:', inputData.outputMessages);
    console.log(
      'Input data conversationHistory length:',
      inputData.conversationHistory?.length || 0
    );
    console.log('Input data conversationHistory:', inputData.conversationHistory);

    // Messages come directly from think-and-prep step output
    // They are already in CoreMessage[] format
    const messages = inputData.outputMessages as CoreMessage[];
    console.log('Messages passed to analyst agent:', messages);

    const wrappedStream = wrapTraced(
      async () => {
        const stream = await analystAgent.stream(messages, {
          runtimeContext,
          toolChoice: 'required',
          abortSignal: abortController.signal,
          onStepFinish: async (step) => {
            // Save complete conversation history to database before any abort (think-and-prep + analyst messages)
            const analystResponseMessages = step.response.messages as CoreMessage[];
            completeConversationHistory = [
              ...(inputData.outputMessages as CoreMessage[]),
              ...analystResponseMessages,
            ];
            console.log('=== ANALYST STEP: SAVING CONVERSATION HISTORY ===');
            console.log('Think-and-prep messages:', inputData.outputMessages.length);
            console.log('Analyst step messages:', step.response.messages.length);
            console.log(
              'Complete conversation history length:',
              completeConversationHistory.length
            );

            try {
              await saveConversationHistoryFromStep(
                runtimeContext as any,
                completeConversationHistory
              );
            } catch (error) {
              console.error('Failed to save analyst conversation history:', error);
              // Continue with abort even if save fails to avoid hanging
            }

            // Check if doneTool was called and abort after saving
            const toolNames = step.toolCalls.map((call) => call.toolName);
            if (toolNames.includes('doneTool')) {
              abortController.abort();
            }
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
        console.log('=== ANALYST STEP OUTPUT (TOOL RESULT) ===');
        console.log('Complete conversation history length:', completeConversationHistory.length);
        console.log('Complete conversation history:', completeConversationHistory);

        // Don't abort here anymore - let onStepFinish handle it after saving
        return {
          conversationHistory: completeConversationHistory,
          finished: true,
          outputMessages: completeConversationHistory,
        };
      }
    }

    console.log('=== ANALYST STEP OUTPUT (END) ===');
    console.log('Complete conversation history length:', completeConversationHistory.length);
    console.log('Complete conversation history:', completeConversationHistory);

    return {
      conversationHistory: completeConversationHistory,
      finished: true,
      outputMessages: completeConversationHistory,
    };
  } catch (error) {
    // Handle abort errors gracefully
    if (error instanceof Error && error.name === 'AbortError') {
      console.log('=== ANALYST STEP OUTPUT (ABORT ERROR) ===');
      console.log('Complete conversation history length:', completeConversationHistory.length);
      console.log('Complete conversation history:', completeConversationHistory);

      // This is expected when we abort the stream
      return {
        conversationHistory: completeConversationHistory,
        finished: true,
        outputMessages: completeConversationHistory,
      };
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
