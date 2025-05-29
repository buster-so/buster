import { anthropic } from '@ai-sdk/anthropic';
import { Agent } from '@mastra/core/agent';
import { LibSQLStore } from '@mastra/libsql';
import { Memory } from '@mastra/memory';
import { weatherTool } from '../tools/weather-tool';

import { initLogger, wrapAISDKModel } from 'braintrust';

initLogger({
  apiKey: process.env.BRAINTRUST_KEY,
  projectName: 'Weather Agent',
});

// const _bedrock = createAmazonBedrock({
//   region: 'us-east-1',
//   credentialProvider: fromNodeProviderChain(),
// });

// const _litellm = createOpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
//   baseURL: process.env.LLM_BASE_URL,
//   compatibility: 'compatible',
// });

export const weatherAgent = new Agent({
  name: 'Weather Agent',
  instructions: `
      You are a helpful weather assistant that provides accurate weather information.

      Your primary function is to help users get weather details for specific locations. When responding:
      - Always ask for a location if none is provided
      - If the location name isn't in English, please translate it
      - If giving a location with multiple parts (e.g. "New York, NY"), use the most relevant part (e.g. "New York")
      - Include relevant details like humidity, wind conditions, and precipitation
      - Keep responses concise but informative

      Use the weatherTool to fetch current weather data.
`,
  model: wrapAISDKModel(anthropic('claude-sonnet-4-20250514', {})),
  tools: { weatherTool },
  memory: new Memory({
    storage: new LibSQLStore({
      url: 'file:../mastra.db', // path is relative to the .mastra/output directory
    }),
  }),
});
