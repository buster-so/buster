import type { ModelMessage } from 'ai';
import { wrapTraced } from 'braintrust';
import { createAnalyticsEngineerAgent } from '../../../agents';
import type { AnalyticsEngineerAgentOptions } from '../../../agents/analytics-engineer-agent/types';
import { DEFAULT_ANALYTICS_ENGINEER_OPTIONS } from '../../../llm/providers/gateway';
import CREATE_AGENTS_MD_TASK_PROMPT from './create-agents-md-task-prompt.txt';
import type { CreateAgentsMdStepInput } from './types';

export async function createAgentsMdStep(input: CreateAgentsMdStepInput) {
  return wrapTraced(
    async () => {
      await createAgentsMd(input);
    },
    {
      name: 'Create Agents MD Step',
    }
  )();
}

export async function createAgentsMd(input: CreateAgentsMdStepInput): Promise<void> {
  const messages: ModelMessage[] = [
    {
      role: 'user',
      content: CREATE_AGENTS_MD_TASK_PROMPT,
      providerOptions: DEFAULT_ANALYTICS_ENGINEER_OPTIONS,
    },
  ];

  const analyticsEngineerAgentOptions: AnalyticsEngineerAgentOptions = {
    chatId: input.chatId,
    messageId: input.messageId,
    userId: input.userId,
    organizationId: input.organizationId,
    dataSourceId: input.dataSourceId,
    todosList: [],
    isInResearchMode: false,
  };

  const analyticsEngineerAgent = createAnalyticsEngineerAgent(analyticsEngineerAgentOptions);

  const stream = await analyticsEngineerAgent.stream({ messages });

  for await (const _chunk of stream.fullStream) {
  }

  return;
}
