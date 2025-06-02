import { LLMClassifierFromTemplate } from 'autoevals';
import { Eval } from 'braintrust';
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
        reasoning_effort: 'high',
      },
    },
  });
  return weather.response.messages;
}

const firstMessageIsSearchDataCatalogToolCall = (args: {
  input: string;
  output: any;
  expected: any;
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
  expected: any;
}) => {
  const classifier = LLMClassifierFromTemplate({
    name: 'doesWorkflowRoughlyMatch',
    promptTemplate: `
    I need you to determine if the actual workflow of the agent to get weather is roughly the same as the expected workflow.

    We aren't worried about the minor details like args and stuff, but mainly trying to make sure that logically it roughly matches the steps.

    Here is the expected workflow:
    {{expected}}

    Here is the actual workflow:
    {{output}}
    `,
    choiceScores: {
      Y: 1,
      N: 0,
    },
  });

  return classifier({
    output: JSON.stringify(args.output, null, 2),
    expected: JSON.stringify(args.expected, null, 2),
  });
};

Eval('Weather Agent', {
  data: () => {
    return [];
  },
  task: runWeatherAgentTask,
  name: 'analyst-agent',
  scores: [firstMessageIsSearchDataCatalogToolCall, doesWorkflowRoughlyMatch],
});
