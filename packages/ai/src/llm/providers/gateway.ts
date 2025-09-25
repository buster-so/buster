import { createGateway } from '@ai-sdk/gateway';
import { wrapLanguageModel } from 'ai';
import { BraintrustMiddleware } from 'braintrust';

export const DEFAULT_ANTHROPIC_OPTIONS = {
  gateway: {
    order: ['bedrock', 'anthropic', 'vertex'],
  },
  headers: {},
  anthropic: { cacheControl: { type: 'ephemeral' } },
};

export const DEFAULT_OPENAI_OPTIONS = {
  gateway: {
    order: ['openai'],
  },
  openai: {
    parallelToolCalls: false,
    reasoningEffort: 'minimal',
    verbosity: 'low',
  },
};

// Create gateway instance
const gateway = createGateway({
  ...(process.env.AI_GATEWAY_API_KEY && { apiKey: process.env.AI_GATEWAY_API_KEY }),
});

// Export a function that creates wrapped models with Braintrust middleware
export const gatewayModel = (modelId: string) => {
  return wrapLanguageModel({
    model: gateway(modelId),
    middleware: BraintrustMiddleware({ debug: true }),
  });
};
