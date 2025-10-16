import type { AssistantContent, AssistantModelMessage, ModelMessage, ToolCallPart } from 'ai';
import { z } from 'zod';
import {
  createThinkAndPrepAgent,
  ThinkAndPrepAgentOptionsSchema,
  ThinkAndPrepStreamOptionsSchema,
} from '../../../agents/think-and-prep-agent/think-and-prep-agent';
import { MESSAGE_USER_CLARIFYING_QUESTION_TOOL_NAME } from '../../../tools/communication-tools/message-user-clarifying-question/message-user-clarifying-question';
import { RESPOND_WITHOUT_ASSET_CREATION_TOOL_NAME } from '../../../tools/communication-tools/respond-without-asset-creation/respond-without-asset-creation-tool';
import { withAgentRetry } from '../../../utils/with-agent-retry';

export const RunThinkAndPrepAgentStepInputSchema = z.object({
  options: ThinkAndPrepAgentOptionsSchema,
  streamOptions: ThinkAndPrepStreamOptionsSchema,
});

export const RunThinkAndPrepAgentStepOutputSchema = z.object({
  messages: z.array(z.custom<ModelMessage>()),
  earlyTermination: z
    .boolean()
    .describe('Whether the agent terminated early with a clarifying question or direct response'),
});

export type RunThinkAndPrepAgentStepInput = z.infer<typeof RunThinkAndPrepAgentStepInputSchema>;
export type RunThinkAndPrepAgentStepOutput = z.infer<typeof RunThinkAndPrepAgentStepOutputSchema>;

export async function runThinkAndPrepAgentStep({
  options,
  streamOptions,
}: RunThinkAndPrepAgentStepInput): Promise<RunThinkAndPrepAgentStepOutput> {
  try {
    console.info('[runThinkAndPrepAgentStep] Starting agent stream', {
      messageId: options?.messageId,
      messageCount: streamOptions.messages.length,
    });

    // Create the agent and wrap it with retry logic
    const thinkAndPrepAgent = withAgentRetry(createThinkAndPrepAgent(options), {
      messageId: options.messageId,
      maxAttempts: 3,
      baseDelayMs: 2000,
      onRetry: (attempt, recoveredMessageCount) => {
        console.info('Think and Prep Agent step retrying after error', {
          messageId: options.messageId,
          attempt,
          recoveredMessageCount,
        });
      },
    });

    const result = await thinkAndPrepAgent.stream(streamOptions);

    console.info('[runThinkAndPrepAgentStep] Stream started, consuming stream', {
      messageId: options?.messageId,
    });

    // Consume the text stream to ensure the agent continues processing
    if (result.textStream) {
      for await (const _ of result.textStream) {
        // We don't need to do anything with the text chunks,
        // just consume them to keep the stream flowing
      }
    }

    console.info('[runThinkAndPrepAgentStep] Stream consumed, awaiting response', {
      messageId: options?.messageId,
    });

    const response = await result.response;

    console.info('[runThinkAndPrepAgentStep] Response received', {
      messageId: options?.messageId,
      hasResponse: !!response,
      hasMessages: !!response?.messages,
      messageCount: response?.messages?.length,
    });

    if (!response || !Array.isArray(response.messages)) {
      throw new Error(
        'Think and prep agent returned an invalid response shape (missing messages array)'
      );
    }

    // Check if the agent terminated early with a clarifying question or direct response
    console.info('[runThinkAndPrepAgentStep] DEBUG: Checking for early termination', {
      messageId: options?.messageId,
      totalMessages: response.messages.length,
      MESSAGE_USER_CLARIFYING_QUESTION_TOOL_NAME,
      RESPOND_WITHOUT_ASSET_CREATION_TOOL_NAME,
    });

    let earlyTermination = false;

    for (const message of response.messages) {
      if (message.role === 'assistant') {
        const assistantMessage = message as AssistantModelMessage;
        if (assistantMessage.content) {
          const content = assistantMessage.content as AssistantContent;
          if (Array.isArray(content)) {
            for (const part of content) {
              if (part.type === 'tool-call') {
                const toolCall = part as ToolCallPart;
                if (
                  toolCall.toolName === MESSAGE_USER_CLARIFYING_QUESTION_TOOL_NAME ||
                  toolCall.toolName === RESPOND_WITHOUT_ASSET_CREATION_TOOL_NAME
                ) {
                  earlyTermination = true;
                  break;
                }
              }
            }
          }
        }
      }
    }

    console.info('[runThinkAndPrepAgentStep] DEBUG: Early termination check complete', {
      messageId: options?.messageId,
      earlyTermination,
    });

    return {
      messages: response.messages,
      earlyTermination,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : typeof error === 'string' ? error : 'Unknown error';

    console.error('runThinkAndPrepAgentStep error', {
      message: errorMessage,
      messageId: options?.messageId,
    });

    throw error;
  }
}
