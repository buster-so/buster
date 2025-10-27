import { type ModelMessage, stepCountIs, streamText } from 'ai';
import { currentSpan, wrapTraced } from 'braintrust';
import { DEFAULT_ANALYTICS_ENGINEER_OPTIONS } from '../../llm/providers/gateway';
import { Sonnet4 } from '../../llm/sonnet-4';
import { createAnalyticsEngineerToolset } from './create-analytics-engineer-toolset';
import { createWorkingDirectoryContext } from './generate-directory-tree';
import {
  getDocsAgentSystemPrompt as getAnalyticsEngineerAgentSystemPrompt,
  getAnalyticsEngineerSubagentSystemPrompt,
} from './get-analytics-engineer-agent-system-prompt';
import { readAgentsMd } from './read-agents-md';
import { readGitCommunicationRules } from './read-git-communication-rules';
import type { AnalyticsEngineerAgentOptions, AnalyticsEngineerAgentStreamOptions } from './types';

export const ANALYST_ENGINEER_AGENT_NAME = 'analyticsEngineerAgent';

const STOP_CONDITIONS = [stepCountIs(250)];

/**
 * Helper function to add cache settings to the last message via providerOptions
 */
function addCacheToLastMessage(messages: ModelMessage[]): ModelMessage[] {
  return messages.map((msg, index) => {
    if (index === messages.length - 1) {
      return {
        ...msg,
        providerOptions: {
          ...msg.providerOptions,
          ...DEFAULT_ANALYTICS_ENGINEER_OPTIONS,
        },
      };
    }
    return msg;
  });
}

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
  } as ModelMessage;

  // Working directory context message (only for main agent, not subagent)
  // Automatically get current working directory and generate tree structure
  const workingDirectoryContextMessage = analyticsEngineerAgentOptions.isSubagent
    ? null
    : ({
        role: 'system',
        content: createWorkingDirectoryContext(process.cwd()),
      } as ModelMessage);

  async function stream({ messages }: AnalyticsEngineerAgentStreamOptions) {
    const toolSet = await createAnalyticsEngineerToolset(analyticsEngineerAgentOptions);

    // Read AGENTS.md from the working directory if it exists
    const agentsMdContent = await readAgentsMd();
    const agentsMdMessage = agentsMdContent
      ? ({
          role: 'system',
          content: `# Additional Agent Context from AGENTS.md\n\n${agentsMdContent}`,
        } as ModelMessage)
      : null;

    // Read git communication rules when in headless mode
    const gitCommunicationRulesContent = analyticsEngineerAgentOptions.isHeadlessMode
      ? await readGitCommunicationRules()
      : null;
    const gitCommunicationRulesMessage = gitCommunicationRulesContent
      ? ({
          role: 'system',
          content: gitCommunicationRulesContent,
        } as ModelMessage)
      : null;

    // Build messages array with system messages and working directory context
    const allMessages = [
      systemMessage,
      ...(workingDirectoryContextMessage ? [workingDirectoryContextMessage] : []),
      ...(agentsMdMessage ? [agentsMdMessage] : []),
      ...(gitCommunicationRulesMessage ? [gitCommunicationRulesMessage] : []),
      ...messages,
    ];

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
            workingDirectory: process.cwd(),
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
          messages: allMessages,
          stopWhen: STOP_CONDITIONS,
          maxOutputTokens: 64000,
          prepareStep: ({ messages }) => {
            return {
              messages: addCacheToLastMessage(messages),
            };
          },
          ...(analyticsEngineerAgentOptions.abortSignal && {
            abortSignal: analyticsEngineerAgentOptions.abortSignal,
          }),
          // temperature: 0,
          onError: () => {},
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
