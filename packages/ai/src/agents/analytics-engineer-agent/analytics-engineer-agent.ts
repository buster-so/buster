import { type ModelMessage, stepCountIs, streamText } from 'ai';
import { currentSpan, wrapTraced } from 'braintrust';
import { DEFAULT_ANALYTICS_ENGINEER_OPTIONS } from '../../llm/providers/gateway';
import { Sonnet4 } from '../../llm/sonnet-4';
import { createAnalyticsEngineerToolset } from './create-analytics-engineer-toolset';
import {
  getDocsAgentSystemPrompt as getAnalyticsEngineerAgentSystemPrompt,
  getAnalyticsEngineerSubagentSystemPrompt,
} from './get-analytics-engineer-agent-system-prompt';
import type { AnalyticsEngineerAgentOptions, AnalyticsEngineerAgentStreamOptions } from './types';

export const ANALYST_ENGINEER_AGENT_NAME = 'analyticsEngineerAgent';

const STOP_CONDITIONS = [stepCountIs(250)];

export function createAnalyticsEngineerAgent(
  analyticsEngineerAgentOptions: AnalyticsEngineerAgentOptions
) {
  // Use subagent prompt if this is a subagent, otherwise use main agent prompt
  const promptFunction = analyticsEngineerAgentOptions.isSubagent
    ? getAnalyticsEngineerSubagentSystemPrompt
    : getAnalyticsEngineerAgentSystemPrompt;

  // Main system prompt
  const systemMessage = {
    role: 'system',
    content: promptFunction(),
    providerOptions: DEFAULT_ANALYTICS_ENGINEER_OPTIONS,
  } as ModelMessage;

  async function stream({ messages }: AnalyticsEngineerAgentStreamOptions) {
    const toolSet = await createAnalyticsEngineerToolset(analyticsEngineerAgentOptions);

    return wrapTraced(
      () => {
        // Log metadata for Braintrust tracing (similar to trigger analyst-agent-task)
        currentSpan().log({
          metadata: {
            chatId: analyticsEngineerAgentOptions.chatId,
            messageId: analyticsEngineerAgentOptions.messageId,
            userId: analyticsEngineerAgentOptions.userId,
            organizationId: analyticsEngineerAgentOptions.organizationId,
            dataSourceId: analyticsEngineerAgentOptions.dataSourceId,
          },
        });

        return streamText({
          model: analyticsEngineerAgentOptions.model || Sonnet4,
          providerOptions: DEFAULT_ANALYTICS_ENGINEER_OPTIONS,
          headers: {
            'anthropic-beta':
              'fine-grained-tool-streaming-2025-05-14,context-1m-2025-08-07,interleaved-thinking-2025-05-14',
          },
          tools: toolSet,
          messages: [systemMessage, ...messages],
          stopWhen: STOP_CONDITIONS,
          maxOutputTokens: 64000,
          // temperature: 0,
          onError: ({ error }) => {
            // Log error with context for debugging
            console.error('Analytics Engineer Agent streaming error:', {
              error,
              chatId: analyticsEngineerAgentOptions.chatId,
              messageId: analyticsEngineerAgentOptions.messageId,
            });
          },
        });
      },
      {
        name: 'Analytics Engineer Agent',
      }
    )();
  }

  return {
    stream,
  };
}
