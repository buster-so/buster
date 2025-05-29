import { LLMClassifierFromTemplate } from 'autoevals';
import { Eval } from 'braintrust';
import { weatherAgent } from '../src/agents/weather-agent';

// Types for weather agent message structure
type ContentItem =
  | { type: 'reasoning'; text: string }
  | { type: 'tool-call'; args: Record<string, any>; toolCallId: string; toolName: string }
  | { type: 'tool-result'; result: Record<string, any>; toolCallId: string; toolName: string }
  | { type: 'text'; text: string };

type WeatherAgentMessage = {
  id: string;
  role: 'assistant' | 'tool' | 'user';
  content: ContentItem[];
};

type WeatherAgentMessages = WeatherAgentMessage[];

async function runWeatherAgentTask(input: string): Promise<any> {
  const weather = await weatherAgent.generate(input, {
    maxSteps: 15,
    temperature: 1,
    threadId: 'evals',
    resourceId: 'evals-user',
    providerOptions: {
      anthropic: {
        thinking: { type: 'enabled', budgetTokens: 2000 },
      },
    },
  });
  return weather.response.messages;
}

const firstMessageIsToolCall = (args: {
  input: string;
  output: WeatherAgentMessages;
  expected: WeatherAgentMessages;
}) => {
  const { output } = args;

  for (const message of output) {
    if (message.content && Array.isArray(message.content)) {
      for (const contentItem of message.content) {
        if (contentItem.type === 'tool-call' && contentItem.toolName === 'weatherTool') {
          return 1;
        }
      }
    }
  }

  return 0;
};

const doesWorkflowRoughlyMatch = (args: {
  input: string;
  output: WeatherAgentMessages;
  expected: WeatherAgentMessages;
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
    return [
      {
        input: 'SLC, Utah',
        expected: [
          {
            id: 'msg-G7pwiw0dlv7nNN7IviWxqAAf',
            role: 'assistant' as const,
            content: [
              {
                type: 'reasoning' as const,
                text: 'The user is asking for weather information for "SLC, Utah" again. SLC is commonly known as the abbreviation for Salt Lake City. I should use the weatherTool to get the current weather information for Salt Lake City.',
              },
              {
                type: 'tool-call' as const,
                args: {
                  location: 'Salt Lake City',
                },
                toolCallId: 'toolu_01HD5YiPgzjMCFC61TNSM4wm',
                toolName: 'weatherTool',
              },
            ],
          },
          {
            id: 'msg-gAmmrwMQvZcufnn6pAQijM8Y',
            role: 'tool' as const,
            content: [
              {
                type: 'tool-result' as const,
                result: {
                  conditions: 'Clear sky',
                  feelsLike: 23.6,
                  humidity: 24,
                  location: 'Salt Lake City',
                  temperature: 26.7,
                  windGust: 18.7,
                  windSpeed: 14.8,
                },
                toolCallId: 'toolu_01HD5YiPgzjMCFC61TNSM4wm',
                toolName: 'weatherTool',
              },
            ],
          },
          {
            id: 'msg-NgHm2OIkdlFRztPGt53JKm1N',
            role: 'assistant' as const,
            content: [
              {
                type: 'text' as const,
                text: 'Here\'s the current weather for Salt Lake City, Utah:\n\n**Temperature:** 26.7°F (feels like 23.6°F)\n**Conditions:** Clear sky\n**Humidity:** 24%\n**Wind:** 14.8 mph with gusts up to 18.7 mph\n\nThe conditions have improved slightly - it\'s now showing "clear sky" instead of "mainly clear," and the humidity has dropped to 24%. The temperature remains steady at 26.7°F. Still a cold but beautiful clear winter day in Salt Lake City!',
              },
            ],
          },
        ] satisfies WeatherAgentMessages,
      },
    ];
  },
  task: runWeatherAgentTask,
  metadata: {
    experimentName: 'weather-agent',
  },
  scores: [firstMessageIsToolCall, doesWorkflowRoughlyMatch],
});
