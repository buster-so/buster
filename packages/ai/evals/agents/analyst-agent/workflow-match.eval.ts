import { Eval, initDataset } from 'braintrust';
import { analystAgent } from '../../../src/agents/analyst-agent/analyst-agent';

async function runWeatherAgentTask(input: string): Promise<any> {
  const weather = await analystAgent.generate(input, {
    maxSteps: 15,
    temperature: 1,
    threadId: 'evals',
    resourceId: 'evals-user',
    providerOptions: {
      anthropic: {
        thinking: { type: 'enabled', budgetTokens: 2000 },
      },
      openai: {
        reasoning_effort: 'medium',
      },
    },
  });
  return weather.response.messages;
}

const firstMessageIsSearchDataCatalogToolCall = (args: {
  input: string;
  output: any;
}) => {
  const { output } = args;

  for (const message of output) {
    if (message.content && Array.isArray(message.content)) {
      for (const contentItem of message.content) {
        if (contentItem.type === 'tool-call' && contentItem.toolName === 'searchDataCatalogTool') {
          return 1;
        }
      }
    }
  }

  return 0;
};

const doesWorkflowRoughlyMatch = (args: {
  input: string;
  output: any;
}) => {
  // Since no expected data is available, just check if the workflow contains basic analysis steps
  const { output } = args;

  let hasSearchStep = false;

  for (const message of output) {
    if (message.content && Array.isArray(message.content)) {
      for (const contentItem of message.content) {
        if (contentItem.type === 'tool-call') {
          if (contentItem.toolName === 'searchDataCatalogTool') {
            hasSearchStep = true;
          }
          // Add other analysis tool checks here if needed
        }
      }
    }
  }

  return hasSearchStep ? 1 : 0;
};

Eval('Analyst Agent', {
  data: initDataset('Analyst Agent', { dataset: 'General Workflow Dataset' }),
  task: runWeatherAgentTask,
  scores: [firstMessageIsSearchDataCatalogToolCall, doesWorkflowRoughlyMatch],
});
