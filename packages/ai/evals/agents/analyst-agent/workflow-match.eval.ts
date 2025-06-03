import { Eval, initDataset } from 'braintrust';
import { analystAgent } from '../../../src/agents/analyst-agent/analyst-agent';

async function runWeatherAgentTask(input: string): Promise<any> {
  const weather = await analystAgent.generate(input, {
    maxSteps: 15,
    threadId: 'evals',
    resourceId: 'evals-user',
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

Eval('Analyst Agent', {
  data: initDataset('Analyst Agent', { dataset: 'Simple' }),
  task: runWeatherAgentTask,
  scores: [firstMessageIsSearchDataCatalogToolCall],
});
