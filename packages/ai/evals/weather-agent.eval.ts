import { Levenshtein } from 'autoevals';
import { Eval } from 'braintrust';
import { weatherAgent } from '../src/agents/weather-agent';

Eval(
  'Weather Agent', // Replace with your project name
  {
    data: () => {
      return [
        {
          input: 'SLC, Utah',
          expected: 'The weather in SLC, Utah is sunny with a temperature of 70 degrees.',
        },
      ]; // Replace with your eval dataset
    },
    task: async (input) => {
      const weather = await weatherAgent.generate(input, {});
      return weather.text;
    },
    scores: [Levenshtein],
  }
);
